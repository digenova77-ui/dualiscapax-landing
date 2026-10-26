// Tests for the /v1/authorize digest-binding fix.
//
// Run: node --test digest.test.mjs
//
// The defect: the landing worker checked input_sha256 for format only
// (/^[a-f0-9]{64}$/) and never recomputed it. A validly signed request
// carrying a well-formed but false digest was allowed, and the false
// digest was echoed back in the allow as if it were bound.
//
// The binding under test: input_sha256 is the SHA-256 hex digest of
// the submitted input text — the request body's `text` member, with
// an absent or non-string `text` treated as the empty string. That is
// the contract the Iris client computes (js/iris-session.js), the
// staging runtime enforces (workers/iris-runtime/worker.mjs, refusal
// reason "input-digest-mismatch"), and the contract tests document
// (tests/test_iris_authorize_contract.py: "input_sha256 binds the
// decision to the exact submitted text").
//
// The Durable Object stubs below simulate the one platform guarantee
// the worker's own classes rely on: requests to a single DO instance
// are processed serially. The stub enforces that with a per-instance
// promise chain over an in-memory store. Everything else — signing,
// policy, rate limiting, digest recomputation — runs the worker's
// own code, including its own RateLimiter and AuditLog classes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, createHash } from "node:crypto";

import * as orig from "./fixtures/_worker.pre-digest.mjs";
import * as fixed from "./fixtures/_worker.with-digest.mjs";

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

function makeEnv(mod) {
  return {
    ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
    SIGNING_SECRET: SECRET,
    RATE_LIMITER: makeNamespace(mod.RateLimiter),
    AUDIT_LOG: makeNamespace(mod.AuditLog),
  };
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
const authBody = (requestId, { text, digest, action = "iris.turn.look" } = {}) => {
  const body = {
    principal: { unity_id: "u-test" },
    action,
    request_id: requestId,
    input_sha256: digest,
    compute_lane: "look",
    memory_requested: false,
  };
  if (text !== undefined) body.text = text;
  return body;
};

async function authorize(mod, env, bodyObj) {
  const res = await mod.default.fetch(signedRequest(bodyObj), env);
  return { status: res.status, body: await res.json() };
}

// --- Defect demonstration against the ORIGINAL worker ---------------------

test("ORIGINAL: a well-formed but false digest is allowed and echoed (defect)", async () => {
  const env = makeEnv(orig);
  const falseDigest = "0".repeat(64);
  const r = await authorize(orig, env, authBody("req-false", { text: "hello iris", digest: falseDigest }));
  assert.equal(r.status, 200); // defect: never recomputed
  assert.equal(r.body.decision, "allow");
  assert.equal(r.body.input_sha256, falseDigest); // echoed as if bound
});

test("ORIGINAL: a digest computed over a different input is allowed (defect)", async () => {
  const env = makeEnv(orig);
  const r = await authorize(orig, env, authBody("req-other", { text: "goodbye", digest: sha256("hello") }));
  assert.equal(r.status, 200); // defect: digest belongs to another input
  assert.equal(r.body.decision, "allow");
});

// --- Fixed worker ----------------------------------------------------------

test("FIXED: a correct digest is allowed end to end and echoed as verified", async () => {
  const env = makeEnv(fixed);
  const digest = sha256("hello iris");
  const r = await authorize(fixed, env, authBody("req-ok", { text: "hello iris", digest }));
  assert.equal(r.status, 200);
  assert.equal(r.body.decision, "allow");
  assert.equal(r.body.authorized, true);
  assert.equal(r.body.input_sha256, digest);
  assert.equal(r.body.request_id, "req-ok");
  assert.equal(r.body.principal.unity_id, "u-test");
});

test("FIXED: a false digest is refused 400 input-digest-mismatch and never echoed", async () => {
  const env = makeEnv(fixed);
  const r = await authorize(fixed, env, authBody("req-false", { text: "hello iris", digest: "0".repeat(64) }));
  assert.equal(r.status, 400);
  assert.equal(r.body.decision, "deny");
  assert.equal(r.body.authorized, false);
  assert.equal(r.body.reason, "input-digest-mismatch");
  assert.equal("input_sha256" in r.body, false);
});

test("FIXED: a digest computed over a different input is refused", async () => {
  const env = makeEnv(fixed);
  const r = await authorize(fixed, env, authBody("req-other", { text: "goodbye", digest: sha256("hello") }));
  assert.equal(r.status, 400);
  assert.equal(r.body.reason, "input-digest-mismatch");
});

test("FIXED: input tampered after signing is refused by the digest check, not the signature", async () => {
  const env = makeEnv(fixed);
  // The envelope signature is valid for the body actually sent; the
  // digest still names the pre-tamper text, so only the digest layer
  // can refuse this request.
  const r = await authorize(fixed, env, authBody("req-tamper", { text: "tampered", digest: sha256("original") }));
  assert.equal(r.status, 400);
  assert.equal(r.body.reason, "input-digest-mismatch");

  // Control: tampering with the raw body without re-signing is still
  // stopped one layer earlier, by the signature itself.
  const goodText = JSON.stringify(authBody("req-tamper-raw", { text: "original", digest: sha256("original") }));
  const headers = signatureHeaders(goodText);
  const tamperedText = goodText.replace("original", "tampered");
  const res = await fixed.default.fetch(
    new Request("https://landing.test/v1/authorize", { method: "POST", headers, body: tamperedText }),
    env
  );
  assert.equal(res.status, 401);
  assert.equal((await res.json()).reason, "invalid-signature");
});

test("FIXED: a textless request must carry the digest of the empty string", async () => {
  const env = makeEnv(fixed);
  const ok = await authorize(fixed, env, authBody("req-notext-ok", { digest: EMPTY_SHA256 }));
  assert.equal(ok.status, 200);
  assert.equal(ok.body.decision, "allow");
  const bad = await authorize(fixed, env, authBody("req-notext-bad", { digest: sha256("hello") }));
  assert.equal(bad.status, 400);
  assert.equal(bad.body.reason, "input-digest-mismatch");
});

test("FIXED: a non-string text member is treated as the empty string", async () => {
  const env = makeEnv(fixed);
  const r = await authorize(fixed, env, authBody("req-nonstr", { text: 42, digest: EMPTY_SHA256 }));
  assert.equal(r.status, 200);
  assert.equal(r.body.decision, "allow");
});

test("FIXED: the digest refusal precedes the policy decision; policy still decides when the digest verifies", async () => {
  const env = makeEnv(fixed);
  const wrongFirst = await authorize(
    fixed, env,
    authBody("req-order", { text: "hello", digest: "0".repeat(64), action: "iris.turn.bogus" })
  );
  assert.equal(wrongFirst.status, 400); // digest layer, not the 403 policy layer
  assert.equal(wrongFirst.body.reason, "input-digest-mismatch");

  const policyDeny = await authorize(
    fixed, env,
    authBody("req-order-2", { text: "hello", digest: sha256("hello"), action: "iris.turn.bogus" })
  );
  assert.equal(policyDeny.status, 403);
  assert.equal(policyDeny.body.reason, "unknown-action");
});
