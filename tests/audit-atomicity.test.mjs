// Tests for the /v1/authorize audit-atomicity fix (finding C, record half).
//
// Run: node --test audit-atomicity.test.mjs
//
// Base: PR #180's worker (branch fix/atomic-claim-authorize). #180
// made the idempotency claim fail closed, but left the durable
// audit record where the original put it: written afterwards, by
// a separate best-effort recordAudit call whose failure is
// swallowed by design. If that record write fails after a
// successful claim, the allow stands on the claim record alone —
// authorized, claimed, and without its durable decision record.
//
// Demonstrated below against the pre-fix fixture (PR #180's
// worker): with record writes failing and claim writes healthy,
// an allow is issued, the claim record exists, and no decision
// record exists. The Diamond Gauntlet named this remainder
// explicitly (owner question C: "if the record write fails after
// a successful claim, the allow stands and the evidence is a
// claim record alone").
//
// The fix: the decision record becomes part of the claim itself.
// The authorize handler supplies the record with the claim; the
// AuditLog object writes it in the same operation, BEFORE the
// claim (the claim is the commit point). A failed record write
// therefore fails the claim, the claim fails closed, and no
// allow is issued. The record is stamped with the claim's own
// timestamp, which its decision also carries, so the durable
// record matches the issued allow.
//
// The Durable Object stubs below simulate the one platform
// guarantee the worker's own classes rely on: requests to a
// single DO instance are processed serially. The stub enforces
// that with a per-instance promise chain over an in-memory store.
// The store can be told to fail writes for one key prefix, which
// is how the claim/record split is pried open in the defect test.
// Everything else — signing, policy, rate limiting, the claim —
// runs the worker's own code, including its own classes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, createHash } from "node:crypto";

import * as pre from "./fixtures/_worker.pre-atomicity.mjs";
import * as fixed from "./fixtures/_worker.with-atomicity.mjs";

const SECRET = "test-secret";
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const EMPTY_SHA256 = sha256("");

class MemStorage {
  constructor() { this.map = new Map(); this.failPutPrefix = null; }
  async get(k) { return this.map.get(k); }
  async put(k, v) {
    if (this.failPutPrefix && k.startsWith(this.failPutPrefix)) {
      throw new Error("injected storage failure");
    }
    this.map.set(k, v);
  }
}

function makeNamespace(Klass) {
  const instances = new Map();
  const stores = new Map();
  const ns = {
    idFromName(name) { return String(name); },
    get(id) {
      if (!instances.has(id)) {
        const storage = new MemStorage();
        const inst = new Klass({ storage });
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
        stores.set(id, storage);
      }
      return instances.get(id);
    },
  };
  return { ns, stores };
}

function makeEnv(mod) {
  const rl = makeNamespace(mod.RateLimiter);
  const al = makeNamespace(mod.AuditLog);
  return {
    env: {
      ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
      SIGNING_SECRET: SECRET,
      RATE_LIMITER: rl.ns,
      AUDIT_LOG: al.ns,
    },
    auditStores: al.stores,
  };
}

