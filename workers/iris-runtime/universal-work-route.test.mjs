import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.mjs";

const ORIGIN = "https://dualiscapax.ai";
const env = { IRIS_ALLOWED_ORIGINS: ORIGIN };
const envelope = () => ({
  contract: "dualis.work.v1",
  request_id: "request-123456",
  input_sha256: "a".repeat(64),
  unity_id: "unity_user_123",
  action: "compute.evaluate",
  module: "dclm.v1",
  policy_version: "trinity.v1",
  complexity: {
    class: "unknown",
    features: { input_items: 1 },
    estimate_basis: "No calibrated complexity estimator; class marked unknown."
  },
  resource_budget: { cpu_ms: 1000, memory_bytes: 1048576 },
  verification: {
    class: "deterministic-check",
    acceptance_criterion: "Return a deterministic result matching the specified operation."
  }
});
function request(body, method = "POST") {
  return new Request("https://iris-runtime.test/v1/work/validate", {
    method,
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body)
  });
}

test("work validation endpoint accepts a valid envelope without executing or authorizing it", async () => {
  const response = await worker.fetch(request(envelope()), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.contract, "dualis.work.validation.v1");
  assert.equal(body.valid, true);
  assert.deepEqual(body.errors, []);
  assert.equal(body.execution_performed, false);
  assert.equal(body.authorization_performed, false);
  assert.equal(body.metering_performed, false);
  assert.equal(body.settlement_performed, false);
});

test("work validation endpoint rejects malformed envelope and identifies errors", async () => {
  const invalid = envelope();
  delete invalid.policy_version;
  const response = await worker.fetch(request(invalid), env);
  const body = await response.json();
  assert.equal(response.status, 422);
  assert.equal(body.valid, false);
  assert.ok(body.errors.includes("invalid-policy-version"));
  assert.equal(body.execution_performed, false);
});

test("work validation endpoint rejects unknown top-level fields", async () => {
  const invalid = { ...envelope(), execute_now: true };
  const response = await worker.fetch(request(invalid), env);
  const body = await response.json();
  assert.equal(response.status, 422);
  assert.ok(body.errors.includes("unknown-envelope-field"));
  assert.equal(body.execution_performed, false);
});

test("work validation endpoint enforces exact configured origin", async () => {
  const req = new Request("https://iris-runtime.test/v1/work/validate", {
    method: "POST",
    headers: { origin: "https://attacker.example", "content-type": "application/json" },
    body: JSON.stringify(envelope())
  });
  const response = await worker.fetch(req, env);
  assert.equal(response.status, 403);
});

test("work validation endpoint rejects GET without touching service bindings", async () => {
  const response = await worker.fetch(request(null, "GET"), env);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
});

test("work validation endpoint rejects malformed JSON without execution", async () => {
  const req = new Request("https://iris-runtime.test/v1/work/validate", {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: "{not-json"
  });
  const response = await worker.fetch(req, env);
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.deepEqual(body.errors, ["invalid-json"]);
  assert.equal(body.execution_performed, false);
});

test("work validation endpoint rejects oversized input before validation", async () => {
  const req = new Request("https://iris-runtime.test/v1/work/validate", {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: JSON.stringify({ envelope: "x".repeat(17000) })
  });
  const response = await worker.fetch(req, env);
  const body = await response.json();
  assert.equal(response.status, 413);
  assert.deepEqual(body.errors, ["body-too-large"]);
  assert.equal(body.execution_performed, false);
});
