/**
 * Next ten fail-closed items on the memory-authoritative Worker.
 *
 * 1. Non-JSON content type is 415
 * 2. Bad request_id is 400
 * 3. Unknown action is 400
 * 4. Depth with empty text is 400
 * 5. Allow receipt carries issued_at
 * 6. Expired receipt cannot infer
 * 7. Revoked receipt cannot infer
 * 8. Metrics expose allow and model counts
 * 9. Authorize does not call the model
 * 10. Revoke is recorded
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../workers/iris-runtime/worker.mjs";
import { memoryBinding } from "./fixtures/iris-memory-binding.mjs";

function identityBinding() {
  return { fetch: async (_url, init) => {
    const body = JSON.parse(init.body || "{}");
    const unityId = body.principal && body.principal.unity_id;
    return new Response(JSON.stringify({ ok: true, verified: true, unity_id: unityId }), { status: 200 });
  } };
}
function trinityBinding() {
  return { fetch: async (_url, init) => {
    const body = JSON.parse(init.body || "{}");
    return new Response(JSON.stringify({ ok: true, authorized: true, decision: "allow", request_id: body.request_id, principal: { unity_id: body.principal }, action: body.action, input_sha256: body.input_sha256 }), { status: 200 });
  } };
}
function envWith(model) {
  return {
    IDENTITY_API: identityBinding(),
    TRINITY_LAW: trinityBinding(),
    IRIS_MEMORY: memoryBinding(),
    MODEL_PROVIDER: model || { fetch: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }) },
    TRINITY_HMAC_SECRET: "test-secret",
    IRIS_MEMORY_SERVICE_TOKEN: "test-memory-token",
  };
}
async function sign(body, secret = "test-secret") {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + "." + JSON.stringify(body)));
  return { "x-timestamp": timestamp, "x-signature": Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("") };
}
async function post(path, body, env, headers = {}) {
  const signed = await sign(body, env.TRINITY_HMAC_SECRET);
  return worker.fetch(new Request("https://staging.test" + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...signed, ...headers },
    body: JSON.stringify(body),
  }), env);
}
const base = { principal: { unity_id: "test-unity" } };

test("1. non-JSON content type is 415", async () => {
  const res = await worker.fetch(new Request("https://staging.test/v1/authorize", {
    method: "POST", headers: { "content-type": "text/plain" }, body: "nope",
  }), envWith());
  assert.equal(res.status, 415);
});

test("2. bad request_id is 400", async () => {
  const env = envWith();
  const res = await post("/v1/authorize", { ...base, request_id: "bad id", text: "a" }, env);
  assert.equal((await res.json()).reason, "bad-request-id");
});

test("3. unknown action is 400", async () => {
  const env = envWith();
  const res = await post("/v1/authorize", { ...base, request_id: "act-40", text: "a", action: "iris.turn.hack" }, env);
  assert.equal((await res.json()).reason, "unknown-action");
});

test("4. depth with empty text is 400", async () => {
  const env = envWith();
  const res = await post("/v1/authorize", { ...base, request_id: "empty-40", text: "  ", action: "iris.turn.depth" }, env);
  assert.equal((await res.json()).reason, "text-required");
});

test("5. allow receipt carries issued_at", async () => {
  const env = envWith();
  const res = await post("/v1/authorize", { ...base, request_id: "at-40", text: "hello" }, env);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.receipt.issued_at);
});

test("6. expired receipt cannot infer", async () => {
  const env = envWith();
  env.IRIS_RECEIPT_TTL_MS = -1;
  const issued = await post("/v1/authorize", { ...base, request_id: "exp-40", text: "hello" }, env);
  const auth = await issued.json();
  const res = await post("/v1/infer", { text: "hello", receipt: auth.receipt }, env);
  assert.equal((await res.json()).reason, "receipt-expired");
});

test("7. revoked receipt cannot infer", async () => {
  const env = envWith();
  const issued = await post("/v1/authorize", { ...base, request_id: "rev-40", text: "hello" }, env);
  const auth = await issued.json();
  const revoked = await post("/v1/receipt/revoke", { id: auth.receipt.id }, env);
  assert.equal(revoked.status, 200);
  const res = await post("/v1/infer", { text: "hello", receipt: auth.receipt }, env);
  assert.equal((await res.json()).reason, "receipt-revoked");
});

test("8. metrics expose allow and model counts", async () => {
  const env = envWith();
  await post("/v1/authorize", { ...base, request_id: "met-40", text: "hello" }, env);
  const res = await worker.fetch(new Request("https://staging.test/v1/metrics"), env);
  const data = await res.json();
  assert.ok(data.allow >= 1);
  assert.equal(typeof data.model, "number");
});

test("9. authorize does not call the model", async () => {
  let calls = 0;
  const env = envWith({ fetch: async () => { calls += 1; return new Response(JSON.stringify({ ok: true }), { status: 200 }); } });
  const res = await post("/v1/authorize", { ...base, request_id: "nomodel-40", text: "hello" }, env);
  assert.equal(res.status, 200);
  assert.equal(calls, 0);
});

test("10. revoke is recorded in metrics", async () => {
  const env = envWith();
  const issued = await post("/v1/authorize", { ...base, request_id: "rec-40", text: "hello" }, env);
  const auth = await issued.json();
  await post("/v1/receipt/revoke", { id: auth.receipt.id }, env);
  const metrics = await (await worker.fetch(new Request("https://staging.test/v1/metrics"), env)).json();
  assert.ok(metrics.revoke >= 1);
});

test("11. unsigned receipt revocation is rejected", async () => {
  const env = envWith();
  const issued = await post("/v1/authorize", { ...base, request_id: "unsigned-revoke-40", text: "hello" }, env);
  const auth = await issued.json();
  const res = await worker.fetch(new Request("https://staging.test/v1/receipt/revoke", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: auth.receipt.id }),
  }), env);
  assert.equal(res.status, 401);
  assert.equal((await res.json()).reason, "signature-required");

  const verify = await post("/v1/receipt/verify", { receipt: auth.receipt, text: "hello" }, env);
  assert.equal((await verify.json()).valid, true);
});

test("12. receipt revocation rejects an invalid HMAC signature", async () => {
  const env = envWith();
  const issued = await post("/v1/authorize", { ...base, request_id: "bad-sign-revoke-40", text: "hello" }, env);
  const auth = await issued.json();
  const res = await worker.fetch(new Request("https://staging.test/v1/receipt/revoke", {
    method: "POST",
    headers: { "content-type": "application/json", "x-timestamp": String(Math.floor(Date.now() / 1000)), "x-signature": "0".repeat(64) },
    body: JSON.stringify({ id: auth.receipt.id }),
  }), env);
  assert.equal(res.status, 401);
  assert.equal((await res.json()).reason, "invalid-signature");

  const verify = await post("/v1/receipt/verify", { receipt: auth.receipt, text: "hello" }, env);
  assert.equal((await verify.json()).valid, true);
});

test("13. direct receipt lookup rejects expired receipts", async () => {
  const env = envWith();
  env.IRIS_RECEIPT_TTL_MS = -1;
  const issued = await post("/v1/authorize", { ...base, request_id: "get-expired-40", text: "hello" }, env);
  const auth = await issued.json();
  const res = await worker.fetch(new Request("https://staging.test/v1/receipt/" + auth.receipt.id, { method: "GET" }), env);
  assert.equal(res.status, 410);
  assert.equal((await res.json()).reason, "receipt-expired");
});

test("14. inference rejects receipts missing issued_at or action", async () => {
  const env = envWith();
  const issued = await post("/v1/authorize", { ...base, request_id: "incomplete-receipt-40", text: "hello" }, env);
  const auth = await issued.json();
  const { issued_at, action, ...incomplete } = auth.receipt;
  const res = await post("/v1/infer", { receipt: incomplete, text: "hello" }, env);
  assert.equal(res.status, 403);
  assert.equal((await res.json()).reason, "receipt-required");
});

