/**
 * iris-voice-server.mjs
 * Self-contained fail-closed voice path.
 * Local mode: set LOCAL_VERIFIER=1 and use header x-test-session: valid
 * to exercise the success path without a real identity backend.
 */

import http from "node:http";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 8787);
const MAX_BODY = 32 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = Number(process.env.RATE_MAX || 10);
const LOCAL_VERIFIER = process.env.LOCAL_VERIFIER === "1";

const rateMap = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const e = rateMap.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
  if (now > e.reset) {
    e.count = 0;
    e.reset = now + RATE_WINDOW_MS;
  }
  e.count++;
  rateMap.set(ip, e);
  return { allowed: e.count <= RATE_MAX, count: e.count, reset: e.reset };
}

function getIP(req) {
  return (
    req.headers["cf-connecting-ip"] ||
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

async function verifySession(req) {
  if (LOCAL_VERIFIER && req.headers["x-test-session"] === "valid") {
    return { ok: true, subjectId: "local-test-subject" };
  }
  const cookie = req.headers.cookie || "";
  if (!cookie.includes("session=")) return { ok: false, reason: "no-session" };
  return { ok: false, reason: "verifier-not-wired" };
}

function sendJSON(res, body, status = 200) {
  const payload = JSON.stringify({ ...body, authority: "NONE" });
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("body-too-large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

async function callVoiceAPI(bodyText, subjectId) {
  if (!process.env.XAI_API_KEY) {
    return { ok: false, reason: "provider-unconfigured", status: 503 };
  }
  if (!LOCAL_VERIFIER) {
    return { ok: false, reason: "verifier-not-canonical", status: 503 };
  }
  return {
    ok: true,
    status: 200,
    data: { echo: bodyText.slice(0, 64), subject: subjectId, note: "local-mock" },
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const ip = getIP(req);
    const rl = rateLimit(ip);
    if (!rl.allowed) {
      return sendJSON(res, { available: false, reason: "rate-limited", count: rl.count }, 429);
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const path = url.pathname;

    if (path === "/health") {
      return sendJSON(res, { ok: true, localVerifier: LOCAL_VERIFIER });
    }

    if (path === "/iris/status") {
      const s = await verifySession(req);
      return sendJSON(res, {
        available: s.ok && !!process.env.XAI_API_KEY,
        reason: s.ok ? (process.env.XAI_API_KEY ? "ready" : "provider-unconfigured") : s.reason,
      });
    }

    if (path === "/sandbox/iris/turn" || path === "/sandbox/iris/speak") {
      if (req.method !== "POST") {
        return sendJSON(res, { available: false, reason: "method-not-allowed" }, 405);
      }
      let raw;
      try {
        raw = await readBody(req);
      } catch {
        return sendJSON(res, { available: false, reason: "body-too-large" }, 413);
      }
      const s = await verifySession(req);
      if (!s.ok) {
        return sendJSON(res, { available: false, reason: s.reason || "session-invalid" }, 401);
      }
      const r = await callVoiceAPI(raw, s.subjectId);
      if (!r.ok) return sendJSON(res, { available: false, reason: r.reason }, r.status || 503);
      return sendJSON(res, { available: true, result: r.data });
    }

    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  } catch (err) {
    sendJSON(res, { available: false, reason: "internal-error" }, 500);
  }
});

const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname !== "/iris/rate-ws") {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    const ip = getIP(req);
    const push = () => {
      const now = Date.now();
      const e = rateMap.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
      try {
        ws.send(
          JSON.stringify({
            depth: {
              count: e.count,
              max: RATE_MAX,
              limited: e.count > RATE_MAX,
              resetIn: Math.max(0, e.reset - now),
            },
            ts: now,
            authority: "NONE",
          })
        );
      } catch {}
    };
    push();
    const iv = setInterval(push, 2000);
    ws.on("close", () => clearInterval(iv));
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`iris-voice-server :${PORT} localVerifier=${LOCAL_VERIFIER}`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
