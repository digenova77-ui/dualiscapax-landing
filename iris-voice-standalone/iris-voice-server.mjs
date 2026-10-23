import http from "node:http";
import { WebSocketServer } from "ws";

const PORT = +process.env.PORT || 8787;
const MAX = 32768;
const WIN = 60000;
const LIM = +process.env.RATE_MAX || 10;
const LOCAL = process.env.LOCAL_VERIFIER === "1";
const map = new Map();

const limit = ip => {
  const n = Date.now();
  let e = map.get(ip);
  if (!e || n > e.r) e = { c: 0, r: n + WIN };
  e.c++;
  map.set(ip, e);
  return e.c <= LIM;
};

// Forwarded IP headers are attacker-controlled unless the service is
// reachable only through a trusted proxy. Default to the transport peer.
const ipOf = req => {
  const peer = req.socket.remoteAddress || "unknown";
  if (process.env.TRUST_PROXY_HEADERS !== "1") return peer;
  return req.headers["cf-connecting-ip"] ||
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    peer;
};

const verify = req =>
  LOCAL && req.headers["x-test-session"] === "valid"
    ? { ok: true, id: "local" }
    : { ok: false, reason: (req.headers.cookie || "").includes("session=") ? "verifier-not-wired" : "no-session" };

const send = (res, body, status = 200) => {
  const p = JSON.stringify({ ...body, authority: "NONE" });
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(p),
  });
  res.end(p);
};

const read = req =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", c => {
      size += c.length;
      if (size > MAX) {
        reject();
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });

const call = async (text, id) => {
  if (!process.env.XAI_API_KEY) return { ok: false, reason: "provider-unconfigured", status: 503 };
  if (!LOCAL) return { ok: false, reason: "verifier-not-canonical", status: 503 };
  return { ok: true, data: { echo: text.slice(0, 64), subject: id, note: "local-mock" } };
};

const server = http.createServer(async (req, res) => {
  try {
    if (!limit(ipOf(req))) return send(res, { available: false, reason: "rate-limited" }, 429);
    const { pathname } = new URL(req.url || "/", "http://localhost");

    if (pathname === "/health") return send(res, { ok: true, localVerifier: LOCAL });

    if (pathname === "/iris/status") {
      const s = verify(req);
      return send(res, {
        available: !!(s.ok && process.env.XAI_API_KEY),
        reason: s.ok ? (process.env.XAI_API_KEY ? "ready" : "provider-unconfigured") : s.reason,
      });
    }

    if (pathname === "/sandbox/iris/turn" || pathname === "/sandbox/iris/speak") {
      if (req.method !== "POST") return send(res, { available: false, reason: "method-not-allowed" }, 405);
      let raw;
      try {
        raw = await read(req);
      } catch {
        return send(res, { available: false, reason: "body-too-large" }, 413);
      }
      const s = verify(req);
      if (!s.ok) return send(res, { available: false, reason: s.reason }, 401);
      const r = await call(raw, s.id);
      return r.ok
        ? send(res, { available: true, result: r.data })
        : send(res, { available: false, reason: r.reason }, r.status || 503);
    }

    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  } catch {
    send(res, { available: false, reason: "internal-error" }, 500);
  }
});

const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  if (!limit(ipOf(req))) {
    socket.write("HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  if (new URL(req.url || "/", "http://localhost").pathname !== "/iris/rate-ws") {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, ws => {
    const ip = ipOf(req);
    const tick = () => {
      const n = Date.now();
      const e = map.get(ip) || { c: 0, r: n + WIN };
      try {
        ws.send(
          JSON.stringify({
            depth: { count: e.c, max: LIM, limited: e.c > LIM, resetIn: Math.max(0, e.r - n) },
            ts: n,
            authority: "NONE",
          })
        );
      } catch {}
    };
    tick();
    const id = setInterval(tick, 2000);
    ws.on("close", () => clearInterval(id));
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`listening ${PORT}`);
});

for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
