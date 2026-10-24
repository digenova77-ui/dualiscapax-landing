/**
 * The next ten fail-closed behaviors on the staging Worker.
 *
 * 1. Duplicate request_id is 409
 * 2. Concurrent in-flight claim is 409
 * 3. Inert binding fails closed
 * 4. Binding timeout is denial
 * 5. Identity denial blocks inference
 * 6. Law denial blocks inference
 * 7. /v1/infer requires a known receipt
 * 8. Bad HMAC signature is 401
 * 9. OPTIONS is allowed
 * 10. GET /v1/receipt/:id returns an issued receipt
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../workers/iris-runtime/worker.mjs";
import { memoryBinding } from "./fixtures/iris-memory-binding.mjs";

function identityBinding() {
  return {
    fetch: async (_url, init) => {
      const body = JSON.parse(init.body || "{}");
      const unityId = body.principal && body.principal.unity_id;
      return new Response(JSON.stringify({ ok: true, verified: !!unityId, unity_id: unityId }), { status: 200, headers: { "content-type": "application/json" } });
    },
  };
}

function trinityBinding() {
  return {
    fetch: async (_url, init) => {
      const body = JSON.parse(init.body || "{}");
      return new Response(JSON.stringify({ ok: true, authorized: true, decision: "allow", request_id: body.request_id, principal: { unity_id: body.principal }, action: body.action, input_sha256: body.input_sha256 }), { status: 200, headers: { "content-type": "application/json" } });
    },
  };
}

function allowBinding() {
  return {
    fetch: async () => new Response(JSON.stringify({ ok: true, decision: "allow" }), { status: 200 }),
  };
}
function denyBinding() {
  return {
    fetch: async () => new Response(JSON.stringify({ ok: false, decision: "deny" }), { status: 200 }),
  };
}
function slowBinding() {
  return { fetch: () => new Promise(() => {}) };
}
const ENV = {
  IDENTITY_API: identityBinding(),
  TRINITY_LAW: trinityBinding(),
  IRIS_MEMORY: memoryBinding(),
  MODEL_PROVIDER: allowBinding(),
  TRINITY_HMAC_SECRET: "test-secret",
  IRIS_MEMORY_SERVICE_TOKEN: "test-memory-token",
};

async function testSignature(body, secret = "test-secret") {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = timestamp + "." + JSON.stringify(body);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return { "x-timestamp": timestamp, "x-signature": Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("") };
}
async function post(path, body, env = ENV, headers = {}) {
  if (body && typeof body === "object" && !Array.isArray(body)) body = { ...body, principal: body.principal || { unity_id: body.unity_id || "test-unity" } };
  let authHeaders = {};
  if (!("x-timestamp" in headers) && !("x-signature" in headers)) authHeaders = await testSignature(body, env.TRINITY_HMAC_SECRET || "test-secret");
  return worker.fetch(new Request("https://staging.test" + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders, ...headers },
    body: JSON.stringify(body),
  }), env);
}

test("1. same-body duplicate replays; different body is 409", async () => {
  const first = await post("/v1/authorize", { request_id: "dup-10", text: "a" });
  assert.equal(first.status, 200);
  const replay = await post("/v1/authorize", { request_id: "dup-10", text: "a" });
  const replayData = await replay.json();
  assert.equal(replay.status, 200);
  assert.equal(replayData.replay, true);
  const second = await post("/v1/authorize", { request_id: "dup-10", text: "b" });
  const data = await second.json();
  assert.equal(second.status, 409);
  assert.equal(data.reason, "duplicate-request");
});

test("2. concurrent in-flight claim is 409", async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const env = {
    ...ENV,
    IDENTITY_API: { fetch: () => gate.then(() => new Response(JSON.stringify({ ok: true }), { status: 200 })) },
  };
  const first = post("/v1/authorize", { request_id: "race-10", text: "a" }, env);
  await new Promise((r) => setTimeout(r, 10));
  const second = await post("/v1/authorize", { request_id: "race-10", text: "a" }, env);
  const data = await second.json();
  assert.equal(second.status, 409);
  assert.equal(data.reason, "concurrent-claim");
  release();
  const done = await first;
  assert.equal(done.status, 200);
});

test("3. inert binding fails closed", async () => {
  const env = { ...ENV, TRINITY_LAW: {} };
  const res = await post("/v1/authorize", { request_id: "inert-10", text: "a" }, env);
  const data = await res.json();
  assert.equal(res.status, 503);
  assert.equal(data.reason, "binding-inert");
});

test("4. binding timeout is denial", async () => {
  const env = { ...ENV, TRINITY_LAW: slowBinding(), IRIS_BINDING_TIMEOUT_MS: 30 };
  const res = await post("/v1/authorize", { request_id: "slow-10", text: "a" }, env);
  const data = await res.json();
  assert.equal(res.status, 403);
  assert.equal(data.reason, "timeout");
});

test("5. identity denial does not issue a receipt", async () => {
  const env = { ...ENV, IDENTITY_API: denyBinding() };
  const res = await post("/v1/authorize", { request_id: "id-10", text: "a" }, env);
  const data = await res.json();
  assert.equal(data.authorized, false);
  assert.equal(data.receipt, undefined);
});

test("6. law denial does not issue a receipt", async () => {
  const env = { ...ENV, TRINITY_LAW: denyBinding() };
  const res = await post("/v1/authorize", { request_id: "law-10", text: "a" }, env);
  const data = await res.json();
  assert.equal(data.authorized, false);
  assert.equal(data.reason, "law-denied");
});

test("7. infer requires a known receipt", async () => {
  const denied = await post("/v1/infer", { text: "a", receipt: { contract: "dualis.receipt.v1", id: "rct_nope", sha256: "b".repeat(64), request_id: "nope" } });
  assert.equal(denied.status, 403);
  const issued = await post("/v1/authorize", { request_id: "inf-10", text: "hello" });
  const auth = await issued.json();
  const allowed = await post("/v1/infer", { text: "hello", receipt: auth.receipt });
  const data = await allowed.json();
  assert.equal(allowed.status, 200);
  assert.equal(data.ok, true);
});

test("8. bad HMAC signature is 401", async () => {
  const res = await post("/v1/authorize", { request_id: "sig-10", text: "a" }, ENV, {
    "x-timestamp": String(Math.floor(Date.now() / 1000)),
    "x-signature": "deadbeef",
  });
  const data = await res.json();
  assert.equal(res.status, 401);
  assert.equal(data.reason, "invalid-signature");
});

test("9. OPTIONS is allowed", async () => {
  const res = await worker.fetch(new Request("https://staging.test/v1/authorize", { method: "OPTIONS" }), ENV);
  assert.equal(res.status, 204);
});

test("10. GET receipt returns an issued receipt", async () => {
  const issued = await post("/v1/authorize", { request_id: "get-10", text: "hello" });
  const auth = await issued.json();
  const res = await worker.fetch(new Request("https://staging.test/v1/receipt/" + auth.receipt.id), ENV);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.found, true);
  assert.equal(data.receipt.id, "rct_get-10");
});
