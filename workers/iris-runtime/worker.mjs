/**
 * Iris Runtime — staging Worker (non-production).
 *
 * /v1/authorize is fail-closed.
 * Required bindings: IDENTITY_API, TRINITY_LAW, IRIS_MEMORY, MODEL_PROVIDER
 * HMAC secret: TRINITY_HMAC_SECRET (Worker secret, never in source).
 *
 * MODEL_PROVIDER is not called from authorize. Inference is /v1/infer
 * and requires a previously issued dualis.receipt.v1 receipt.
 */
const REQUIRED_BINDINGS = [
  "IDENTITY_API",
  "TRINITY_LAW",
  "IRIS_MEMORY",
  "MODEL_PROVIDER",
];

const RECEIPT_CONTRACT = "dualis.receipt.v1";
const BINDING_TIMEOUT_MS = 1500;
const MAX_BODY_BYTES = 65536;
const MAX_SKEW_SECONDS = 300;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;
const ALLOWED_ACTIONS = new Set(["iris.turn.look", "iris.turn.depth", "iris.turn.work", "iris.turn.learn"]);
const GATED_ACTIONS = new Set(["iris.turn.depth", "iris.turn.work", "iris.turn.learn"]);
const metrics = { allow: 0, deny: 0, model: 0, revoke: 0 };

// The durable memory service is authoritative; only in-flight request suppression is isolate-local.
const inflight = new Set();
const rates = new Map();
const audit = [];

function json(status, body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, x-timestamp, x-signature",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      ...(extraHeaders || {}),
    },
  });
}

function missingBindings(env) {
  return REQUIRED_BINDINGS.filter((name) => !env[name]);
}

