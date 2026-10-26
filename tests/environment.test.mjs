// Tests for the /v1/authorize environment-binding fix.
//
// Run: node --test environment.test.mjs
//
// The defect: the landing worker ignored the request's `environment`
// field entirely — it was not bound, echoed, or checked, and the
// worker carried no environment concept of its own (no ENVIRONMENT
// var is declared in wrangler.toml or read anywhere in the file).
// A validly signed request naming any environment was authorized
// against any deployment. Demonstrated live against the main worker
// by the Diamond Gauntlet harness (COLOR section).
//
// The binding under test (defined by this fix, from the code's own
// conventions — deploy-time values arrive via `env`, like
// SIGNING_SECRET; unbound configuration fails closed, like the
// ingest route's unbound backend):
//   - A request that declares an environment (a string `environment`
//     member) is bound to the deployment it names: the declaration
//     must equal the worker's configured ENVIRONMENT.
//   - Mismatch -> 403 "environment-mismatch", refused before the
//     policy decision and audit-recorded like the adjacent
//     malformed-request refusal.
//   - Declared, but the deployment has not configured ENVIRONMENT
//     -> 503 "environment-unverifiable" (cannot verify = refuse).
//   - No declaration (the existing client sends none) -> unchanged.
//
// The Durable Object stubs below simulate the one platform guarantee
// the worker's own classes rely on: requests to a single DO instance
// are processed serially. The stub enforces that with a per-instance
// promise chain over an in-memory store. Everything else — signing,
// policy, rate limiting, the environment check — runs the worker's
// own code, including its own RateLimiter and AuditLog classes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, createHash } from "node:crypto";

import * as orig from "./fixtures/_worker.pre-environment.mjs";
import * as fixed from "./fixtures/_worker.with-environment.mjs";

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

function makeEnv(mod, { environment } = {}) {
  const env = {
    ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
    SIGNING_SECRET: SECRET,
    RATE_LIMITER: makeNamespace(mod.RateLimiter),
    AUDIT_LOG: makeNamespace(mod.AuditLog),
  };
  if (environment !== undefined) env.ENVIRONMENT = environment;
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

// Body shape mirrors the Iris client (js/iris-session.js buildAuthBody),
// plus the optional `environment` declaration under test.
const authBody = (requestId, { environment, action = "iris.turn.look" } = {}) => {
  const body = {
    principal: { unity_id: "u-test" },
    action,
    request_id: requestId,
    input_sha256: EMPTY_SHA256,
    compute_lane: "look",
    memory_requested: false,
  };
  if (environment !== undefined) body.environment = environment;
  return body;
};

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

test("ORIGINAL: a request declaring a foreign environment is allowed (defect)", async () => {
  const env = makeEnv(orig, { environment: "production" });
  const r = await authorize(orig, env, authBody("req-env-foreign", { environment: "staging" }));
  assert.equal(r.status, 200); // defect: the field is ignored entirely
  assert.equal(r.body.decision, "allow");
});

test("ORIGINAL: a declared environment is allowed even with no configured environment (defect)", async () => {
  const env = makeEnv(orig, {}); // the original reads no ENVIRONMENT var at all
  const r = await authorize(orig, env, authBody("req-env-none", { environment: "staging" }));
  assert.equal(r.status, 200); // defect: no binding exists to check against
  assert.equal(r.body.decision, "allow");
});

// --- Fixed worker ----------------------------------------------------------

test("FIXED: a declaration matching the configured environment is allowed end to end", async () => {
  const env = makeEnv(fixed, { environment: "production" });
  const r = await authorize(fixed, env, authBody("req-env-match", { environment: "production" }));
  assert.equal(r.status, 200);
  assert.equal(r.body.decision, "allow");
  assert.equal(r.body.authorized, true);
  assert.equal(r.body.request_id, "req-env-match");
  assert.equal(r.body.principal.unity_id, "u-test");
});

test("FIXED: a mismatched declaration is refused 403 environment-mismatch and audit-recorded", async () => {
  const env = makeEnv(fixed, { environment: "production" });
  const r = await authorize(fixed, env, authBody("req-env-mismatch", { environment: "staging" }));
  assert.equal(r.status, 403);
  assert.equal(r.body.decision, "deny");
  assert.equal(r.body.authorized, false);
  assert.equal(r.body.reason, "environment-mismatch");

  const record = await auditRecord(env, "req-env-mismatch");
  assert.ok(record, "the refusal must leave an audit record");
  assert.equal(record.decision.reason, "environment-mismatch");
});

test("FIXED: a declaration the deployment cannot verify fails closed 503 environment-unverifiable", async () => {
  const env = makeEnv(fixed, {}); // ENVIRONMENT not configured on this deployment
  const r = await authorize(fixed, env, authBody("req-env-unverifiable", { environment: "production" }));
  assert.equal(r.status, 503);
  assert.equal(r.body.decision, "deny");
  assert.equal(r.body.authorized, false);
  assert.equal(r.body.reason, "environment-unverifiable");
});

test("FIXED: no declaration is unchanged — allowed, configured or not", async () => {
  const configured = makeEnv(fixed, { environment: "production" });
  const r1 = await authorize(fixed, configured, authBody("req-env-absent-1", {}));
  assert.equal(r1.status, 200);
  assert.equal(r1.body.decision, "allow");

  const unconfigured = makeEnv(fixed, {});
  const r2 = await authorize(fixed, unconfigured, authBody("req-env-absent-2", {}));
  assert.equal(r2.status, 200);
  assert.equal(r2.body.decision, "allow");
});

test("FIXED: a non-string environment member is not a declaration", async () => {
  const env = makeEnv(fixed, { environment: "production" });
  const r = await authorize(fixed, env, authBody("req-env-nonstr", { environment: 42 }));
  assert.equal(r.status, 200);
  assert.equal(r.body.decision, "allow");
});

test("FIXED: the environment refusal precedes the policy decision; policy still decides on a match", async () => {
  const env = makeEnv(fixed, { environment: "production" });
  const wrongFirst = await authorize(
    fixed, env,
    authBody("req-env-order", { environment: "staging", action: "iris.turn.bogus" })
  );
  assert.equal(wrongFirst.status, 403); // environment layer, not the policy layer
  assert.equal(wrongFirst.body.reason, "environment-mismatch");

  const policyDeny = await authorize(
    fixed, env,
    authBody("req-env-order-2", { environment: "production", action: "iris.turn.bogus" })
  );
  assert.equal(policyDeny.status, 403);
  assert.equal(policyDeny.body.reason, "unknown-action");
});
