/**
 * The next ten fail-closed items.
 *
 * 1. Same-body replay returns the original receipt
 * 2. Different-body replay is 409
 * 3. HMAC timestamp skew is 401
 * 4. Oversized body is 413
 * 5. Rate limit is 429
 * 6. Stored receipt mismatch fails verify
 * 7. Infer rejects a receipt whose sha256 does not match the text
 * 8. Health is not ok when a binding is inert
 * 9. Audit records an allow
 * 10. Learning step fails closed without a receipt
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import worker from "../workers/iris-runtime/worker.mjs";
import { memoryBinding } from "./fixtures/iris-memory-binding.mjs";

function allowBinding() {
  return { fetch: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }) };
}
const ENV = {
  IDENTITY_API: allowBinding(),
  TRINITY_LAW: allowBinding(),
  IRIS_MEMORY: memoryBinding(),
  MODEL_PROVIDER: allowBinding(),
  TRINITY_HMAC_SECRET: "test-secret",
};

async function testSignature(body, secret = "test-secret") {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = timestamp + "." + JSON.stringify(body);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return { "x-timestamp": timestamp, "x-signature": Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("") };
}
async function post(path, body, env = ENV, headers = {}) {
  let authHeaders = {};
  if (!("x-timestamp" in headers) && !("x-signature" in headers)) authHeaders = await testSignature(body, env.TRINITY_HMAC_SECRET || "test-secret");
  return worker.fetch(new Request("https://staging.test" + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders, ...headers },
    body: JSON.stringify(body),
  }), env);
}

test("1. same-body replay returns the original receipt", async () => {
  const first = await post("/v1/authorize", { request_id: "replay-20", text: "same" });
  const a = await first.json();
  const second = await post("/v1/authorize", { request_id: "replay-20", text: "same" });
  const b = await second.json();
  assert.equal(second.status, 200);
  assert.equal(b.replay, true);
  assert.equal(b.receipt.id, a.receipt.id);
});

test("2. different-body replay is 409", async () => {
  await post("/v1/authorize", { request_id: "diff-20", text: "one" });
  const second = await post("/v1/authorize", { request_id: "diff-20", text: "two" });
  const data = await second.json();
  assert.equal(second.status, 409);
  assert.equal(data.reason, "duplicate-request");
});

test("3. HMAC timestamp skew is 401", async () => {
  const res = await post("/v1/authorize", { request_id: "skew-20", text: "a" }, ENV, {
    "x-timestamp": "1",
    "x-signature": "ab",
  });
  const data = await res.json();
  assert.equal(res.status, 401);
  assert.equal(data.reason, "timestamp-skew");
});

test("4. oversized body is 413", async () => {
  const res = await post("/v1/authorize", { request_id: "big-20", text: "x".repeat(70000) });
  const data = await res.json();
  assert.equal(res.status, 413);
  assert.equal(data.reason, "body-too-large");
});

test("5. rate limit is 429", async () => {
  let limited = null;
  for (let i = 0; i < 40; i++) {
    const res = await post("/v1/authorize", { request_id: "rate-20-" + i, text: "a", unity_id: "rate-user" });
    if (res.status === 429) { limited = await res.json(); break; }
  }
  assert.ok(limited);
  assert.equal(limited.reason, "rate-limited");
});

test("6. stored receipt mismatch fails verify", async () => {
  const issued = await post("/v1/authorize", { request_id: "mis-20", text: "hello" });
  const auth = await issued.json();
  const bad = { ...auth.receipt, sha256: "c".repeat(64) };
  const res = await post("/v1/receipt/verify", { receipt: bad });
  const data = await res.json();
  assert.equal(data.valid, false);
  assert.equal(data.reason, "stored-mismatch");
});

test("7. infer rejects a sha256 that does not match the text", async () => {
  const issued = await post("/v1/authorize", { request_id: "inf-20", text: "hello" });
  const auth = await issued.json();
  const res = await post("/v1/infer", { text: "different", receipt: auth.receipt });
  const data = await res.json();
  assert.equal(res.status, 403);
  assert.equal(data.reason, "sha256-mismatch");
});

test("8. health is not ok when a binding is inert", async () => {
  const env = { ...ENV, MODEL_PROVIDER: {} };
  const res = await worker.fetch(new Request("https://staging.test/health"), env);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.ok(data.inert.includes("MODEL_PROVIDER"));
});

test("9. audit records an allow", async () => {
  await post("/v1/authorize", { request_id: "aud-20", text: "hello" });
  const res = await worker.fetch(new Request("https://staging.test/v1/audit"), ENV);
  const data = await res.json();
  assert.ok(data.entries.some((e) => e.request_id === "aud-20" && e.decision === "allow"));
});

test("10. learning step fails closed without a receipt", () => {
  const source = fs.readFileSync(new URL("../js/iris-learn.js", import.meta.url), "utf8");
  const context = { window: {}, globalThis: {} };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(source, context, { filename: "js/iris-learn.js" });
  const denied = context.IrisLearn.step("train", null);
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, "receipt-required");
  const allowed = context.IrisLearn.step("train", {
    contract: "dualis.receipt.v1",
    id: "rct_learn",
    sha256: "d".repeat(64),
    request_id: "learn",
  });
  assert.equal(allowed.ok, true);
  assert.equal(allowed.lane, "LEARN");
});