function inertBindings(env) {
  return REQUIRED_BINDINGS.filter((name) => !env[name] || typeof env[name].fetch !== "function");
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function recordAudit(entry) {
  audit.push({ at: new Date().toISOString(), ...entry });
  if (audit.length > 100) audit.shift();
}

function rateOk(key) {
  const now = Date.now();
  const bucket = rates.get(key) || [];
  const fresh = bucket.filter((t) => now - t < RATE_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT) {
    rates.set(key, fresh);
    return false;
  }
  fresh.push(now);
  rates.set(key, fresh);
  return true;
}

function receiptShape(receipt) {
  return !!(
    receipt &&
    receipt.contract === RECEIPT_CONTRACT &&
    typeof receipt.unity_id === "string" &&
    receipt.unity_id &&
    typeof receipt.id === "string" &&
    receipt.id.startsWith("rct_") &&
    typeof receipt.sha256 === "string" &&
    /^[0-9a-f]{64}$/i.test(receipt.sha256) &&
    typeof receipt.request_id === "string" &&
    receipt.request_id
  );
}

async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function readMemoryContext(env, principal, requestId) {
  const result = await callBinding(env.IRIS_MEMORY, "/v1/context/read", {
    principal,
    request_id: requestId,
    limit: 5,
  }, env.IRIS_BINDING_TIMEOUT_MS, { authorization: "Bearer " + env.IRIS_MEMORY_SERVICE_TOKEN });
  if (!result.ok || !result.data || result.data.ok !== true || !Array.isArray(result.data.items)) {
    return { ok: false, reason: result.reason || "memory-context-unavailable" };
  }
  return { ok: true, items: result.data.items };
}

async function callBinding(binding, path, body, timeoutMs, extraHeaders) {
  if (!binding || typeof binding.fetch !== "function") {
    return { ok: false, reason: "binding-inert" };
  }
  const limit = typeof timeoutMs === "number" ? timeoutMs : BINDING_TIMEOUT_MS;
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, reason: "timeout" }), limit);
  });
  const call = (async () => {
    try {
      const res = await binding.fetch("https://binding" + path, {
        method: "POST",
        headers: { "content-type": "application/json", ...(extraHeaders || {}) },
        body: JSON.stringify(body),
      });
      let data = null;
      try { data = await res.json(); } catch (e) {}
      return { ok: res.ok && (!data || data.ok !== false && data.decision !== "deny"), status: res.status, data };
    } catch (err) {
      return { ok: false, reason: "binding-error" };
    }
  })();
  try {
    return await Promise.race([call, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "content-type, x-timestamp, x-signature",
          "access-control-allow-methods": "GET, POST, OPTIONS",
        },
      });
    }

    if (url.pathname === "/v1/authorize" && request.method === "POST") {
      const type = request.headers.get("content-type") || "";
      if (!type.includes("application/json")) {
        return json(415, { authorized: false, reason: "unsupported-media-type" });
      }
      const missing = missingBindings(env);
      if (missing.length) {
        return json(503, { authorized: false, reason: "bindings-unavailable", missing });
      }
      if (!env.IRIS_MEMORY_SERVICE_TOKEN) return json(503, { authorized: false, reason: "memory-service-token-unavailable" });
      const inert = inertBindings(env);
      if (inert.length) {
        return json(503, { authorized: false, reason: "binding-inert", missing: inert });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { authorized: false, reason: "invalid-json" });
      }

      const raw = JSON.stringify(body);
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
        return json(413, { authorized: false, reason: "body-too-large" });
      }

      const requestId = body && body.request_id;
      if (!requestId || typeof requestId !== "string") {
        return json(400, { authorized: false, reason: "missing-request-id" });
      }
      if (!REQUEST_ID_RE.test(requestId)) {
        return json(400, { authorized: false, reason: "bad-request-id", request_id: requestId });
      }

      const secret = env.TRINITY_HMAC_SECRET;
      if (!secret) {
        return json(503, { authorized: false, reason: "signing-secret-unavailable" });
      }

      const timestamp = request.headers.get("x-timestamp");
      const signature = request.headers.get("x-signature");
      if (!timestamp || !signature) {
        return json(401, { authorized: false, reason: "signature-required" });
      }
      const skew = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
      if (!Number.isFinite(skew) || skew > MAX_SKEW_SECONDS) {
        return json(401, { authorized: false, reason: "timestamp-skew" });
      }
      const expected = await hmacHex(secret, timestamp + "." + JSON.stringify(body));
      if (expected !== signature) {
        return json(401, { authorized: false, reason: "invalid-signature" });
      }

      const principal = (body.principal && body.principal.unity_id) || body.unity_id || null;
      if (typeof principal !== "string" || !principal.trim()) {
        return json(400, { authorized: false, reason: "missing-principal", request_id: requestId });
      }
      if (!rateOk(principal)) {
        recordAudit({ request_id: requestId, decision: "deny", reason: "rate-limited" });
        return json(429, { authorized: false, reason: "rate-limited", request_id: requestId });
      }

      const inputText = typeof body.text === "string" ? body.text : "";
      const digest = await sha256Hex(inputText);
      if (body.input_sha256 !== undefined && (typeof body.input_sha256 !== "string" || body.input_sha256.toLowerCase() !== digest)) {
        return json(400, { authorized: false, reason: "input-digest-mismatch", request_id: requestId });
      }
      if (inflight.has(requestId)) {
        return json(409, { authorized: false, reason: "concurrent-claim", request_id: requestId });
      }
      inflight.add(requestId);

      try {
        if (body.force_deny === true) {
          recordAudit({ request_id: requestId, decision: "deny", reason: "policy" });
          return json(403, { authorized: false, reason: "policy", request_id: requestId });
        }

        const identity = await callBinding(env.IDENTITY_API, "/check", { request_id: requestId, principal: { unity_id: principal } }, env.IRIS_BINDING_TIMEOUT_MS);
        const verifiedUnityId = identity.data && (identity.data.unity_id || (identity.data.principal && identity.data.principal.unity_id));
        if (!identity.ok || !identity.data || identity.data.verified !== true || verifiedUnityId !== principal) {
          return json(403, { authorized: false, reason: identity.reason || "identity-unverified", request_id: requestId });
        }
        const action = typeof body.action === "string" && body.action ? body.action : "iris.turn.look";
        if (!ALLOWED_ACTIONS.has(action)) {
          return json(400, { authorized: false, reason: "unknown-action", request_id: requestId });
        }
        if (GATED_ACTIONS.has(action) && !inputText.trim()) {
          return json(400, { authorized: false, reason: "text-required", request_id: requestId });
        }
        const law = await callBinding(env.TRINITY_LAW, "/evaluate", { request_id: requestId, principal, input_sha256: digest, text: inputText, action }, env.IRIS_BINDING_TIMEOUT_MS);
        const lawPrincipal = law.data && (law.data.unity_id || (law.data.principal && law.data.principal.unity_id));
        if (!law.ok || !law.data || law.data.decision !== "allow" || law.data.authorized !== true ||
            law.data.request_id !== requestId || lawPrincipal !== principal ||
            law.data.action !== action || law.data.input_sha256 !== digest) {
          return json(403, { authorized: false, reason: !law.ok ? (law.reason || "law-denied") : "trinity-binding-mismatch", request_id: requestId });
        }

        const receipt = {
          contract: RECEIPT_CONTRACT,
          unity_id: principal,
          request_id: requestId,
          sha256: digest,
          id: "rct_" + requestId,
          action,
          issued_at: new Date().toISOString(),
        };

        // The memory service owns the cross-isolate atomic idempotency claim.
        // Never fall back to the isolate-local Map/Set when this contract fails.
        const claim = await callBinding(env.IRIS_MEMORY, "/v1/requests/claim", {
          request_id: requestId,
          principal,
          action,
          input_sha256: digest,
          receipt,
        }, env.IRIS_BINDING_TIMEOUT_MS, { authorization: "Bearer " + env.IRIS_MEMORY_SERVICE_TOKEN });
        if (claim.status === 409) {
          recordAudit({ request_id: requestId, decision: "deny", reason: "duplicate-request" });
          return json(409, { authorized: false, reason: "duplicate-request", request_id: requestId });
        }
        if (!claim.ok) {
          return json(503, { authorized: false, reason: claim.reason || "claim-unavailable", request_id: requestId });
        }
        if (claim.data && claim.data.replay === true) {
          if (claim.data.revoked === true) {
            metrics.deny += 1;
            return json(403, { authorized: false, reason: "receipt-revoked", request_id: requestId });
          }
          const prior = claim.data.receipt;
          if (!receiptShape(prior) || prior.id !== "rct_" + requestId || prior.request_id !== requestId || prior.unity_id !== principal || prior.sha256.toLowerCase() !== digest) {
            return json(503, { authorized: false, reason: "claim-receipt-mismatch", request_id: requestId });
          }
          const context = await readMemoryContext(env, principal, requestId);
          if (!context.ok) return json(503, { authorized: false, reason: context.reason, request_id: requestId });
          return json(200, { authorized: true, decision: "allow", request_id: requestId, receipt: prior, memory_context: context.items, replay: true });
        }
        if (!claim.data || claim.data.claimed !== true || !receiptShape(claim.data.receipt) ||
            claim.data.receipt.id !== "rct_" + requestId || claim.data.receipt.request_id !== requestId ||
            claim.data.receipt.unity_id !== principal || claim.data.receipt.sha256.toLowerCase() !== digest) {
          return json(503, { authorized: false, reason: "claim-contract-invalid", request_id: requestId });
        }
        // The atomic claim must persist the receipt in the same transaction.
        // Do not add a second, non-atomic /record step after claiming.
        const storedReceipt = claim.data.receipt;
        const context = await readMemoryContext(env, principal, requestId);
        if (!context.ok) return json(503, { authorized: false, reason: context.reason, request_id: requestId });
        metrics.allow += 1;
        recordAudit({ request_id: requestId, decision: "allow", receipt_id: storedReceipt.id });
        return json(200, {
          authorized: true,
          decision: "allow",
          request_id: requestId,
          receipt: storedReceipt,
          memory_context: context.items,
        });
      } finally {
        inflight.delete(requestId);
      }
    }

    if (url.pathname === "/v1/infer" && request.method === "POST") {
      const missing = missingBindings(env);
      if (missing.length) return json(503, { ok: false, reason: "bindings-unavailable", missing });
      if (!env.IRIS_MEMORY_SERVICE_TOKEN) return json(503, { ok: false, reason: "memory-service-token-unavailable" });
      let body;
      try { body = await request.json(); } catch { return json(400, { ok: false, reason: "invalid-json" }); }
      if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_BODY_BYTES) {
        return json(413, { ok: false, reason: "body-too-large" });
      }
      if (!receiptShape(body && body.receipt)) {
        return json(403, { ok: false, reason: "receipt-required" });
      }
      const storedResult = await callBinding(env.IRIS_MEMORY, "/v1/requests/get", {
        request_id: body.receipt.request_id,
      }, env.IRIS_BINDING_TIMEOUT_MS, { authorization: "Bearer " + env.IRIS_MEMORY_SERVICE_TOKEN });
      const stored = storedResult.data && storedResult.data.receipt;
      if (!storedResult.ok || !storedResult.data || storedResult.data.found !== true ||
          !receiptShape(stored) || stored.id !== body.receipt.id ||
          stored.request_id !== body.receipt.request_id || stored.unity_id !== body.receipt.unity_id ||
          stored.sha256.toLowerCase() !== body.receipt.sha256.toLowerCase()) {
        return json(403, { ok: false, reason: "receipt-unknown" });
      }
      if (storedResult.data.revoked === true || stored.revoked === true) return json(403, { ok: false, reason: "receipt-revoked" });
      if (stored.issued_at) {
        const age = Date.now() - Date.parse(stored.issued_at);
        const ttl = typeof env.IRIS_RECEIPT_TTL_MS === "number" ? env.IRIS_RECEIPT_TTL_MS : RECEIPT_TTL_MS;
        if (Number.isFinite(age) && age > ttl) return json(403, { ok: false, reason: "receipt-expired" });
      }
      if (typeof body.text !== "string") {
        return json(400, { ok: false, reason: "text-required" });
      }
      const digest = await sha256Hex(body.text);
      if (digest !== body.receipt.sha256.toLowerCase()) {
        return json(403, { ok: false, reason: "sha256-mismatch" });
      }
      const context = await readMemoryContext(env, stored.unity_id, body.receipt.request_id);
      if (!context.ok) return json(503, { ok: false, reason: context.reason });
      metrics.model += 1;
      const model = await callBinding(env.MODEL_PROVIDER, "/complete", { receipt: body.receipt, text: body.text || "", memory_context: context.items });
      if (!model.ok) {
        return json(502, { ok: false, reason: model.reason || "model-denied" });
      }
      return json(200, { ok: true, receipt: body.receipt, output: model.data || null });
    }

    if (url.pathname === "/v1/receipt/verify" && request.method === "POST") {
      const missing = missingBindings(env);
      if (missing.length) return json(503, { valid: false, reason: "bindings-unavailable", missing });
      if (!env.IRIS_MEMORY_SERVICE_TOKEN) return json(503, { valid: false, reason: "memory-service-token-unavailable" });
      const inert = inertBindings(env);
      if (inert.length) return json(503, { valid: false, reason: "binding-inert", missing: inert });
      if (!env.TRINITY_HMAC_SECRET) return json(503, { valid: false, reason: "signing-secret-unavailable" });
      let body;
      try { body = await request.json(); } catch { return json(400, { valid: false, reason: "invalid-json" }); }
      if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_BODY_BYTES) {
        return json(413, { valid: false, reason: "body-too-large" });
      }
      const receipt = body && body.receipt;
      if (!receiptShape(receipt)) return json(200, { valid: false, reason: "bad-receipt" });
      if (typeof body.text === "string") {
        const digest = await sha256Hex(body.text);
        if (digest !== receipt.sha256.toLowerCase()) return json(200, { valid: false, reason: "sha256-mismatch" });
      }
      const storedResult = await callBinding(env.IRIS_MEMORY, "/v1/requests/get", {
        request_id: receipt.request_id,
      }, env.IRIS_BINDING_TIMEOUT_MS, { authorization: "Bearer " + env.IRIS_MEMORY_SERVICE_TOKEN });
      const stored = storedResult.data && storedResult.data.receipt;
      if (!storedResult.ok || !storedResult.data || storedResult.data.found !== true || !receiptShape(stored)) {
        return json(200, { valid: false, known: false, reason: "receipt-unknown" });
      }
      if (storedResult.data.revoked === true || stored.revoked === true) return json(200, { valid: false, reason: "receipt-revoked" });
      if (stored.issued_at) {
        const age = Date.now() - Date.parse(stored.issued_at);
        const ttl = typeof env.IRIS_RECEIPT_TTL_MS === "number" ? env.IRIS_RECEIPT_TTL_MS : RECEIPT_TTL_MS;
        if (Number.isFinite(age) && age > ttl) return json(200, { valid: false, reason: "receipt-expired" });
      }
      if (stored.id !== receipt.id || stored.unity_id !== receipt.unity_id ||
          stored.sha256.toLowerCase() !== receipt.sha256.toLowerCase() || stored.request_id !== receipt.request_id) {
        return json(200, { valid: false, reason: "stored-mismatch" });
      }
      return json(200, {
        valid: true,
        known: !!stored,
        contract: RECEIPT_CONTRACT,
        id: receipt.id,
      });
    }

    const receiptGet = url.pathname.match(/^\/v1\/receipt\/([^/]+)$/);
    if (receiptGet && request.method === "GET") {
      const id = decodeURIComponent(receiptGet[1]);
      if (!id.startsWith("rct_")) return json(400, { found: false, reason: "invalid-receipt-id" });
      const requestId = id.slice(4);
      const result = await callBinding(env.IRIS_MEMORY, "/v1/requests/get", {
        request_id: requestId,
      }, env.IRIS_BINDING_TIMEOUT_MS, { authorization: "Bearer " + env.IRIS_MEMORY_SERVICE_TOKEN });
      const receipt = result.data && result.data.receipt;
      if (!result.ok || !result.data || result.data.found !== true || !receiptShape(receipt) || receipt.id !== id) {
        return json(404, { found: false, reason: "not-issued" });
      }
      return json(200, { found: true, receipt });
    }

    if (url.pathname === "/v1/receipt/revoke" && request.method === "POST") {
      if (!env.IRIS_MEMORY_SERVICE_TOKEN) return json(503, { ok: false, reason: "memory-service-token-unavailable" });
      if (!env.TRINITY_HMAC_SECRET) return json(503, { ok: false, reason: "signing-secret-unavailable" });
      const type = request.headers.get("content-type") || "";
      if (!type.includes("application/json")) return json(415, { ok: false, reason: "unsupported-media-type" });
      const timestamp = request.headers.get("x-timestamp");
      const signature = request.headers.get("x-signature");
      if (!timestamp || !signature) return json(401, { ok: false, reason: "signature-required" });
      const skew = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
      if (!Number.isFinite(skew) || skew > MAX_SKEW_SECONDS) return json(401, { ok: false, reason: "timestamp-skew" });
      let body;
      try { body = await request.json(); } catch { return json(400, { ok: false, reason: "invalid-json" }); }
      if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_BODY_BYTES) return json(413, { ok: false, reason: "body-too-large" });
      const expected = await hmacHex(env.TRINITY_HMAC_SECRET, timestamp + "." + JSON.stringify(body));
      if (expected !== signature) return json(401, { ok: false, reason: "invalid-signature" });
      const id = body && (body.id || body.request_id);
      if (typeof id !== "string" || !id || id.length > 133 || !/^(rct_)?[A-Za-z0-9._:-]{1,128}$/.test(id)) {
        return json(400, { ok: false, reason: "invalid-id" });
      }
      const revoked = await callBinding(env.IRIS_MEMORY, "/v1/requests/revoke", { id }, env.IRIS_BINDING_TIMEOUT_MS, { authorization: "Bearer " + env.IRIS_MEMORY_SERVICE_TOKEN });
      if (!revoked.ok || !revoked.data || revoked.data.ok !== true) {
        return json(revoked.status === 404 ? 404 : 503, { ok: false, reason: (revoked.data && revoked.data.reason) || "revoke-unavailable" });
      }
      metrics.revoke += 1;
      recordAudit({ request_id: revoked.data.request_id || id, decision: "revoke", receipt_id: revoked.data.id || id });
      return json(200, { ok: true, id: revoked.data.id || id, replay: revoked.data.replay === true });
    }

    if (url.pathname === "/v1/metrics" && request.method === "GET") {
      return json(200, { ...metrics });
    }

    if (url.pathname === "/v1/audit" && request.method === "GET") {
      return json(200, { count: audit.length, entries: audit.slice(-20) });
    }

    if (url.pathname === "/health") {
      const missing = missingBindings(env);
      const inert = inertBindings(env);
      return json(200, {
        ok: missing.length === 0 && inert.length === 0 && !!env.TRINITY_HMAC_SECRET && !!env.IRIS_MEMORY_SERVICE_TOKEN,
        missing,
        inert,
        signing_secret: !!env.TRINITY_HMAC_SECRET,
        memory_service_token: !!env.IRIS_MEMORY_SERVICE_TOKEN,
        staging: true,
        durable_memory_required: true,
      });
    }

    return json(404, { error: "not-found" });
  },
};
