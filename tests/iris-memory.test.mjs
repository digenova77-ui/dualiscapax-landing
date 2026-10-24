import { test } from "node:test";
import assert from "node:assert/strict";
import memoryWorker, { IrisMemoryStore } from "../workers/iris-memory/worker.mjs";

function fakeState() {
  const values = new Map();
  let lock = Promise.resolve();
  const storage = {
    get: async (key) => values.get(key),
    put: async (key, value) => { values.set(key, value); },
    transaction: async (fn) => {
      let release;
      const prior = lock;
      lock = new Promise((resolve) => { release = resolve; });
      await prior;
      try {
        return await fn({
          get: async (key) => values.get(key),
          put: async (key, value) => { values.set(key, value); },
        });
      } finally { release(); }
    },
  };
  return { storage, blockConcurrencyWhile: async (fn) => fn() };
}

function harness() {
  const state = fakeState();
  const durable = new IrisMemoryStore(state);
  const env = {
    IRIS_MEMORY_SERVICE_TOKEN: "memory-test-token",
    IRIS_MEMORY_STORE: {
      idFromName: (name) => name,
      get: () => ({ fetch: (url, init) => durable.fetch(new Request(url, init)) }),
    },
  };
  async function post(path, body, token = "memory-test-token") {
    return memoryWorker.fetch(new Request("https://memory.test" + path, {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) },
      body: JSON.stringify(body),
    }), env);
  }
  return { post };
}

function claim(request_id, text, principal = "unity-1", action = "iris.turn.look") {
  const digest = requireDigest(text);
  return {
    request_id, principal, action, input_sha256: digest,
    receipt: { contract: "dualis.receipt.v1", unity_id: principal, request_id, sha256: digest, id: "rct_" + request_id },
  };
}
function requireDigest(text) {
  // Test hashes are supplied by a deterministic fixture helper below.
  return text === "alpha" ? "a".repeat(64) : text === "beta" ? "b".repeat(64) : "c".repeat(64);
}

test("memory service requires service authentication", async () => {
  const { post } = harness();
  const res = await post("/v1/requests/get", { request_id: "x" }, "");
  assert.equal(res.status, 401);
  assert.equal((await res.json()).reason, "service-auth-required");
});

test("atomic claim persists the receipt and durable lookup returns it", async () => {
  const { post } = harness();
  const input = claim("persist-1", "alpha");
  const first = await post("/v1/requests/claim", input);
  const data = await first.json();
  assert.equal(first.status, 200);
  assert.equal(data.claimed, true);
  assert.deepEqual(data.receipt, input.receipt);
  const lookup = await post("/v1/requests/get", { request_id: "persist-1" });
  const found = await lookup.json();
  assert.equal(found.found, true);
  assert.deepEqual(found.receipt, input.receipt);
});

test("same request and digest replay the original receipt", async () => {
  const { post } = harness();
  const input = claim("replay-1", "alpha");
  await post("/v1/requests/claim", input);
  const res = await post("/v1/requests/claim", input);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.replay, true);
  assert.deepEqual(data.receipt, input.receipt);
});

test("same request with a different digest conflicts", async () => {
  const { post } = harness();
  await post("/v1/requests/claim", claim("conflict-1", "alpha"));
  const res = await post("/v1/requests/claim", claim("conflict-1", "beta"));
  assert.equal(res.status, 409);
  assert.equal((await res.json()).reason, "duplicate-request");
});

test("concurrent conflicting claims produce exactly one winner", async () => {
  const { post } = harness();
  const [a, b] = await Promise.all([
    post("/v1/requests/claim", claim("race-1", "alpha")),
    post("/v1/requests/claim", claim("race-1", "beta")),
  ]);
  const statuses = [a.status, b.status].sort((x, y) => x - y);
  assert.deepEqual(statuses, [200, 409]);
});

test("claim rejects a receipt whose digest does not match", async () => {
  const { post } = harness();
  const input = claim("bad-receipt-1", "alpha");
  input.receipt.sha256 = "d".repeat(64);
  const res = await post("/v1/requests/claim", input);
  assert.equal(res.status, 400);
  assert.equal((await res.json()).reason, "invalid-claim");
});
