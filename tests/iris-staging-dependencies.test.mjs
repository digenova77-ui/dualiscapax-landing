import test from "node:test";
import assert from "node:assert/strict";
import worker from "../workers/iris-staging-dependencies/worker.mjs";

const UNITY = "unity-staging-test-only";
const enabled = { STAGING_FIXTURE_ENABLED: "true", STAGING_UNITY_ID: UNITY };
const request = (path, body, method = "POST") => new Request("https://fixture" + path, {
  method,
  headers: { "content-type": "application/json" },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const digest = async (text) => {
  const value = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(value), (b) => b.toString(16).padStart(2, "0")).join("");
};

test("staging dependency fixtures fail closed unless explicitly enabled and registered", async () => {
  const res = await worker.fetch(request("/check", { request_id: "r1", principal: { unity_id: UNITY } }), {
    STAGING_FIXTURE_ROLE: "identity", STAGING_UNITY_ID: UNITY,
  });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).reason, "staging-fixture-disabled");
});

test("identity fixture verifies only the configured staging Unity ID", async () => {
  const env = { ...enabled, STAGING_FIXTURE_ROLE: "identity" };
  const allowed = await worker.fetch(request("/check", { request_id: "identity-1", principal: { unity_id: UNITY } }), env);
  assert.equal(allowed.status, 200);
  assert.equal((await allowed.json()).verified, true);
  const denied = await worker.fetch(request("/check", { request_id: "identity-2", principal: { unity_id: "other" } }), env);
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).verified, false);
});

test("Trinity fixture binds exact request, principal, action, and server-recomputed digest", async () => {
  const text = "hello staging";
  const input_sha256 = await digest(text);
  const env = { ...enabled, STAGING_FIXTURE_ROLE: "trinity" };
  const allowed = await worker.fetch(request("/evaluate", {
    request_id: "trinity-1", principal: UNITY, action: "iris.turn.look", text, input_sha256,
  }), env);
  assert.equal(allowed.status, 200);
  const data = await allowed.json();
  assert.equal(data.authorized, true);
  assert.equal(data.request_id, "trinity-1");
  assert.equal(data.principal.unity_id, UNITY);
  assert.equal(data.action, "iris.turn.look");
  assert.equal(data.input_sha256, input_sha256);

  const digestMismatch = await worker.fetch(request("/evaluate", {
    request_id: "trinity-2", principal: UNITY, action: "iris.turn.look", text, input_sha256: "0".repeat(64),
  }), env);
  assert.equal(digestMismatch.status, 403);

  const unknownAction = await worker.fetch(request("/evaluate", {
    request_id: "trinity-3", principal: UNITY, action: "admin.write", text, input_sha256,
  }), env);
  assert.equal(unknownAction.status, 403);
});

test("model fixture requires a matching receipt and bounded context, and never claims real inference", async () => {
  const text = "hello model fixture";
  const sha256 = await digest(text);
  const receipt = { contract: "dualis.receipt.v1", unity_id: UNITY, request_id: "model-1", sha256, id: "rct_model-1" };
  const env = { ...enabled, STAGING_FIXTURE_ROLE: "model" };
  const res = await worker.fetch(request("/complete", { receipt, text, memory_context: [] }), env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.staging_fixture, true);
  assert.match(data.output, /no external model was called/);
  assert.equal(data.context_items_received, 0);

  const badReceipt = await worker.fetch(request("/complete", {
    receipt: { ...receipt, sha256: "f".repeat(64) }, text, memory_context: [],
  }), env);
  assert.equal(badReceipt.status, 403);
  const oversizedContext = await worker.fetch(request("/complete", {
    receipt, text, memory_context: Array.from({ length: 11 }, (_, i) => ({ request_id: String(i) })),
  }), env);
  assert.equal(oversizedContext.status, 403);
});

test("fixture health advertises its non-production status and disabled state", async () => {
  const res = await worker.fetch(request("/health", undefined, "GET"), {
    STAGING_FIXTURE_ROLE: "identity", STAGING_UNITY_ID: UNITY,
  });
  assert.equal(res.status, 503);
  const data = await res.json();
  assert.equal(data.staging_fixture, true);
  assert.equal(data.external_model_provider, false);
});
