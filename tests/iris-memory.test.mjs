import { test } from "node:test";
import assert from "node:assert/strict";
import memoryWorker, { IrisMemoryStore } from "../workers/iris-memory/worker.mjs";

function fakeState() {
  const values = new Map();
  let lock = Promise.resolve();
  const storage = {
    get: async (key) => values.get(key),
    put: async (key, value) => { values.set(key, value); },
    list: async ({ prefix = "", limit = 1000 } = {}) => new Map(Array.from(values.entries()).filter(([key]) => key.startsWith(prefix)).slice(0, limit)),
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
    receipt: { contract: "dualis.receipt.v1", unity_id: principal, request_id, sha256: digest, id: "rct_" + request_id, action, issued_at: new Date().toISOString() },
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

test("context read returns bounded prior activity for the same principal", async () => {
  const { post } = harness();
  await post("/v1/requests/claim", claim("ctx-prior", "alpha"));
  const res = await post("/v1/context/read", { request_id: "ctx-current", principal: "unity-1", limit: 5 });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.count, 1);
  assert.equal(data.items[0].request_id, "ctx-prior");
  assert.equal(data.items[0].receipt_id, "rct_ctx-prior");
  assert.equal(data.items[0].text, undefined);
});

test("claim rejects a receipt whose digest does not match", async () => {
  const { post } = harness();
  const input = claim("bad-receipt-1", "alpha");
  input.receipt.sha256 = "d".repeat(64);
  const res = await post("/v1/requests/claim", input);
  assert.equal(res.status, 400);
  assert.equal((await res.json()).reason, "invalid-claim");
});


test("context reads never cross Unity-principal boundaries", async () => {
  const { post } = harness();
  await post("/v1/requests/claim", claim("private-a", "alpha", "unity-a"));
  await post("/v1/requests/claim", claim("private-b", "beta", "unity-b"));

  const a = await post("/v1/context/read", { request_id: "current-a", principal: "unity-a", limit: 10 });
  const aData = await a.json();
  assert.equal(a.status, 200);
  assert.deepEqual(aData.items.map((item) => item.request_id), ["private-a"]);
  assert.equal(JSON.stringify(aData).includes("private-b"), false);

  const b = await post("/v1/context/read", { request_id: "current-b", principal: "unity-b", limit: 10 });
  const bData = await b.json();
  assert.equal(b.status, 200);
  assert.deepEqual(bData.items.map((item) => item.request_id), ["private-b"]);
  assert.equal(JSON.stringify(bData).includes("private-a"), false);
});

test("request IDs cannot be replayed across principals or actions", async () => {
  const { post } = harness();
  const first = await post("/v1/requests/claim", claim("global-id-1", "alpha", "unity-a", "iris.turn.look"));
  assert.equal(first.status, 200);

  const otherPrincipal = await post("/v1/requests/claim", claim("global-id-1", "alpha", "unity-b", "iris.turn.look"));
  assert.equal(otherPrincipal.status, 409);

  const otherAction = await post("/v1/requests/claim", claim("global-id-1", "alpha", "unity-a", "admin.write"));
  assert.equal(otherAction.status, 409);

  const lookup = await post("/v1/requests/get", { request_id: "global-id-1" });
  const data = await lookup.json();
  assert.equal(data.principal, "unity-a");
  assert.equal(data.action, "iris.turn.look");
});

test("context read clamps requested history to ten metadata records", async () => {
  const { post } = harness();
  for (let i = 0; i < 12; i += 1) {
    await post("/v1/requests/claim", claim("bounded-" + i, "alpha", "unity-bounded"));
  }
  const res = await post("/v1/context/read", { request_id: "current-bounded", principal: "unity-bounded", limit: 999 });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.count, 10);
  assert.equal(data.items.length, 10);
  assert.equal(data.items.every((item) => !Object.hasOwn(item, "text")), true);
});

test("durable revoke persists atomically and is idempotent", async () => {
  const { post } = harness();
  const input = claim("revoke-memory-1", "alpha");
  const claimed = await post("/v1/requests/claim", input);
  assert.equal(claimed.status, 200);

  const first = await post("/v1/requests/revoke", { id: input.receipt.id });
  const firstData = await first.json();
  assert.equal(first.status, 200);
  assert.equal(firstData.revoked, true);
  assert.equal(firstData.id, input.receipt.id);

  const second = await post("/v1/requests/revoke", { request_id: input.request_id });
  const secondData = await second.json();
  assert.equal(second.status, 200);
  assert.equal(secondData.revoked, true);
  assert.equal(secondData.replay, true);

  const lookup = await post("/v1/requests/get", { request_id: input.request_id });
  const stored = await lookup.json();
  assert.equal(stored.found, true);
  assert.equal(stored.revoked, true);
  assert.deepEqual(stored.receipt, input.receipt);
});

test("durable revoke refuses unknown receipts", async () => {
  const { post } = harness();
  const res = await post("/v1/requests/revoke", { id: "rct-does-not-exist" });
  assert.equal(res.status, 404);
  assert.equal((await res.json()).reason, "not-issued");
});