// The AuditLog instance — and its store — for one request_id.
// Touches the namespace so the instance (and store) exists before
// a test sabotages it.
function auditStore(harness, requestId) {
  harness.env.AUDIT_LOG.get(harness.env.AUDIT_LOG.idFromName(requestId));
  return harness.auditStores.get(requestId);
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
const authBody = (requestId, { action = "iris.turn.look" } = {}) => ({
  principal: { unity_id: "u-test" },
  action,
  request_id: requestId,
  input_sha256: EMPTY_SHA256,
  compute_lane: "look",
  memory_requested: false,
});

async function authorize(mod, env, bodyObj) {
  const res = await mod.default.fetch(signedRequest(bodyObj), env);
  return { status: res.status, body: await res.json() };
}

// --- Against the PRE-FIX worker (PR #180): the split, demonstrated ---------

test("PRE-FIX (#180): a healthy allow leaves both a claim record and a decision record (control)", async () => {
  const h = makeEnv(pre);
  const r = await authorize(pre, h.env, authBody("req-atomic-ctl"));
  assert.equal(r.status, 200);
  const store = auditStore(h, "req-atomic-ctl");
  assert.ok(store.map.get("claim:req-atomic-ctl"), "claim record exists");
  assert.ok(store.map.get("req:req-atomic-ctl"), "decision record exists");
});

test("PRE-FIX (#180): when the record write fails after a successful claim, the allow stands on the claim alone (defect)", async () => {
  const h = makeEnv(pre);
  const store = auditStore(h, "req-atomic-split");
  store.failPutPrefix = "req:"; // record writes fail; claim writes healthy
  const r = await authorize(pre, h.env, authBody("req-atomic-split"));
  assert.equal(r.status, 200); // the allow is issued anyway
  assert.equal(r.body.decision, "allow");
  assert.ok(store.map.get("claim:req-atomic-split"), "the claim record exists");
  assert.equal(store.map.get("req:req-atomic-split"), undefined); // no durable decision record
});

// --- Fixed worker ----------------------------------------------------------

test("FIXED: a healthy allow writes claim and record atomically, and the record matches the issued allow", async () => {
  const h = makeEnv(fixed);
  const r = await authorize(fixed, h.env, authBody("req-atomic-ok"));
  assert.equal(r.status, 200);
  assert.equal(r.body.decision, "allow");

  const store = auditStore(h, "req-atomic-ok");
  const claim = store.map.get("claim:req-atomic-ok");
  const record = store.map.get("req:req-atomic-ok");
  assert.ok(claim, "claim record exists");
  assert.ok(record, "decision record exists");
  assert.equal(claim.claimed_at, r.body.claimed_at);
  assert.equal("record" in claim, false); // the record is not nested in the claim
  assert.deepEqual(record.decision, r.body); // the durable record IS the issued allow
  assert.equal(record.recorded_at, r.body.claimed_at);
  assert.equal(record.original_body.request_id, "req-atomic-ok");
});

test("FIXED: when the record write fails, the claim fails closed — no allow, no claim, and a retry is not blocked", async () => {
  const h = makeEnv(fixed);
  const store = auditStore(h, "req-atomic-fail");
  store.failPutPrefix = "req:";
  const r = await authorize(fixed, h.env, authBody("req-atomic-fail"));
  assert.equal(r.status, 503);
  assert.equal(r.body.decision, "deny");
  assert.equal(r.body.reason, "claim-unavailable");
  assert.equal(store.map.get("claim:req-atomic-fail"), undefined); // no claim stands
  assert.equal(store.map.get("req:req-atomic-fail"), undefined);

  store.failPutPrefix = null; // storage recovers
  const retry = await authorize(fixed, h.env, authBody("req-atomic-fail"));
  assert.equal(retry.status, 200);
  assert.equal(retry.body.decision, "allow");
  assert.ok(store.map.get("claim:req-atomic-fail"));
  assert.ok(store.map.get("req:req-atomic-fail"));
});

test("FIXED: a duplicate is refused 409 and the single durable record is unchanged", async () => {
  const h = makeEnv(fixed);
  const first = await authorize(fixed, h.env, authBody("req-atomic-dup"));
  assert.equal(first.status, 200);
  const store = auditStore(h, "req-atomic-dup");
  const recordBefore = store.map.get("req:req-atomic-dup");

  const dup = await authorize(fixed, h.env, authBody("req-atomic-dup"));
  assert.equal(dup.status, 409);
  assert.equal(dup.body.reason, "duplicate-request");
  assert.equal(store.map.get("req:req-atomic-dup"), recordBefore); // insert-if-absent: untouched
});

test("FIXED: a policy deny consumes no claim and writes no claim record", async () => {
  const h = makeEnv(fixed);
  const r = await authorize(fixed, h.env, authBody("req-atomic-deny", { action: "iris.turn.bogus" }));
  assert.equal(r.status, 403);
  assert.equal(r.body.reason, "unknown-action");
  const store = auditStore(h, "req-atomic-deny");
  assert.equal(store.map.get("claim:req-atomic-deny"), undefined);
});

test("FIXED: 10 concurrent duplicates yield exactly one allow, and its record exists", async () => {
  const h = makeEnv(fixed);
  const results = await Promise.all(
    Array.from({ length: 10 }, () => authorize(fixed, h.env, authBody("req-atomic-race")))
  );
  const allows = results.filter((r) => r.status === 200);
  const dups = results.filter((r) => r.status === 409);
  assert.equal(allows.length, 1);
  assert.equal(dups.length, 9);
  const store = auditStore(h, "req-atomic-race");
  assert.ok(store.map.get("claim:req-atomic-race"));
  assert.deepEqual(store.map.get("req:req-atomic-race").decision, allows[0].body);
});
