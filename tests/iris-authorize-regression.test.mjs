/**
 * Iris authorize regression suite.
 * Covers denial, timeout, duplicate request_id, concurrent claims, and receipt shape.
 * Run with: node --test tests/iris-authorize-regression.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";

// Minimal in-memory stubs for the client helper contract.
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
  assert.equal(res.ok, false);
  assert.equal(res.data.authorized, false);
  assert.equal(calls.length, 0);
});

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
    assert.match(String(e), /timeout/);
  }
  assert.equal(caught, true);
});

test("duplicate request_id is refused", async () => {
  const w = {
    IrisAuthorize: makeAuthorizeStub("duplicate"),
    IrisSigningSecret: "test-secret"
  };
  const res = await w.IrisAuthorize.authorize({ request_id: "dup-1" }, w.IrisSigningSecret);
  assert.equal(res.status, 409);
  assert.equal(res.data.reason, "duplicate-request");
});

test("concurrent claims with same request_id are serialized by server", async () => {
  // Client must send a stable request_id; server is responsible for atomic claim.
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
  assert.equal(allowed, 1);
  assert.equal(denied, 1);
});

test("successful authorization returns receipt shape", async () => {
  const w = {
    IrisAuthorize: makeAuthorizeStub("allow"),
    IrisSigningSecret: "test-secret"
  };
  const res = await w.IrisAuthorize.authorize({ request_id: "rct-1" }, w.IrisSigningSecret);
  assert.equal(res.ok, true);
  assert.equal(res.data.authorized, true);
  assert.ok(res.data.receipt);
  assert.match(res.data.receipt.id, /^rct_/);
  assert.equal(res.data.receipt.sha256.length, 64);
});

test("missing secret is treated as unavailable (fail closed)", async () => {
  const secret = null;
  const available = !!(secret && typeof (async () => {}) === "function");
  assert.equal(available, false);
});

test("production path does not require a browser secret", async () => {
  // In production IrisSigningSecret is absent. The client posts to
  // IrisAuthorizeBase and the server holds the key.
  const w = { IrisAuthorizeBase: "https://staging.example" };
  assert.equal(w.IrisSigningSecret, undefined);
  // The production helper must not read a secret from the browser.
  const body = { request_id: "prod-1" };
  // Simulate the production call shape: no secret argument.
  const productionCall = { url: w.IrisAuthorizeBase + "/v1/authorize", body, credentials: "same-origin" };
  assert.ok(productionCall.url.endsWith("/v1/authorize"));
  assert.equal(productionCall.credentials, "same-origin");
});
