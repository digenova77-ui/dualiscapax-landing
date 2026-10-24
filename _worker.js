/* Cloudflare Pages Advanced Mode.
 * Trinity only. Law prevails.
 * Capability does not confer authority.
 * Fail-closed. No decorative routes. No external bridges. No maps.
 * Read-only verification of the seal, hash, and Ed25519 signature.
 * Authorization endpoint uses env.SIGNING_SECRET + Durable Object bindings.
 */

const SEAL_BODY = `center=empty
mirror=claim_vs_mark→0|1
exempt=false∀
accept=RF5→RF6→GateA→GateB→evidence_ok→spend→Mirror
F_now=F_U+F_clearable
R0_locked
F_U_not_erasable_by_speech
purity=residual_faced
sin=residual_refused
coin=fuel_not_Accept
pure_own=cost_on_claim_paid_before_title
physics_TOE=0
theorem_of_all=0
tip=append_only
anti_reuse=atomic_spend
evidence=merkle_under_tipped_root
affinity=+1_under_same_stick
road=same_toll_every_step
THEOREM_U1=hygiene_complete→1_else_0_no_third_value`;
const EXPECTED_UNITY_HASH = "d95aa793e6bc330710ea6b9acab1ce6ed127c2c89c21715adba5a15e2e5fda41";

const SEAL_PUBLIC_KEY_HEX = "ec4785c5ca91e2545d7ecd2476a29a7d58ae6ad5d5688c4ee54daab68ddf9364";
const SEAL_SIGNATURE_HEX = "f8b90a7b5f1c2bbfacf8767a41fb358b80b5bb385107173c26ee9d645f57430d03b72e8615fc358ad2905a3dc94c6822cd62e86c54b7964e93ba700477bb6c06";

function noStore(extra = {}) {
  return {
    "cache-control": "no-store, must-revalidate",
    "cdn-cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extra
  };
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function verifyEd25519(messageBytes, signatureBytes, publicKeyBytes) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    return await crypto.subtle.verify("Ed25519", key, signatureBytes, messageBytes);
  } catch {
    return false;
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...noStore() }
  });
}

const LAW = "LAW WINS";

function lawReport() {
  return {
    protocol: "TRINITY.LAW.v1",
    law: LAW,
    principle: "Capability does not confer authority.",
    boundary: "NOT_FOR_EMISSION",
    origin: "immutable",
    fail_closed: true,
    missing_authority: "refusal",
    missing_evidence: "refusal"
  };
}

function purityReport() {
  return {
    protocol: "UNITY.PURITY.v1",
    law: LAW,
    boundary: "NOT_FOR_EMISSION",
    origin: "immutable",
    fail_closed: true,
    emission: "HELD",
    peg_ratio_E: "HELD",
    live_coin: false,
    live_wallet: false,
    measured: {
      seal_hash: "MEASURED",
      ed25519_seal: "MEASURED",
      key_gates: "MEASURED"
    },
    hypothetical: ["full residual movement", "live emission", "second pinner"],
    unknown_never_pass: true
  };
}

// ---------------------------------------------------------------------------
// Durable Objects
// ---------------------------------------------------------------------------
export class RateLimiter {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/check") {
      return new Response("not-found", { status: 404 });
    }
    const { key, limit = 10, windowMs = 60_000 } = await request.json();
    const now = Date.now();
    const windowKey = `win:${key}`;
    let record = (await this.state.storage.get(windowKey)) || { count: 0, resetAt: now + windowMs };

    if (now >= record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
    }

    if (record.count >= limit) {
      return Response.json({ allowed: false, remaining: 0, resetAt: record.resetAt });
    }

    record.count += 1;
    await this.state.storage.put(windowKey, record);

    return Response.json({
      allowed: true,
      remaining: limit - record.count,
      resetAt: record.resetAt,
    });
  }
}

export class AuditLog {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/record") {
      const entry = await request.json();
      const key = `req:${entry.request_id}`;
      const existing = await this.state.storage.get(key);
      if (!existing) {
        const record = { ...entry, recorded_at: new Date().toISOString() };
        await this.state.storage.put(key, record);
      }
      return Response.json({ ok: true });
    }

    if (request.method === "GET" && url.pathname.startsWith("/get/")) {
      const requestId = decodeURIComponent(url.pathname.slice(5));
      const record = await this.state.storage.get(`req:${requestId}`);
      if (!record) return Response.json({ found: false }, { status: 404 });
      return Response.json({ found: true, record });
    }

    return new Response("not-found", { status: 404 });
  }
}

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------
const POLICIES = {
  "iris.turn.look": { lanes: ["look"], memory: true },
  "iris.turn.depth": { lanes: ["depth"], memory: true },
  "iris.turn.work": { lanes: ["work"], memory: false },
};

function evaluatePolicy(ctx) {
  const policy = POLICIES[ctx.action];
  if (!policy) return { ok: false, reason: "unknown-action" };
  if (ctx.computeLane && !policy.lanes.includes(ctx.computeLane)) {
    return { ok: false, reason: "lane-not-permitted" };
  }
  if (ctx.memoryRequested && !policy.memory) {
    return { ok: false, reason: "memory-not-permitted" };
  }
  return { ok: true, policy: ctx.action };
}

