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

    // Atomic idempotency claim. This instance is addressed by
    // idFromName(request_id), so every request carrying the same
    // request_id serializes through this one Durable Object, and the
    // get -> put sequence below cannot interleave with a concurrent
    // claim for the same request_id. First claimant wins; every later
    // claim for the same request_id is refused.
    if (request.method === "POST" && url.pathname === "/claim") {
      const entry = await request.json();
      const key = `claim:${entry.request_id}`;
      const existing = await this.state.storage.get(key);
      if (existing) {
        return Response.json({ claimed: false, first_claimed_at: existing.claimed_at });
      }
      const claimed_at = new Date().toISOString();
      // Claim and record are one operation. When the caller supplies
      // the decision record, it is written here, BEFORE the claim:
      // the claim is the commit point. If the record write fails, no
      // claim stands and the caller refuses closed — an allow can
      // never be issued claimed but unrecorded. The record is
      // stamped with the claim's own timestamp and carries it in
      // its decision, so the durable record matches the allow the
      // caller goes on to issue. Like /record, the write is
      // insert-if-absent: a retry after a failed claim write finds
      // the first record and is not blocked by it.
      const { record: decisionRecord, ...claimEntry } = entry;
      if (decisionRecord) {
        const recordKey = `req:${entry.request_id}`;
        const existingRecord = await this.state.storage.get(recordKey);
        if (!existingRecord) {
          const stored = { ...decisionRecord, recorded_at: claimed_at };
          if (stored.decision && typeof stored.decision === "object") {
            stored.decision = { ...stored.decision, claimed_at };
          }
          await this.state.storage.put(recordKey, stored);
        }
      }
      const record = { ...claimEntry, claimed_at };
      await this.state.storage.put(key, record);
      return Response.json({ claimed: true, claimed_at });
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

function timingSafeEqualHex(a, b) {
  // Constant-time equality for hex digests: the loop always runs the
  // full length and never branches on the compared content.
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

async function checkRateLimit(env, unityId, limit, windowMs) {
  if (!env.RATE_LIMITER) return { allowed: false, unavailable: true, remaining: 0 };
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

// Claim a request_id after a matching allow, before the allow is
// returned. Unlike recordAudit this FAILS CLOSED: a missing binding,
// a claim-service error, or an already-claimed request_id all come
// back as claimed:false, and the caller must refuse the request.
async function claimRequest(env, requestId, claimBody) {
  if (!env.AUDIT_LOG) return { claimed: false, error: "audit-binding-missing" };
  try {
    const id = env.AUDIT_LOG.idFromName(requestId || "unknown");
    const stub = env.AUDIT_LOG.get(id);
    const res = await stub.fetch("https://audit/claim", {
      method: "POST",
      body: JSON.stringify(claimBody),
    });
    if (!res.ok) return { claimed: false, error: `claim-http-${res.status}` };
    return await res.json();
  } catch {
    return { claimed: false, error: "claim-unavailable" };
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
      if (limitResult.unavailable) {
        // The limiter binding is absent: this deployment cannot
        // count requests, so it must not silently stop counting.
        // Refuse closed — the same posture the claim takes toward a
        // missing audit binding — rather than allowing uncounted.
        const deny = { decision: "deny", authorized: false, reason: "rate-limiter-unavailable" };
        await recordAudit(env, requestId, deny, body);
        return json(deny, 503);
      }
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

      // Digest binding: input_sha256 is the SHA-256 hex digest of the
      // submitted input text — the body's `text` member, with an absent
      // or non-string `text` treated as the empty string. That is the
      // contract the Iris client computes (js/iris-session.js) and the
      // staging runtime enforces (workers/iris-runtime/worker.mjs);
      // this endpoint previously only checked the digest's format.
      // Recompute it and refuse before any policy decision when the
      // declared digest does not match: a digest that cannot be
      // verified is never echoed back as bound.
      const inputText = typeof body.text === "string" ? body.text : "";
      const recomputedSha256 = await sha256Hex(inputText);
      if (!timingSafeEqualHex(recomputedSha256, inputSha256)) {
        const deny = { decision: "deny", authorized: false, reason: "input-digest-mismatch" };
        await recordAudit(env, requestId, deny, body);
        return json(deny, 400);
      }

      // Environment binding. A request that declares an environment
      // is bound to the deployment it names: the declaration must
      // match this worker's own configured environment (the
      // ENVIRONMENT var, a deploy-time value like SIGNING_SECRET).
      // A mismatch is refused here, before the policy decision. If
      // this deployment has not declared its own environment, a
      // declared one cannot be verified and the request fails
      // closed — the same posture the ingest route takes toward an
      // unbound backend. A request that declares no environment
      // (the existing client sends none) makes no claim about the
      // deployment and is unchanged.
      if (typeof body.environment === "string") {
        if (typeof env.ENVIRONMENT !== "string" || env.ENVIRONMENT === "") {
          const deny = { decision: "deny", authorized: false, reason: "environment-unverifiable" };
          await recordAudit(env, requestId, deny, body);
          return json(deny, 503);
        }
        if (body.environment !== env.ENVIRONMENT) {
          const deny = { decision: "deny", authorized: false, reason: "environment-mismatch" };
          await recordAudit(env, requestId, deny, body);
          return json(deny, 403);
        }
      }

      const allowed = evaluatePolicy({
        unityId,
        action,
        requestId,
        inputSha256,
        computeLane: body.compute_lane,
        memoryRequested: body.memory_requested === true,
      });

      if (!allowed.ok) {
        const deny = { decision: "deny", authorized: false, reason: allowed.reason };
        await recordAudit(env, requestId, deny, body);
        return json(deny, 403);
      }

      // Atomic idempotency: claim the request_id after the matching
      // allow and before the allow is returned (the order the README's
      // law states). Each request_id can be authorized exactly once.
      // A duplicate is refused 409; any failure of the claim itself
      // refuses closed 503 — an allow is never issued unclaimed.
      const claim = await claimRequest(env, requestId, {
        request_id: requestId,
        action,
        input_sha256: inputSha256,
        principal: { unity_id: unityId },
        // The durable record of this allow, written by the claim
        // itself in the same atomic operation (see /claim above) —
        // the record the separate recordAudit call used to write
        // afterwards, best-effort. claimed_at is added to its
        // decision by the claim, from the claim's own timestamp.
        record: {
          request_id: requestId,
          decision: {
            decision: "allow",
            authorized: true,
            request_id: requestId,
            action,
            input_sha256: inputSha256,
            principal: { unity_id: unityId },
            remaining: limitResult.remaining,
          },
          original_body: body,
        },
      });
      if (!claim.claimed) {
        const unavailable = Boolean(claim.error);
        const deny = {
          decision: "deny",
          authorized: false,
          reason: unavailable ? "claim-unavailable" : "duplicate-request",
          request_id: requestId,
        };
        await recordAudit(env, requestId, deny, body);
        return json(deny, unavailable ? 503 : 409);
      }

      const result = {
        decision: "allow",
        authorized: true,
        request_id: requestId,
        action,
        input_sha256: inputSha256,
        principal: { unity_id: unityId },
        remaining: limitResult.remaining,
        claimed_at: claim.claimed_at,
      };

      // No recordAudit call here: the durable record of this allow
      // was written inside the claim, atomically with it. Recording
      // again after the fact would reinstate the split this closes.
      return json(result, 200);
    }

    // Staged: health endpoint mirroring the static /health.json body.
    if (path === "/healthz") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405, headers: noStore({ allow: "GET, HEAD" }) });
      }
      return json({ ok: true, authority: "NONE" });
    }

    // Staged: DCLM ingest. Fail-closed until a real backend is bound.
    if (path === "/v2/dclm/ingest") {
      if (request.method !== "POST") {
        return json({ verdict: "HOLE", why: "method-not-allowed", authority: "NONE" }, 405);
      }
      if (!env.DCLM_INGEST_URL || !env.DCLM_INGEST_TOKEN) {
        return json({ verdict: "HOLE", why: "DCLM backend not bound", authority: "NONE" }, 503);
      }
      const upstream = await fetch(env.DCLM_INGEST_URL, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${env.DCLM_INGEST_TOKEN}` },
        body: await request.text()
      });
      return new Response(await upstream.text(), { status: upstream.status, headers: { "content-type": "application/json; charset=utf-8", ...noStore() } });
    }

    // All other paths fall through to Pages assets. No rewriting. No external fetch.
    return assets.fetch(request);
  }
};
