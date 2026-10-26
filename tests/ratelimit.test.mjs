// Tests for the /v1/authorize rate-limiter fail-closed fix (finding B).
//
// Run: node --test ratelimit.test.mjs
//
// The defect: when the RATE_LIMITER Durable Object binding is
// absent, checkRateLimit returns { allowed: true } — an
// authorization endpoint that cannot count silently stops
// counting, and every request is allowed uncounted. The decision
// then rests on configuration luck, not on the request.
//
// Demonstrated against the pre-fix worker below, and live against
// the main worker by the Diamond Gauntlet harness (CLARITY section:
// RATE_LIMITER binding absent -> 200 allow, in both the main worker
// and PR #180's worker, which deliberately left B untouched).
//
// The fix: an absent limiter binding refuses the authorize path
// 503 "rate-limiter-unavailable" — the same fail-closed posture the
// claim (PR #180) takes toward a missing audit binding. A present
// limiter behaves exactly as before, including the 429 path.
//
// The Durable Object stubs below simulate the one platform guarantee
// the worker's own classes rely on: requests to a single DO instance
// are processed serially. The stub enforces that with a per-instance
// promise chain over an in-memory store. Everything else — signing,
// policy, rate limiting — runs the worker's own code, including its
// own RateLimiter and AuditLog classes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, createHash } from "node:crypto";

import * as orig from "./fixtures/_worker.pre-ratelimit.mjs";
import * as fixed from "./fixtures/_worker.with-ratelimit.mjs";

const SECRET = "test-secret";
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const EMPTY_SHA256 = sha256("");

class MemStorage {
  constructor() { this.map = new Map(); }
  async get(k) { return this.map.get(k); }
  async put(k, v) { this.map.set(k, v); }
}

function makeNamespace(Klass) {
  const instances = new Map();
  return {
    idFromName(name) { return String(name); },
    get(id) {
      if (!instances.has(id)) {
        const inst = new Klass({ storage: new MemStorage() });
        const stub = {
          _chain: Promise.resolve(),
          fetch(input, init) {
            // Mirror the platform: stub.fetch(urlString, init) builds a Request.
            const req = input instanceof Request ? input : new Request(input, init);
            const run = stub._chain.then(() => inst.fetch(req));
            stub._chain = run.catch(() => {});
            return run;
          },
        };
        instances.set(id, stub);
      }
      return instances.get(id);
    },
  };
}

function makeEnv(mod, { limiter = true } = {}) {
  const env = {
    ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
    SIGNING_SECRET: SECRET,
    AUDIT_LOG: makeNamespace(mod.AuditLog),
  };
  if (limiter) env.RATE_LIMITER = makeNamespace(mod.RateLimiter);
  return env;
}

function signatureHeaders(bodyText) {
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac("sha256", SECRET).update(`${ts}.${bodyText}`).digest("hex");
  return { "x-timestamp": ts, "x-signature": sig, "content-type": "application/json" };
}

function signedRequest(bodyObj) {
  const bodyText = JSON.stringify(bodyObj);
  return new Request("https://landing.test/v1/authorize", {
    method: "POST",
    headers: signatureHeaders(bodyText),
    body: bodyText,
  });
}

// Body shape mirrors the Iris client (js/iris-session.js buildAuthBody).
const authBody = (requestId) => ({
  principal: { unity_id: "u-test" },
  action: "iris.turn.look",
  request_id: requestId,
  input_sha256: EMPTY_SHA256,
  compute_lane: "look",
  memory_requested: false,
});

async function authorize(mod, env, bodyObj) {
  const res = await mod.default.fetch(signedRequest(bodyObj), env);
  return { status: res.status, body: await res.json() };
}

async function auditRecord(env, requestId) {
  const stub = env.AUDIT_LOG.get(env.AUDIT_LOG.idFromName(requestId));
  const res = await stub.fetch(`https://audit/get/${encodeURIComponent(requestId)}`);
  if (res.status === 404) return null;
  const out = await res.json();
  return out.record || null;
}

// --- Defect demonstration against the ORIGINAL worker ---------------------

test("ORIGINAL: with the limiter binding absent, a request is allowed uncounted (defect)", async () => {
  const env = makeEnv(orig, { limiter: false });
  const r = await authorize(orig, env, authBody("req-nolimit-orig"));
  assert.equal(r.status, 200); // defect: fails open
  assert.equal(r.body.decision, "allow");
});

test("ORIGINAL: with the limiter present, a request is allowed and counted (control)", async () => {
  const env = makeEnv(orig, { limiter: true });
  const r = await authorize(orig, env, authBody("req-limit-orig"));
  assert.equal(r.status, 200);
  assert.equal(r.body.decision, "allow");
  assert.equal(r.body.remaining, 9);
});

// --- Fixed worker ----------------------------------------------------------

test("FIXED: with the limiter binding absent, the request is refused 503 rate-limiter-unavailable", async () => {
  const env = makeEnv(fixed, { limiter: false });
  const r = await authorize(fixed, env, authBody("req-nolimit-fixed"));
  assert.equal(r.status, 503);
  assert.equal(r.body.decision, "deny");
  assert.equal(r.body.authorized, false);
  assert.equal(r.body.reason, "rate-limiter-unavailable");
});

test("FIXED: the unavailable refusal is audit-recorded like the endpoint's other refusals", async () => {
  const env = makeEnv(fixed, { limiter: false });
  await authorize(fixed, env, authBody("req-nolimit-recorded"));
  const record = await auditRecord(env, "req-nolimit-recorded");
  assert.ok(record, "the refusal must leave an audit record");
  assert.equal(record.decision.reason, "rate-limiter-unavailable");
});

test("FIXED: with the limiter present, a request is allowed and counted, exactly as before", async () => {
  const env = makeEnv(fixed, { limiter: true });
  const r = await authorize(fixed, env, authBody("req-limit-fixed"));
  assert.equal(r.status, 200);
  assert.equal(r.body.decision, "allow");
  assert.equal(r.body.remaining, 9);
});

test("FIXED: with the limiter present and over the limit, the 429 path is unchanged", async () => {
  const env = makeEnv(fixed, { limiter: true });
  for (let i = 0; i < 10; i++) {
    const r = await authorize(fixed, env, authBody(`req-over-${i}`));
    assert.equal(r.status, 200);
  }
  const over = await authorize(fixed, env, authBody("req-over-10"));
  assert.equal(over.status, 429);
  assert.equal(over.body.decision, "deny");
  assert.equal(over.body.reason, "rate-limited");
});
