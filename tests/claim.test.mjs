// Tests for the prepared /v1/authorize atomic-claim fix (finding D).
//
// Run: node --test claim.test.mjs
//
// The Durable Object stubs below simulate the one platform guarantee the
// fix relies on: requests to a single DO instance (addressed here by
// idFromName(request_id), exactly as the worker addresses it) are
// processed serially. The stub enforces that with a per-instance promise
// chain over an in-memory store. Everything else — signing, policy,
// rate limiting — runs the worker's own code, including its own
// RateLimiter and AuditLog classes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import * as orig from "./fixtures/_worker.pre-claim.mjs";
import * as fixed from "./fixtures/_worker.with-claim.mjs";

const SECRET = "test-secret";

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

function makeEnv(mod, { audit = true } = {}) {
  const env = {
    ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
    SIGNING_SECRET: SECRET,
    RATE_LIMITER: makeNamespace(mod.RateLimiter),
  };
  if (audit) env.AUDIT_LOG = makeNamespace(mod.AuditLog);
  return env;
}

function signedRequest(bodyObj) {
  const bodyText = JSON.stringify(bodyObj);
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac("sha256", SECRET).update(`${ts}.${bodyText}`).digest("hex");
  return new Request("https://landing.test/v1/authorize", {
    method: "POST",
    headers: { "x-timestamp": ts, "x-signature": sig, "content-type": "application/json" },
    body: bodyText,
  });
}

const validBody = (requestId, action = "iris.turn.look") => ({
  principal: { unity_id: "u-test" },
  action,
  request_id: requestId,
  input_sha256: "a".repeat(64),
});

async function authorize(mod, env, bodyObj) {
  const res = await mod.default.fetch(signedRequest(bodyObj), env);
  return { status: res.status, body: await res.json() };
}

// --- Defect demonstration against the ORIGINAL worker ---------------------

test("ORIGINAL: duplicate request_id is allowed twice (defect D)", async () => {
  const env = makeEnv(orig);
  const first = await authorize(orig, env, validBody("req-dup"));
  const second = await authorize(orig, env, validBody("req-dup"));
  assert.equal(first.status, 200);
  assert.equal(second.status, 200); // defect: no claim, second allow issued
  assert.equal(second.body.decision, "allow");
});

test("ORIGINAL: 10 concurrent duplicates all receive allow (defect D)", async () => {
  const env = makeEnv(orig);
  const results = await Promise.all(
    Array.from({ length: 10 }, () => authorize(orig, env, validBody("req-conc")))
  );
  assert.equal(results.filter((r) => r.status === 200).length, 10);
});

// --- Fixed worker ----------------------------------------------------------

test("FIXED: first authorize returns allow with a claim timestamp", async () => {
  const env = makeEnv(fixed);
  const r = await authorize(fixed, env, validBody("req-1"));
  assert.equal(r.status, 200);
  assert.equal(r.body.decision, "allow");
  assert.equal(typeof r.body.claimed_at, "string");
});

test("FIXED: duplicate request_id is refused 409 duplicate-request", async () => {
  const env = makeEnv(fixed);
  const first = await authorize(fixed, env, validBody("req-2"));
  const second = await authorize(fixed, env, validBody("req-2"));
  assert.equal(first.status, 200);
  assert.equal(second.status, 409);
  assert.equal(second.body.decision, "deny");
  assert.equal(second.body.reason, "duplicate-request");
});

test("FIXED: 10 concurrent duplicates yield exactly one allow", async () => {
  const env = makeEnv(fixed);
  const results = await Promise.all(
    Array.from({ length: 10 }, () => authorize(fixed, env, validBody("req-3")))
  );
  assert.equal(results.filter((r) => r.status === 200).length, 1);
  assert.equal(results.filter((r) => r.status === 409).length, 9);
});

test("FIXED: missing AUDIT_LOG binding refuses closed (503 claim-unavailable)", async () => {
  const env = makeEnv(fixed, { audit: false });
  const r = await authorize(fixed, env, validBody("req-4"));
  assert.equal(r.status, 503);
  assert.equal(r.body.decision, "deny");
  assert.equal(r.body.reason, "claim-unavailable");
});

test("FIXED: a policy deny does not consume the claim", async () => {
  const env = makeEnv(fixed);
  const denied = await authorize(fixed, env, validBody("req-5", "iris.turn.bogus"));
  assert.equal(denied.status, 403);
  const retried = await authorize(fixed, env, validBody("req-5", "iris.turn.look"));
  assert.equal(retried.status, 200);
  assert.equal(retried.body.decision, "allow");
});

test("FIXED: distinct request_ids are independent", async () => {
  const env = makeEnv(fixed);
  const a = await authorize(fixed, env, validBody("req-6a"));
  const b = await authorize(fixed, env, validBody("req-6b"));
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
});
