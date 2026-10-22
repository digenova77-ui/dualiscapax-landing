import http from "node:http";
import { WebSocketServer } from "ws";

const PORT = +process.env.PORT || 8787;
const MAX = 32 * 1024;
const WIN = 60_000;
const LIM = +process.env.RATE_MAX || 10;
const LOCAL = process.env.LOCAL_VERIFIER === "1";
const map = new Map();

const limit = ip => {
  const n = Date.now();
  const e = map.get(ip) || { c: 0, r: n + WIN };
  if (n > e.r) { e.c = 0; e.r = n + WIN; }
  e.c++;
  map.set(ip, e);
  return e.c <= LIM;
};

const ip = req => req.headers["cf-connecting-ip"] || (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";

const verify = req => {
  if (LOCAL && req.headers["x-test-session"] === "valid") return { ok: true, id: "local" };
  return { ok: false, reason: (req.headers.cookie || "").includes("session=") ? "verifier-not-wired" : "no-session" };
};

const json = (res, b, s = 200) => {
  const p = JSON.stringify({ ...b, authority: "NONE" });
  res.writeHead(s, { "content-type": "application/json", "content-length": Buffer.byteLength(p) });
  res.end(p);
};

const body = req => new Promise((ok, no) => {
  const c = []; let z = 0;
  req.on("data", d => { z += d.length; if (z > MAX) { no(); req.destroy(); } else c.push(d); });
  req.on("end", () => ok(Buffer.concat(c).toString()));
  req.on("error", no);
});

const voice = async (t, id) => {
  if (!process.env.XAI_API_KEY) return { ok: false, reason: "provider-unconfigured", status: 503 };
  if (!LOCAL) return { ok: false, reason: "verifier-not-canonical", status: 503 };
  return { ok: true, data: { echo: t.slice(0, 64), subject: id, note: "local-mock" } };
};

const server = http.createServer(async (req, res) => {
  try {
    if (!limit(ip(req))) return json(res, { available: false, reason: "rate-limited" }, 429);
    const path = new URL(req.url || "/", "http://x").pathname;

    if (path === "/health") return json(res, { ok: true, localVerifier: LOCAL });

    if (path === "/iris/status") {
      const s = verify(req);
      return json(res, { available: s.ok && !!process.env.XAI_API_KEY, reason: s.ok ? (process.env.XAI_API_KEY ? "ready" : "provider-unconfigured") : s.reason });
    }

    if (path === "/sandbox/iris/turn" || path === "/sandbox/iris/speak") {
      if (req.method !== "POST") return json(res, { available: false, reason: "method-not-allowed" }, 405);
      let raw; try { raw = await body(req); } catch { return json(res, { available: false, reason: "body-too-large" }, 413); }
      const s = verify(req);
      if (!s.ok) return json(res, { available: false, reason: s.reason }, 401);
      const r = await voice(raw, s.id);
      return r.ok ? json(res, { available: true, result: r.data }) : json(res, { available: false, reason: r.reason }, r.status || 503);
    }

    res.writeHead(404); res.end("not found");
  } catch { json(res, { available: false, reason: "internal-error" }, 500); }
});

const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  if (new URL(req.url || "/", "http://x").pathname !== "/iris/rate-ws") return socket.destroy();
  wss.handleUpgrade(req, socket, head, ws => {
    const i = ip(req);
    const push = () => {
      const n = Date.now();
      const e = map.get(i) || { c: 0, r: n + WIN };
      try { ws.send(JSON.stringify({ depth: { count: e.c, max: LIM, limited: e.c > LIM, resetIn: Math.max(0, e.r - n) }, ts: n, authority: "NONE" })); } catch {}
    };
    push();
    const iv = setInterval(push, 2000);
    ws.on("close", () => clearInterval(iv));
  });
});

server.listen(PORT, "0.0.0.0", () => console.log(`:${PORT} local=${LOCAL}`));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
