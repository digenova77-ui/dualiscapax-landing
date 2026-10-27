import test from "node:test";
import assert from "node:assert/strict";
import irisRuntime from "./worker.mjs";

function post(path, body = "{}", contentType = "application/json") {
  return new Request("https://iris-runtime-staging.example.workers.dev" + path, {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
}

test("authorize fails closed when required bindings are absent", async () => {
  const response = await irisRuntime.fetch(post("/v1/authorize"), {});
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.authorized, false);
  assert.equal(body.reason, "bindings-unavailable");
  assert.ok(body.missing.includes("TRINITY_LAW"));
  assert.ok(body.missing.includes("IRIS_MEMORY"));
});

test("authorize rejects non-JSON content before any binding call", async () => {
  let calls = 0;
  const binding = { fetch: async () => { calls += 1; return Response.json({}); } };
  const env = {
    IDENTITY_API: binding,
    TRINITY_LAW: binding,
    IRIS_MEMORY: binding,
    MODEL_PROVIDER: binding,
    IRIS_MEMORY_SERVICE_TOKEN: "test-only",
    TRINITY_HMAC_SECRET: "test-only",
  };
  const response = await irisRuntime.fetch(post("/v1/authorize", "{}", "text/plain"), env);
  assert.equal(response.status, 415);
  assert.equal((await response.json()).reason, "unsupported-media-type");
  assert.equal(calls, 0);
});

test("authorize rejects malformed JSON without calling identity, Trinity, memory, or model", async () => {
  let calls = 0;
  const binding = { fetch: async () => { calls += 1; return Response.json({ ok: true }); } };
  const env = {
    IDENTITY_API: binding,
    TRINITY_LAW: binding,
    IRIS_MEMORY: binding,
    MODEL_PROVIDER: binding,
    IRIS_MEMORY_SERVICE_TOKEN: "test-only",
    TRINITY_HMAC_SECRET: "test-only",
  };
  const response = await irisRuntime.fetch(post("/v1/authorize", "{"), env);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).reason, "invalid-json");
  assert.equal(calls, 0);
});

test("inference rejects requests without a governed receipt", async () => {
  let calls = 0;
  const binding = { fetch: async () => { calls += 1; return Response.json({ ok: true }); } };
  const env = {
    IDENTITY_API: binding,
    TRINITY_LAW: binding,
    IRIS_MEMORY: binding,
    MODEL_PROVIDER: binding,
    IRIS_MEMORY_SERVICE_TOKEN: "test-only",
    TRINITY_HMAC_SECRET: "test-only",
  };
  const response = await irisRuntime.fetch(post("/v1/infer", JSON.stringify({ prompt: "must not run" })), env);
  assert.equal(response.status, 403);
  assert.equal((await response.json()).reason, "receipt-required");
  assert.equal(calls, 0);
});

test("authorize rejects missing request IDs before signature or dependency work", async () => {
  let calls = 0;
  const binding = { fetch: async () => { calls += 1; return Response.json({ ok: true }); } };
  const env = {
    IDENTITY_API: binding, TRINITY_LAW: binding, IRIS_MEMORY: binding, MODEL_PROVIDER: binding,
    IRIS_MEMORY_SERVICE_TOKEN: "test-only", TRINITY_HMAC_SECRET: "test-only",
  };
  const response = await irisRuntime.fetch(post("/v1/authorize", JSON.stringify({ unity_id: "u1" })), env);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).reason, "missing-request-id");
  assert.equal(calls, 0);
});

test("authorize rejects oversized bodies before dependency work", async () => {
  let calls = 0;
  const binding = { fetch: async () => { calls += 1; return Response.json({ ok: true }); } };
  const env = {
    IDENTITY_API: binding, TRINITY_LAW: binding, IRIS_MEMORY: binding, MODEL_PROVIDER: binding,
    IRIS_MEMORY_SERVICE_TOKEN: "test-only", TRINITY_HMAC_SECRET: "test-only",
  };
  const response = await irisRuntime.fetch(post("/v1/authorize", JSON.stringify({ request_id: "large", text: "x".repeat(70000) })), env);
  assert.equal(response.status, 413);
  assert.equal((await response.json()).reason, "body-too-large");
  assert.equal(calls, 0);
});

test("authorize rejects missing request signatures before dependency work", async () => {
  let calls = 0;
  const binding = { fetch: async () => { calls += 1; return Response.json({ ok: true }); } };
  const env = {
    IDENTITY_API: binding, TRINITY_LAW: binding, IRIS_MEMORY: binding, MODEL_PROVIDER: binding,
    IRIS_MEMORY_SERVICE_TOKEN: "test-only", TRINITY_HMAC_SECRET: "test-only",
  };
  const response = await irisRuntime.fetch(post("/v1/authorize", JSON.stringify({ request_id: "sig-test", unity_id: "u1" })), env);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).reason, "signature-required");
  assert.equal(calls, 0);
});

test("authorize rejects stale timestamps before dependency work", async () => {
  let calls = 0;
  const binding = { fetch: async () => { calls += 1; return Response.json({ ok: true }); } };
  const env = {
    IDENTITY_API: binding, TRINITY_LAW: binding, IRIS_MEMORY: binding, MODEL_PROVIDER: binding,
    IRIS_MEMORY_SERVICE_TOKEN: "test-only", TRINITY_HMAC_SECRET: "test-only",
  };
  const stale = String(Math.floor(Date.now() / 1000) - 3600);
  const response = await irisRuntime.fetch(new Request("https://iris-runtime-staging.example.workers.dev/v1/authorize", {
    method: "POST", headers: { "content-type": "application/json", "x-timestamp": stale, "x-signature": "invalid" },
    body: JSON.stringify({ request_id: "stale", unity_id: "u1" }),
  }), env);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).reason, "timestamp-skew");
  assert.equal(calls, 0);
});
