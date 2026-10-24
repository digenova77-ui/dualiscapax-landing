import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.mjs";

const ORIGIN = "https://dualiscapax.ai";
const env = { IRIS_ALLOWED_ORIGINS: ORIGIN };
const request = (path, body, origin = ORIGIN) => new Request("https://iris-runtime.test" + path, {
  method: "POST",
  headers: { origin, "content-type": "application/json" },
  body: JSON.stringify(body)
});
const plan = () => ({
  request_id: "request-prepare-123",
  unity_id: "unity_user_123",
  action: "compute.evaluate",
  module: "dclm.v1",
  policy_version: "trinity.v1",
  input: "6 * 7",
  complexity: { class: "unknown", features: { input_items: 1 }, estimate_basis: "Not calibrated; complexity is unknown." },
  resource_budget: { cpu_ms: 1000, memory_bytes: 1048576 },
  verification: { class: "deterministic-check", acceptance_criterion: "Exact arithmetic result equals 42." }
});

test("prepare creates a SHA-256-bound envelope but does not authorize or execute", async () => {
  const response = await worker.fetch(request("/v1/work/prepare", plan()), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.valid, true);
  assert.equal(body.envelope.contract, "dualis.work.v1");
  assert.match(body.envelope.input_sha256, /^[a-f0-9]{64}$/);
  assert.equal(body.identity_verified, false);
  assert.equal(body.authorization_performed, false);
  assert.equal(body.execution_performed, false);
  assert.equal(body.metering_performed, false);
  assert.equal(body.settlement_performed, false);
});

test("prepare rejects malformed plans and never returns an envelope", async () => {
  const invalid = plan();
  delete invalid.policy_version;
  const response = await worker.fetch(request("/v1/work/prepare", invalid), env);
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.valid, false);
  assert.equal(body.envelope, undefined);
  assert.deepEqual(body.errors, ["invalid-prepare-input"]);
});

test("prepare rejects unknown fields rather than silently ignoring them", async () => {
  const response = await worker.fetch(request("/v1/work/prepare", { ...plan(), execute_now: true }), env);
  assert.equal(response.status, 400);
});

test("prepare rejects unapproved browser origins", async () => {
  const response = await worker.fetch(request("/v1/work/prepare", plan(), "https://untrusted.example"), env);
  assert.equal(response.status, 403);
});