// ---------------------------------------------------------------------------
// Request signing (HMAC-SHA256)
// ---------------------------------------------------------------------------
async function verifySignature(request, secret) {
  const timestamp = request.headers.get("x-timestamp");
  const signature = request.headers.get("x-signature");
  if (!timestamp || !signature || !secret) return false;

  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (isNaN(age) || age > 300 || age < -30) return false;

  const bodyText = await request.clone().text();
  const payload = `${timestamp}.${bodyText}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signatureBytes = Uint8Array.from(
    signature.match(/.{2}/g)?.map((b) => parseInt(b, 16)) || []
  );
  if (signatureBytes.length === 0) return false;

  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(payload)
  );
}

async function checkRateLimit(env, unityId, limit, windowMs) {
  if (!env.RATE_LIMITER) return { allowed: true, remaining: limit };
  const id = env.RATE_LIMITER.idFromName(unityId);
  const stub = env.RATE_LIMITER.get(id);
  const res = await stub.fetch("https://limiter/check", {
    method: "POST",
    body: JSON.stringify({ key: unityId, limit, windowMs }),
  });
  return res.json();
}

async function recordAudit(env, requestId, decision, originalBody) {
  if (!env.AUDIT_LOG) return;
  try {
    const id = env.AUDIT_LOG.idFromName(requestId || "unknown");
    const stub = env.AUDIT_LOG.get(id);
    await stub.fetch("https://audit/record", {
      method: "POST",
      body: JSON.stringify({
        request_id: requestId || null,
        decision,
        original_body: originalBody,
      }),
    });
  } catch {
    // Audit failure must not change the authorization decision.
  }
}

// ---------------------------------------------------------------------------
// Main fetch
// ---------------------------------------------------------------------------
export default {
  async fetch(request, env) {
    const assets = env && env.ASSETS;
    if (!assets || !assets.fetch) {
      return new Response("ASSETS binding unavailable", { status: 503, headers: noStore() });
    }

    const url = new URL(request.url);
    const path = url.pathname.length > 1 && url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;

    // Existing seal / law / purity routes (unchanged)
    if (path === "/law" || path === "/trinity") {
      return json(lawReport());
    }

    if (path === "/purity" || path === "/purity.json") {
      return json(purityReport());
    }

    if (path === "/seal" || path === "/seal.json" || path === "/unity/status" || path === "/unity/status.json") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405, headers: noStore({ allow: "GET, HEAD" }) });
      }
      try {
        const computed = await sha256Hex(SEAL_BODY);
        const hashMatch = computed === EXPECTED_UNITY_HASH;

        const messageBytes = new TextEncoder().encode(SEAL_BODY);
        const signatureBytes = hexToBytes(SEAL_SIGNATURE_HEX);
        const publicKeyBytes = hexToBytes(SEAL_PUBLIC_KEY_HEX);
        const signatureValid = await verifyEd25519(messageBytes, signatureBytes, publicKeyBytes);

        const pass = hashMatch && signatureValid;
        return json({
          seal: "UNITY_SEAL_v1",
          law: LAW,
          unity_hash: computed,
          expected: EXPECTED_UNITY_HASH,
          match: hashMatch,
          signature: SEAL_SIGNATURE_HEX,
          public_key: SEAL_PUBLIC_KEY_HEX,
          signature_valid: signatureValid,
          status: pass ? "PASS" : "DRIFT",
          fail_closed: true,
          cache: "no-store",
          evidence: {
            hash: hashMatch ? "ok" : "mismatch",
            ed25519: signatureValid ? "ok" : "invalid"
          }
        });
      } catch {
        return new Response("Seal verification unavailable", { status: 503, headers: noStore() });
      }
    }

    // New authorization endpoint
    if (path === "/v1/authorize" && request.method === "POST") {
      const secret = env.SIGNING_SECRET;
      const valid = await verifySignature(request, secret);
      if (!valid) {
        return json({ decision: "deny", authorized: false, reason: "invalid-signature" }, 401);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ decision: "deny", authorized: false, reason: "invalid-json" }, 400);
      }

      const unityId = body?.principal?.unity_id;
      const action = body?.action;
      const requestId = body?.request_id;
      const inputSha256 = body?.input_sha256;

      if (typeof unityId !== "string") {
        return json({ decision: "deny", authorized: false, reason: "malformed-request" }, 400);
      }

      const limitResult = await checkRateLimit(env, unityId, 10, 60_000);
      if (!limitResult.allowed) {
        return json(
          {
            decision: "deny",
            authorized: false,
            reason: "rate-limited",
            reset_at: limitResult.resetAt,
          },
          429
        );
      }

      if (
        typeof action !== "string" ||
        typeof requestId !== "string" ||
        typeof inputSha256 !== "string" ||
        !/^[a-f0-9]{64}$/.test(inputSha256)
      ) {
        const deny = { decision: "deny", authorized: false, reason: "malformed-request" };
        await recordAudit(env, requestId, deny, body);
        return json(deny, 400);
      }

      const allowed = evaluatePolicy({
        unityId,
        action,
        requestId,
        inputSha256,
        computeLane: body.compute_lane,
        memoryRequested: body.memory_requested === true,
      });

      const result = allowed.ok
        ? {
            decision: "allow",
            authorized: true,
            request_id: requestId,
            action,
            input_sha256: inputSha256,
            principal: { unity_id: unityId },
            remaining: limitResult.remaining,
          }
        : {
            decision: "deny",
            authorized: false,
            reason: allowed.reason,
          };

      await recordAudit(env, requestId, result, body);
      return json(result, allowed.ok ? 200 : 403);
    }

    // All other paths fall through to Pages assets. No rewriting. No external fetch.
    return assets.fetch(request);
  }
};
