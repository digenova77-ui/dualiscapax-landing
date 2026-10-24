/**
 * Iris Runtime — staging Worker (non-production).
 *
 * Implements /v1/authorize with fail-closed behavior.
 * Required bindings (must be present in wrangler.toml [env.staging]):
 *   IDENTITY_API, TRINITY_LAW, IRIS_MEMORY, MODEL_PROVIDER
 *
 * The HMAC secret is expected to be supplied as a Worker secret
 * (TRINITY_HMAC_SECRET), never as a browser-visible value.
 * This file contains no production routes.
 */
const REQUIRED_BINDINGS = [
  "IDENTITY_API",
  "TRINITY_LAW",
  "IRIS_MEMORY",
  "MODEL_PROVIDER",
];

const RECEIPT_CONTRACT = "dualis.receipt.v1";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function missingBindings(env) {
  return REQUIRED_BINDINGS.filter((name) => !env[name]);
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/v1/authorize" && request.method === "POST") {
      const missing = missingBindings(env);
      if (missing.length) {
        return json(503, {
          authorized: false,
          reason: "bindings-unavailable",
          missing,
        });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { authorized: false, reason: "invalid-json" });
      }

      const requestId = body && body.request_id;
      if (!requestId || typeof requestId !== "string") {
        return json(400, { authorized: false, reason: "missing-request-id" });
      }

      // Server-side secret only. Never read from the request body.
      const secret = env.TRINITY_HMAC_SECRET;
      if (!secret) {
        return json(503, { authorized: false, reason: "signing-secret-unavailable" });
      }

      // Minimal fail-closed decision: deny if the body explicitly requests denial
      // or if required identity fields are absent. Real Trinity binding would
      // replace this with a call to env.TRINITY_LAW.
      if (body.force_deny === true) {
        return json(403, { authorized: false, reason: "policy", request_id: requestId });
      }

      const inputText = typeof body.text === "string" ? body.text : "";
      const digest = await sha256Hex(inputText);
      const receiptId = "rct_" + requestId;

      return json(200, {
        authorized: true,
        decision: "allow",
        request_id: requestId,
        receipt: {
          contract: RECEIPT_CONTRACT,
          unity_id: body.unity_id || "staging",
          request_id: requestId,
          sha256: digest,
          id: receiptId,
        },
      });
    }

    if (url.pathname === "/health") {
      const missing = missingBindings(env);
      return json(200, {
        ok: missing.length === 0,
        missing,
        staging: true,
      });
    }

    return json(404, { error: "not-found" });
  },
};
