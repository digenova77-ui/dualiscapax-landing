import { test } from "node:test";
import assert from "node:assert/strict";
import { UnityIdentityStore } from "../worker.mjs";

class Storage {
  constructor() { this.data = new Map(); }
  async get(key) { return this.data.get(key); }
  async put(key, value) { this.data.set(key, structuredClone(value)); }
  async delete(key) { return this.data.delete(key); }
  async transaction(fn) {
    const tx = {
      get: async key => this.data.get(key),
      put: async (key, value) => this.data.set(key, structuredClone(value)),
      delete: async key => this.data.delete(key),
    };
    return fn(tx);
  }
}
function fixture() {
  const storage = new Storage();
  return { worker: new UnityIdentityStore({ storage }), storage };
}
async function post(worker, path, body) {
  return worker.fetch(new Request("https://identity-store" + path, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  }));
}

test("challenge is single-use and ceremony-bound", async () => {
  const { worker } = fixture();
  const put = await post(worker, "/challenge/put", { challenge: "challenge-A", kind: "registration", expires_at: Date.now() + 30_000 });
  assert.equal(put.status, 200);
  assert.equal((await post(worker, "/challenge/consume", { challenge: "challenge-A", kind: "authentication" })).status, 403);
  assert.equal((await post(worker, "/challenge/consume", { challenge: "challenge-A", kind: "registration" })).status, 200);
  assert.equal((await post(worker, "/challenge/consume", { challenge: "challenge-A", kind: "registration" })).status, 403);
});

test("expired challenges are rejected", async () => {
  const { worker } = fixture();
  await post(worker, "/challenge/put", { challenge: "old", kind: "authentication", expires_at: Date.now() - 1 });
  assert.equal((await post(worker, "/challenge/consume", { challenge: "old", kind: "authentication" })).status, 403);
});

test("credential IDs and account handles are unique", async () => {
  const { worker } = fixture();
  const credential = { id: "credential-1", public_key: [1, 2, 3], counter: 0, transports: ["internal"] };
  assert.equal((await post(worker, "/credential/create", { handle: "alice", unity_id: "unity_A", credential })).status, 200);
  assert.equal((await post(worker, "/credential/create", { handle: "alice", unity_id: "unity_B", credential: { ...credential, id: "credential-2" } })).status, 409);
  assert.equal((await post(worker, "/credential/create", { handle: "bob", unity_id: "unity_B", credential })).status, 409);
});

test("authenticator counters only advance monotonically", async () => {
  const { worker } = fixture();
  const credential = { id: "counter-key", public_key: [1], counter: 2, transports: [] };
  await post(worker, "/credential/create", { handle: "counter-user", unity_id: "unity_counter", credential });
  assert.equal((await post(worker, "/credential/counter", { id: "counter-key", counter: 3 })).status, 200);
  assert.equal((await post(worker, "/credential/counter", { id: "counter-key", counter: 3 })).status, 409);
  assert.equal((await post(worker, "/credential/counter", { id: "counter-key", counter: 2 })).status, 409);
});

test("sessions are hash-keyed, expire, and can be revoked", async () => {
  const { worker } = fixture();
  await post(worker, "/session/create", { token_hash: "a".repeat(64), unity_id: "unity_session", expires_at: Date.now() + 30_000 });
  const valid = await post(worker, "/session/check", { token_hash: "a".repeat(64) });
  assert.equal((await valid.json()).unity_id, "unity_session");
  assert.equal((await post(worker, "/session/check", { token_hash: "b".repeat(64) })).status, 401);
  await post(worker, "/session/revoke", { token_hash: "a".repeat(64) });
  assert.equal((await post(worker, "/session/check", { token_hash: "a".repeat(64) })).status, 401);
});
