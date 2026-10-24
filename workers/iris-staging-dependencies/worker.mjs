/**
 * Explicitly non-production contract fixtures for the Iris staging gauntlet.
 * Deploy only as identity-api-staging, trinity-law-staging, and
 * model-provider-staging. These are not real identity, policy, or AI services.
 * Every route fails closed unless both staging secrets are configured.
 */
const RECEIPT_CONTRACT = "dualis.receipt.v1";
const MAX_BODY_BYTES = 65536;
const ALLOWED_ACTIONS = new Set(["iris.turn.look"]);

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function sha256Hex(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function readBody(request) {
  let body;
  try { body = await request.json(); } catch { return { error: "invalid-json" }; }
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_BODY_BYTES) return { error: "body-too-large" };
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "invalid-body" };
  return { body };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      const enabled = env.STAGING_FIXTURE_ENABLED === "true";
      const configured = typeof env.STAGING_UNITY_ID === "string" && !!env.STAGING_UNITY_ID.trim();
      return json(enabled && configured ? 200 : 503, {
        ok: enabled && configured,
        staging_fixture: true,
        role: env.STAGING_FIXTURE_ROLE || "unconfigured",
        enabled,
        unity_id_configured: configured,
        external_identity_provider: false,
        external_policy_engine: false,
        external_model_provider: false,
      });
    }

    if (request.method !== "POST") return json(405, { ok: false, reason: "method-not-allowed" });
    if (env.STAGING_FIXTURE_ENABLED !== "true" ||
        typeof env.STAGING_UNITY_ID !== "string" || !env.STAGING_UNITY_ID.trim()) {
      return json(503, { ok: false, reason: "staging-fixture-disabled" });
    }

    const parsed = await readBody(request);
    if (parsed.error) return json(parsed.error === "body-too-large" ? 413 : 400, { ok: false, reason: parsed.error });
    const body = parsed.body;
    const role = env.STAGING_FIXTURE_ROLE;

    if (role === "identity" && url.pathname === "/check") {
      const unityId = body.principal && body.principal.unity_id;
      if (typeof unityId !== "string" || unityId !== env.STAGING_UNITY_ID) {
        return json(403, { ok: false, verified: false, reason: "staging-principal-not-registered" });
      }
      if (typeof body.request_id !== "string" || !body.request_id) {
        return json(400, { ok: false, verified: false, reason: "request-id-required" });
      }
      return json(200, { ok: true, verified: true, unity_id: unityId, request_id: body.request_id, staging_fixture: true });
    }

    if (role === "trinity" && url.pathname === "/evaluate") {
      const principal = body.principal;
      const requestId = body.request_id;
      const action = body.action;
      const text = typeof body.text === "string" ? body.text : "";
      const digest = await sha256Hex(text);
      if (typeof requestId !== "string" || !requestId ||
          principal !== env.STAGING_UNITY_ID ||
          typeof body.input_sha256 !== "string" || body.input_sha256 !== digest ||
          !ALLOWED_ACTIONS.has(action)) {
        return json(403, { ok: false, authorized: false, decision: "deny", reason: "staging-policy-deny" });
      }
      return json(200, {
        ok: true,
        authorized: true,
        decision: "allow",
        request_id: requestId,
        principal: { unity_id: principal },
        action,
        input_sha256: digest,
        staging_fixture: true,
      });
    }

    if (role === "model" && url.pathname === "/complete") {
      const receipt = body.receipt;
      const text = typeof body.text === "string" ? body.text : "";
      const digest = await sha256Hex(text);
      if (!receipt || receipt.contract !== RECEIPT_CONTRACT ||
          receipt.unity_id !== env.STAGING_UNITY_ID ||
          typeof receipt.request_id !== "string" ||
          typeof receipt.sha256 !== "string" || receipt.sha256 !== digest ||
          !receipt.id || !receipt.id.startsWith("rct_") ||
          !Array.isArray(body.memory_context) || body.memory_context.length > 10) {
        return json(403, { ok: false, reason: "staging-model-receipt-invalid" });
      }
      return json(200, {
        ok: true,
        staging_fixture: true,
        provider: "deterministic-contract-fixture",
        output: "STAGING_FIXTURE_ONLY: receipt and context contract validated; no external model was called.",
        receipt_id: receipt.id,
        context_items_received: body.memory_context.length,
      });
    }

    return json(404, { ok: false, reason: "route-not-found-for-staging-role", role: role || "unconfigured" });
  },
};
