/**
 * Direct tests for the /v1/authorize endpoint on the staging Worker.
 *
 * Imports worker.mjs and calls its fetch handler. No network. No deploy.
 * No secrets are printed.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../workers/iris-runtime/worker.mjs";

const FULL_ENV = {
  IDENTITY_API: {},
  TRINITY_LAW: {},
  IRIS_MEMORY: {},
  MODEL_PROVIDER: {},
  TRINITY_HMAC_SECRET: "test-secret",
};

function post(body, env = FULL_ENV) {
  return worker.fetch(new Request("https://staging.test/v1/authorize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }), env);
}

test("authorize returns 503 when a required binding is missing", async () => {
  const env = { ...FULL_ENV };
  delete env.TRINITY_LAW;
  const res = await post({ request_id: "r1", text: "hi" }, env);
  const data = await res.json();
  assert.equal(res.status, 503);
  assert.equal(data.authorized, false);
  assert.equal(data.reason, "bindings-unavailable");
  assert.ok(data.missing.includes("TRINITY_LAW"));
});

test("authorize returns 400 on invalid JSON", async () => {
  const res = await post("{not-json");
  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.authorized, false);
  assert.equal(data.reason, "invalid-json");
});

test("authorize returns 400 when request_id is missing", async () => {
  const res = await post({ text: "hi" });
  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.authorized, false);
  assert.equal(data.reason, "missing-request-id");
});

test("authorize returns 503 when the signing secret is missing", async () => {
  const env = { ...FULL_ENV };
  delete env.TRINITY_HMAC_SECRET;
  const res = await post({ request_id: "r1", text: "hi" }, env);
  const data = await res.json();
  assert.equal(res.status, 503);
  assert.equal(data.authorized, false);
  assert.equal(data.reason, "signing-secret-unavailable");
});

test("authorize denies force_deny and does not return a receipt", async () => {
  const res = await post({ request_id: "deny-1", force_deny: true, text: "no" });
  const data = await res.json();
  assert.equal(res.status, 403);
  assert.equal(data.authorized, false);
  assert.equal(data.reason, "policy");
  assert.equal(data.receipt, undefined);
});

test("authorize allow returns dualis.receipt.v1 with sha256 of the text", async () => {
  const res = await post({ request_id: "allow-1", text: "hello" });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.authorized, true);
  assert.equal(data.receipt.contract, "dualis.receipt.v1");
  assert.equal(data.receipt.id, "rct_allow-1");
  assert.equal(data.receipt.request_id, "allow-1");
  assert.match(data.receipt.sha256, /^[0-9a-f]{64}$/);
  const expected = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("hello")))
    .toString("hex");
  assert.equal(data.receipt.sha256, expected);
});

test("unknown path returns 404", async () => {
  const res = await worker.fetch(new Request("https://staging.test/nope"), FULL_ENV);
  assert.equal(res.status, 404);
});
