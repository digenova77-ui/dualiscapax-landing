/**
 * Iris single governed runtime (staging integration unit).
 *
 * Required service bindings: IDENTITY_API, TRINITY_LAW, IRIS_MEMORY, MODEL_PROVIDER.
 * These are service bindings, not URL-based third-party calls. No binding is optional:
 * missing authority or persistence fails closed before inference.
 *
 * Adapter contracts are versioned under /v1. No secret, prompt, cookie, or user text is logged.
 */
import { arbitrateCompute } from "./compute-arbitrator.mjs";

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
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("invalid-upstream-response");
  return data;
}

async function readBody(request) {
  const rawLength = request.headers.get("content-length");
  if (rawLength !== null && (!/^\d+$/.test(rawLength) || Number(rawLength) > MAX_BODY_BYTES)) return null;
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return null;
  try { return JSON.parse(raw); } catch { return undefined; }
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (request.method === "OPTIONS") {
      if (!origin) return json({ available: false, reason: "origin-not-authorized" }, 403);
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    let response;
    try { response = await handleRequest(request, env); }
    catch { response = unavailable("request"); }
    return origin ? withCors(response, origin) : response;
  },
};

async function handleRequest(request, env) {
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

  // A caller-stable ID is mandatory: generating a new ID server-side cannot protect retries.
  const requestId = request.headers.get("x-request-id");
  if (!requestId || !REQUEST_ID_RE.test(requestId)) {
    return json({ available: false, stage: "request", reason: "valid-client-request-id-required" }, 400);
  }

  const body = await readBody(request);
  if (body === null) return json({ available: false, stage: "request", reason: "body-too-large" }, 413);
  if (!body || typeof body.text !== "string" || !body.text.trim() || body.text.length > MAX_TEXT_CHARS) {
    return json({ available: false, stage: "request", reason: "invalid-input" }, 400);
  }

  const computePlan = arbitrateCompute(body.text);

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

  const inputSha256 = await sha256(body.text);
  let law;
  try {
    law = await callJson(env.TRINITY_LAW, "/v1/authorize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: { unity_id: unityId },
        action: computePlan.action,
        request_id: requestId,
        input_sha256: inputSha256,
        memory_requested: computePlan.lane === "probabilistic",
        compute_lane: computePlan.lane,
      }),
    });
  } catch { return unavailable("trinity"); }

  const lawPrincipal = law.principal && typeof law.principal === "object" ? law.principal.unity_id : null;
  if (
    law.decision !== "allow" ||
    law.authorized !== true ||
    law.request_id !== requestId ||
    law.action !== computePlan.action ||
    law.input_sha256 !== inputSha256 ||
    lawPrincipal !== unityId
  ) {
    return json({ available: false, stage: "trinity", reason: "authorization-denied-or-unbound" }, 403);
  }

  let claim;
  try {
    claim = await callJson(env.IRIS_MEMORY, "/v1/requests/claim", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": requestId },
      body: JSON.stringify({ unity_id: unityId, request_id: requestId, action: computePlan.action }),
    });
  } catch { return unavailable("idempotency-claim"); }
  if (claim.unity_id !== unityId || claim.request_id !== requestId || claim.claimed !== true) {
    return json({ available: false, stage: "idempotency-claim", reason: "request-not-claimed" }, 409);
  }

  let memory = { unity_id: unityId, items: [] };
  if (computePlan.lane === "probabilistic") {
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
  }

  let inference;
  if (computePlan.lane === "deterministic") {
    inference = { output: computePlan.result, provider: "deterministic-arithmetic", confidence: 1 };
  } else {
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
  }

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
          compute_lane: computePlan.lane,
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
    compute: { lane: computePlan.lane, provider_called: computePlan.provider_required },
    provider: inference.provider || "configured-model-provider",
  });
}

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-request-id",
    "access-control-max-age": "600",
    "vary": "Origin",
    "cache-control": "no-store, max-age=0",
  };
}

function withCors(response, origin) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(origin))) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
