/**
 * Tests for POST /v1/receipt/verify on the staging Worker.
 *
 * The endpoint validates a dualis.receipt.v1 receipt. It does not mint,
 * store, or call a model. Missing bindings or secret fail closed.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../workers/iris-runtime/worker.mjs";

function allowBinding() {
  return {
    fetch: async () => new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  };
}
const FULL_ENV = {
  IDENTITY_API: allowBinding(),
  TRINITY_LAW: allowBinding(),
  IRIS_MEMORY: allowBinding(),
  MODEL_PROVIDER: allowBinding(),
  TRINITY_HMAC_SECRET: "test-secret",
};

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Buffer.from(buf).toString("hex");
}

function verify(body, env = FULL_ENV) {
  return worker.fetch(new Request("https://staging.test/v1/receipt/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }), env);
}

const good = {
  contract: "dualis.receipt.v1",
  id: "rct_r1",
  sha256: "a".repeat(64),
  request_id: "r1",
};

test("receipt verify fails closed when a binding is missing", async () => {
  const env = { ...FULL_ENV };
  delete env.IRIS_MEMORY;
  const res = await verify({ receipt: good }, env);
  const data = await res.json();
  assert.equal(res.status, 503);
  assert.equal(data.valid, false);
  assert.equal(data.reason, "bindings-unavailable");
});

test("receipt verify fails closed when the secret is missing", async () => {
  const env = { ...FULL_ENV };
  delete env.TRINITY_HMAC_SECRET;
  const res = await verify({ receipt: good }, env);
  const data = await res.json();
  assert.equal(res.status, 503);
  assert.equal(data.valid, false);
  assert.equal(data.reason, "signing-secret-unavailable");
});

test("receipt verify rejects a missing receipt", async () => {
  const res = await verify({});
  const data = await res.json();
  assert.equal(data.valid, false);
  assert.equal(data.reason, "bad-receipt");
});

test("receipt verify rejects a bad contract", async () => {
  const res = await verify({ receipt: { ...good, contract: "other" } });
  const data = await res.json();
  assert.equal(data.valid, false);
  assert.equal(data.reason, "bad-receipt");
});

test("receipt verify rejects a well-formed but unknown receipt", async () => {
  const res = await verify({ receipt: good });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.valid, false);
  assert.equal(data.known, false);
  assert.equal(data.reason, "receipt-unknown");
});

test("receipt verify rejects a sha256 that does not match the text", async () => {
  const res = await verify({ receipt: good, text: "hello" });
  const data = await res.json();
  assert.equal(data.valid, false);
  assert.equal(data.reason, "sha256-mismatch");
});

test("receipt verify rejects an unknown receipt even when its text hash matches", async () => {
  const text = "hello";
  const receipt = { ...good, sha256: await sha256Hex(text) };
  const res = await verify({ receipt, text });
  const data = await res.json();
  assert.equal(data.valid, false);
  assert.equal(data.reason, "receipt-unknown");
});

async function signedHeaders(body) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = timestamp + "." + JSON.stringify(body);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("test-secret"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return { "content-type": "application/json", "x-timestamp": timestamp, "x-signature": Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("") };
}

test("an authorize allow receipt verifies", async () => {
  const authBody = { request_id: "chain-1", text: "hello" };
  const auth = await worker.fetch(new Request("https://staging.test/v1/authorize", {
    method: "POST",
    headers: await signedHeaders(authBody),
    body: JSON.stringify(authBody),
  }), FULL_ENV);
  const issued = await auth.json();
  const res = await verify({ receipt: issued.receipt, text: "hello" });
  const data = await res.json();
  assert.equal(data.valid, true);
  assert.equal(data.id, "rct_chain-1");
});
