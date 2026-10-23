/**
 * Iris single governed runtime (staging integration unit).
 *
 * Required service bindings: IDENTITY_API, TRINITY_LAW, IRIS_MEMORY, MODEL_PROVIDER.
 * These are service bindings, not URL-based third-party calls. No binding is optional:
 * missing authority or persistence fails closed before inference.
 *
 * Adapter contracts are versioned under /v1. No secret, prompt, cookie, or user text is logged.
 */
const MAX_BODY_BYTES = 16 * 1024;
const MAX_TEXT_CHARS = 8000;
const REQUEST_ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;

const json = (body, status = 200, headers = {}) =>
  Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
      ...headers,
    },
  });

const unavailable = (stage) =>
  json({ available: false, stage, reason: "required-service-unavailable" }, 503);

function allowedOrigin(request, env) {
  const origin = request.headers.get("origin");
  const configured = String(env.IRIS_ALLOWED_ORIGINS || "")
    .split(",").map((x) => x.trim()).filter(Boolean);
  return !!origin && configured.includes(origin) ? origin : null;
}

async function callJson(binding, path, init) {
  if (!binding || typeof binding.fetch !== "function") throw new Error("binding-unavailable");
  const response = await binding.fetch(new Request("https://internal.invalid" + path, init));
  if (!response.ok) throw new Error("upstream-not-ok");
  const data = await response.json();
  if (!data || typeof data !== "object") throw new Error("invalid-upstream-response");
  return data;
}

async function readBody(request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) return null;
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return null;
  try { return JSON.parse(raw); } catch { return undefined; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      const bindings = {
        identity: !!env.IDENTITY_API,
        trinity: !!env.TRINITY_LAW,
        memory: !!env.IRIS_MEMORY,
        provider: !!env.MODEL_PROVIDER,
      };
      const complete = Object.values(bindings).every(Boolean) &&
        typeof env.IRIS_ALLOWED_ORIGINS === "string" &&
        env.IRIS_ALLOWED_ORIGINS.trim().length > 0;
      return json({
        service: "iris-governed-runtime",
        version: "1",
        available: complete,
        bindings,
        authorization: "trinity-required",
        persistence: "required",
      }, complete ? 200 : 503);
    }

    if (url.pathname !== "/v1/turn") return json({ available: false, reason: "not-found" }, 404);
    if (request.method !== "POST") return json({ available: false, reason: "method-not-allowed" }, 405, { allow: "POST" });

    const origin = allowedOrigin(request, env);
    if (!origin) return json({ available: false, stage: "origin", reason: "origin-not-authorized" }, 403);

    const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
    if (!REQUEST_ID_RE.test(requestId)) return json({ available: false, stage: "request", reason: "invalid-request-id" }, 400);

    const body = await readBody(request);
    if (body === null) return json({ available: false, stage: "request", reason: "body-too-large" }, 413);
    if (!body || typeof body.text !== "string" || !body.text.trim() || body.text.length > MAX_TEXT_CHARS) {
      return json({ available: false, stage: "request", reason: "invalid-input" }, 400);
    }

    // A browser-side ticket is deliberately ignored. Only the identity service can establish identity.
    let identity;
    try {
      identity = await callJson(env.IDENTITY_API, "/v1/session/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "origin": origin,
          ...(request.headers.get("cookie") ? { cookie: request.headers.get("cookie") } : {}),
        },
        body: JSON.stringify({ origin, request_id: requestId }),
      });
    } catch { return unavailable("identity"); }
    const unityId = typeof identity.unity_id === "string" ? identity.unity_id : "";
    if (identity.verified !== true || !/^[A-Za-z0-9_-]{8,128}$/.test(unityId)) {
      return json({ available: false, stage: "identity", reason: "session-not-verified" }, 401);
    }

    // The memory adapter must be available before any model call. Scope every read/write to verified Unity ID.
    let memory;
    try {
      memory = await callJson(env.IRIS_MEMORY, "/v1/memory/context", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ unity_id: unityId, request_id: requestId, limit: 12 }),
      });
    } catch { return unavailable("memory-read"); }
    if (memory.unity_id !== unityId || !Array.isArray(memory.items)) {
      return json({ available: false, stage: "memory-read", reason: "invalid-memory-response" }, 503);
    }

    let law;
    try {
      law = await callJson(env.TRINITY_LAW, "/v1/authorize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          principal: { unity_id: unityId },
          action: "iris.inference",
          request_id: requestId,
          input_sha256: await sha256(body.text),
          memory_count: memory.items.length,
        }),
      });
    } catch { return unavailable("trinity"); }
    if (law.decision !== "allow" || law.authorized !== true || law.request_id !== requestId) {
      return json({ available: false, stage: "trinity", reason: "authorization-denied" }, 403);
    }

    let inference;
    try {
      inference = await callJson(env.MODEL_PROVIDER, "/v1/infer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          unity_id: unityId,
          input: body.text,
          memory: memory.items,
          system: "You are Iris. Distinguish verified facts, observations, inferences, and uncertainty. Never claim an action succeeded without evidence. Memory is context, not authority. Trinity is the sole authorization gate.",
        }),
      });
    } catch { return unavailable("inference"); }
    if (typeof inference.output !== "string" || !inference.output.trim()) {
      return json({ available: false, stage: "inference", reason: "invalid-provider-response" }, 503);
    }

    // Persist an append-only, provenance-bearing turn after successful governed inference.
    let receipt;
    try {
      receipt = await callJson(env.IRIS_MEMORY, "/v1/memory/append", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": requestId },
        body: JSON.stringify({
          unity_id: unityId,
          request_id: requestId,
          kind: "conversation_turn",
          input: body.text,
          output: inference.output,
          provenance: {
            identity: "verified-session",
            authorization: "trinity-allow",
            provider: String(inference.provider || "configured-model-provider"),
            memory_context_count: memory.items.length,
          },
          confidence: typeof inference.confidence === "number"
            ? Math.max(0, Math.min(1, inference.confidence)) : null,
          created_at: new Date().toISOString(),
        }),
      });
    } catch { return unavailable("memory-write"); }
    if (receipt.unity_id !== unityId || receipt.persisted !== true || receipt.request_id !== requestId) {
      return json({ available: false, stage: "memory-write", reason: "persistence-unconfirmed" }, 503);
    }

    return json({
      available: true,
      request_id: requestId,
      unity_id: unityId,
      authorization: "trinity-allow",
      memory: { context_items: memory.items.length, persisted: true, receipt: receipt.receipt_id || null },
      result: inference.output,
      provider: inference.provider || "configured-model-provider",
    });
  },
};

async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
