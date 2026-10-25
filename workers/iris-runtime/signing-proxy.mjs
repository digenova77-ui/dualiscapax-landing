/**
 * Iris same-origin signing proxy.
 *
 * This Worker is intentionally not bound to production Pages by default.
 * It requires an authenticated session-verifier service binding and the
 * governed runtime service binding. Missing bindings fail closed.
 */
const MAX_BODY_BYTES = 65536;
const ALLOWED_ACTIONS = new Set(["iris.turn.look", "iris.turn.depth", "iris.turn.work", "iris.turn.learn"]);
const REQUEST_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "pragma": "no-cache",
      "x-content-type-options": "nosniff",
    },
  });
}

async function readJsonLimited(request) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    try { await request.body?.cancel(); } catch {}
    return { ok: false, status: 413, reason: "body-too-large" };
  }
  if (!request.body) return { ok: false, status: 400, reason: "invalid-json" };
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        try { await reader.cancel(); } catch {}
        return { ok: false, status: 413, reason: "body-too-large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, reason: "invalid-json" };
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, status: 400, reason: "invalid-json" };
  }
}

async function sha256Hex(text) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifySession(request, env) {
  if (!env.IRIS_SESSION_VERIFIER || typeof env.IRIS_SESSION_VERIFIER.fetch !== "function") {
    return { ok: false, status: 503, reason: "session-verifier-unavailable" };
  }
  const sessionToken = request.headers.get("x-iris-session-token");
  const cookie = request.headers.get("cookie");
  if (!sessionToken && !cookie) return { ok: false, status: 401, reason: "session-required" };

  let response;
  try {
    response = await env.IRIS_SESSION_VERIFIER.fetch("https://iris-session/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(sessionToken ? { "x-iris-session-token": sessionToken } : {}),
        ...(request.headers.get("authorization") ? { authorization: request.headers.get("authorization") } : {}),
      },
      body: "{}",
    });
  } catch {
    return { ok: false, status: 503, reason: "session-verifier-unavailable" };
  }
  if (!response.ok) return { ok: false, status: 401, reason: "session-invalid" };
  let data;
  try { data = await response.json(); } catch { return { ok: false, status: 503, reason: "session-verifier-invalid-response" }; }
  if (data?.authenticated !== true || typeof data.unity_id !== "string" || !data.unity_id.trim()) {
    return { ok: false, status: 401, reason: "session-invalid" };
  }
  return { ok: true, unityId: data.unity_id };
}

async function handleAuthorize(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (!origin || origin !== url.origin) return json(403, { authorized: false, reason: "same-origin-required" });
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return json(403, { authorized: false, reason: "cross-site-request-denied" });
  }
  if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
    return json(415, { authorized: false, reason: "unsupported-media-type" });
  }
  if (!env.TRINITY_HMAC_SECRET) return json(503, { authorized: false, reason: "signing-secret-unavailable" });
  if (!env.IRIS_RUNTIME || typeof env.IRIS_RUNTIME.fetch !== "function") {
    return json(503, { authorized: false, reason: "runtime-unavailable" });
  }

  const parsed = await readJsonLimited(request);
  if (!parsed.ok) return json(parsed.status, { authorized: false, reason: parsed.reason });
  const input = parsed.value;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return json(400, { authorized: false, reason: "malformed-request" });
  }
  if (typeof input.request_id !== "string" || !REQUEST_ID_RE.test(input.request_id)) {
    return json(400, { authorized: false, reason: "bad-request-id" });
  }
  if (typeof input.action !== "string" || !ALLOWED_ACTIONS.has(input.action)) {
    return json(400, { authorized: false, reason: "unknown-action" });
  }
  if (typeof input.text !== "string") return json(400, { authorized: false, reason: "text-required" });
  if (["iris.turn.depth", "iris.turn.work", "iris.turn.learn"].includes(input.action) && !input.text.trim()) {
    return json(400, { authorized: false, reason: "text-required" });
  }

  // Never trust a principal or digest supplied by browser JavaScript.
  const session = await verifySession(request, env);
  if (!session.ok) return json(session.status, { authorized: false, reason: session.reason });
  const digest = await sha256Hex(input.text);
  if (input.input_sha256 !== undefined &&
      (typeof input.input_sha256 !== "string" || input.input_sha256.toLowerCase() !== digest)) {
    return json(400, { authorized: false, reason: "input-digest-mismatch" });
  }

  const body = {
    request_id: input.request_id,
    action: input.action,
    input_sha256: digest,
    principal: { unity_id: session.unityId },
    compute_lane: typeof input.compute_lane === "string" ? input.compute_lane : input.action.slice("iris.turn.".length).toUpperCase(),
    memory_requested: input.memory_requested === true,
    text: input.text,
  };
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await hmacHex(env.TRINITY_HMAC_SECRET, timestamp + "." + JSON.stringify(body));

  let upstream;
  try {
    upstream = await env.IRIS_RUNTIME.fetch("https://iris-runtime/v1/authorize", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-timestamp": timestamp,
        "x-signature": signature,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return json(503, { authorized: false, reason: "runtime-unavailable" });
  }

  let result;
  try { result = await upstream.json(); } catch { return json(502, { authorized: false, reason: "runtime-invalid-response" }); }
  return json(upstream.status, result);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/iris/v1/authorize" && request.method === "POST") {
      return handleAuthorize(request, env);
    }
    if (url.pathname === "/api/iris/v1/authorize") {
      return json(405, { authorized: false, reason: "method-not-allowed" });
    }
    return json(404, { error: "not-found" });
  },
};
