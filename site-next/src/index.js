const ALLOW = new Set([
  "https://dualiscapax.ai",
  "https://next.dualiscapax.ai",
  "https://cdn.jsdelivr.net",
  "http://127.0.0.1:8080",
  "http://localhost:8080"
]);
const started = Date.now();
const calls = [];

function cors(origin) {
  if (!ALLOW.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin"
  };
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...cors(origin) }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });

    if (url.pathname === "/api/v2/capabilities") {
      return json({
        apiVersion: "2",
        service: "edge-kernel",
        backend: "worker",
        protocolVersion: 2,
        maxPayloadBytes: 256,
        acceptedFlags: [0],
        deterministic: true,
        arbitraryCompute: false,
        privilegedWrites: false,
        origin: "edge",
        note: "Edge adapter. Not the Manus wasm."
      }, 200, origin);
    }
    if (url.pathname === "/api/v2/provenance") {
      return json({
        kernel: "Edge DCLM adapter",
        artifact: "src/index.js",
        manus: "isolated",
        loadedAt: new Date(started).toISOString()
      }, 200, origin);
    }
    if (url.pathname === "/api/v2/metrics") {
      return json({
        requests: calls.length,
        accepted: calls.filter((c) => c.accepted).length,
        rejected: calls.filter((c) => !c.accepted).length,
        recent: calls.slice(-8).reverse(),
        uptimeSeconds: Math.floor((Date.now() - started) / 1000)
      }, 200, origin);
    }
    if (url.pathname === "/api/v2/compute" && request.method === "POST") {
      let body = {};
      try { body = await request.json(); } catch (err) { return json({ accepted: false, reason: "not-json" }, 400, origin); }
      const payload = String(body.payload || "");
      const size = new TextEncoder().encode(payload).length;
      const accepted = size <= 256 && (body.flags || 0) === 0;
      const row = { at: new Date().toISOString(), accepted, payloadBytes: size, sequence: calls.length + 1 };
      calls.push(row);
      if (!accepted) return json({ ...row, reason: "over-limit" }, 422, origin);
      return json({
        ...row,
        reason: 0,
        inputDigest: await sha256(payload),
        stateDigest: await sha256(row.sequence + ":" + payload),
        protocolVersion: 2,
        flags: 0,
        authority: "NONE"
      }, 200, origin);
    }
    return env.ASSETS.fetch(request);
  }
};
