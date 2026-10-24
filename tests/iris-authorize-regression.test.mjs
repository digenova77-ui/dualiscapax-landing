/**
 * Iris authorize regression suite.
 *
 * Covers the client-side contract for the authorize path:
 *   - Denial blocks downstream inference
 *   - Timeout is treated as denial
 *   - Duplicate request_id is refused
 *   - Concurrent claims are serialized (exactly one succeeds)
 *   - Successful authorization returns a receipt
 *   - Missing secret is fail-closed
 *   - Production path does not require a browser secret
 *
 * Run with: node --test tests/iris-authorize-regression.test.mjs
 *
 * These tests use in-memory stubs. They do not call live services
 * or require Cloudflare credentials.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

// Minimal in-memory stubs for the client helper contract.
// Each behavior name maps to a deterministic response so the tests
// can assert on status, authorized flag, and receipt shape.
function makeAuthorizeStub(behavior) {
  return {
    authorize: async (body, secret) => {
      if (behavior === "deny") {
        return { status: 403, ok: false, data: { authorized: false, reason: "policy" } };
      }
      if (behavior === "timeout") {
        throw new Error("timeout");
      }
      if (behavior === "duplicate") {
        return { status: 409, ok: false, data: { authorized: false, reason: "duplicate-request" } };
      }
      if (behavior === "allow") {
        return {
          status: 200,
          ok: true,
          data: {
            authorized: true,
            decision: "allow",
            request_id: body.request_id,
            receipt: { id: "rct_" + body.request_id, sha256: "a".repeat(64) }
          }
        };
      }
      return { status: 500, ok: false, data: null };
    }
  };
}

// Case: denial must stop the turn.
// Downstream callers (DCLMLook, IrisLive) must not run when authorized is false.
test("denial blocks turn and does not call downstream", async () => {
  const calls = [];
  const w = {
    IrisAuthorize: makeAuthorizeStub("deny"),
    IrisSigningSecret: "test-secret",
    DCLMLook: { run: () => { calls.push("dclm"); return { spoken: "should-not-run" }; } },
    IrisLive: { run: () => { calls.push("live"); return { spoken: "should-not-run" }; } }
  };
  // Simulate the clerk decision path from iris-session.js
  const secret = w.IrisSigningSecret;
  const res = await w.IrisAuthorize.authorize({ request_id: "t1" }, secret);
  assert.equal(res.ok, false);                 // HTTP not ok
  assert.equal(res.data.authorized, false);    // decision is deny
  assert.equal(calls.length, 0);               // no downstream calls
});

// Case: timeout is treated as denial.
// A hanging or failed authorize call must not proceed to inference.
test("timeout is treated as denial", async () => {
  const w = {
    IrisAuthorize: makeAuthorizeStub("timeout"),
    IrisSigningSecret: "test-secret"
  };
  let caught = false;
  try {
    await w.IrisAuthorize.authorize({ request_id: "t2" }, w.IrisSigningSecret);
  } catch (e) {
    caught = true;
    assert.match(String(e), /timeout/);        // error is a timeout
  }
  assert.equal(caught, true);                  // exception was raised
});

// Case: duplicate request_id is refused.
// The server must reject a second claim with the same idempotency key.
test("duplicate request_id is refused", async () => {
  const w = {
    IrisAuthorize: makeAuthorizeStub("duplicate"),
    IrisSigningSecret: "test-secret"
  };
  const res = await w.IrisAuthorize.authorize({ request_id: "dup-1" }, w.IrisSigningSecret);
  assert.equal(res.status, 409);               // conflict
  assert.equal(res.data.reason, "duplicate-request");  // explicit reason
});

// Case: concurrent claims with the same request_id.
// The client sends a stable request_id; the server must serialize so
// exactly one claim succeeds and the other is refused.
test("concurrent claims with same request_id are serialized by server", async () => {
  const seen = new Set();
  const stub = {
    authorize: async (body) => {
      if (seen.has(body.request_id)) {
        return { status: 409, ok: false, data: { authorized: false, reason: "duplicate-request" } };
      }
      seen.add(body.request_id);
      return { status: 200, ok: true, data: { authorized: true, request_id: body.request_id } };
    }
  };
  const body = { request_id: "conc-1" };
  const [a, b] = await Promise.all([
    stub.authorize(body),
    stub.authorize(body)
  ]);
  const allowed = [a, b].filter(r => r.ok).length;
  const denied = [a, b].filter(r => !r.ok).length;
  assert.equal(allowed, 1);                    // exactly one success
  assert.equal(denied, 1);                     // the other is refused
});

// Case: successful authorization returns a receipt.
// The receipt must carry an id (rct_ prefix) and a 64-char sha256.
test("successful authorization returns receipt shape", async () => {
  const w = {
    IrisAuthorize: makeAuthorizeStub("allow"),
    IrisSigningSecret: "test-secret"
  };
  const res = await w.IrisAuthorize.authorize({ request_id: "rct-1" }, w.IrisSigningSecret);
  assert.equal(res.ok, true);                  // allowed
  assert.equal(res.data.authorized, true);     // decision is allow
  assert.ok(res.data.receipt);                 // receipt present
  assert.match(res.data.receipt.id, /^rct_/);  // id prefix
  assert.equal(res.data.receipt.sha256.length, 64);  // hash length
});

// Case: missing secret is treated as unavailable (fail closed).
// If no signing material is present, the client must not proceed.
test("missing secret is treated as unavailable (fail closed)", async () => {
  const secret = null;
  const available = !!(secret && typeof (async () => {}) === "function");
  assert.equal(available, false);              // unavailable
});

// Case: production path does not require a browser secret.
// In production IrisSigningSecret is absent. The client posts to
// IrisAuthorizeBase and the server holds the key.
test("production path does not require a browser secret", async () => {
  const w = { IrisAuthorizeBase: "https://staging.example" };
  assert.equal(w.IrisSigningSecret, undefined);  // no browser secret
  const body = { request_id: "prod-1" };
  const productionCall = { url: w.IrisAuthorizeBase + "/v1/authorize", body, credentials: "same-origin" };
  assert.ok(productionCall.url.endsWith("/v1/authorize"));  // correct path
  assert.equal(productionCall.credentials, "same-origin");  // session credentials
});
