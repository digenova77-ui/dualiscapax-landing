import { test } from "node:test";
import assert from "node:assert/strict";
import runtime from "../workers/iris-runtime/worker.mjs";
import memoryWorker, { IrisMemoryStore } from "../workers/iris-memory/worker.mjs";

function fakeState() {
  const values = new Map();
  let lock = Promise.resolve();
  return {
    storage: {
      get: async (key) => values.get(key),
      transaction: async (fn) => {
        let release;
        const previous = lock;
        lock = new Promise((resolve) => { release = resolve; });
        await previous;
        try {
          return await fn({
            get: async (key) => values.get(key),
            put: async (key, value) => { values.set(key, value); },
          });
        } finally { release(); }
      },
    },
    blockConcurrencyWhile: async (fn) => fn(),
  };
}

function okBinding() {
  return { fetch: async () => new Response(JSON.stringify({ ok: true, decision: "allow" }), { status: 200 }) };
}

function integratedEnv() {
  const token = "integration-memory-token";
  const store = new IrisMemoryStore(fakeState());
  const memoryEnv = {
    IRIS_MEMORY_SERVICE_TOKEN: token,
    IRIS_MEMORY_STORE: {
      idFromName: (name) => name,
      get: () => ({ fetch: (url, init) => store.fetch(new Request(url, init)) }),
    },
  };
  const memoryServiceBinding = {
    fetch: (url, init) => memoryWorker.fetch(new Request(url, init), memoryEnv),
  };
  return {
    IDENTITY_API: okBinding(),
    TRINITY_LAW: okBinding(),
    IRIS_MEMORY: memoryServiceBinding,
    MODEL_PROVIDER: okBinding(),
    TRINITY_HMAC_SECRET: "integration-signing-secret",
    IRIS_MEMORY_SERVICE_TOKEN: token,
  };
}

async function signedPost(env, path, body) {
  const payload = JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.TRINITY_HMAC_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + "." + payload));
  const signature = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return runtime.fetch(new Request("https://iris.test" + path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-timestamp": timestamp, "x-signature": signature },
    body: payload,
  }), env);
}

test("runtime authorizes, persists, looks up, verifies, and infers using durable memory service", async () => {
  const env = integratedEnv();
  const body = { request_id: "integration-1", principal: { unity_id: "unity-integration" }, action: "iris.turn.look", text: "hello" };
  const auth = await signedPost(env, "/v1/authorize", body);
  const issued = await auth.json();
  assert.equal(auth.status, 200);
  assert.equal(issued.authorized, true);
  assert.equal(issued.receipt.unity_id, "unity-integration");

  const verify = await runtime.fetch(new Request("https://iris.test/v1/receipt/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ receipt: issued.receipt, text: "hello" }),
  }), env);
  assert.equal((await verify.json()).valid, true);

  const infer = await runtime.fetch(new Request("https://iris.test/v1/infer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ receipt: issued.receipt, text: "hello" }),
  }), env);
  assert.equal(infer.status, 200);
  assert.equal((await infer.json()).ok, true);
});

test("runtime denies when durable memory service authentication is misconfigured", async () => {
  const env = integratedEnv();
  env.IRIS_MEMORY_SERVICE_TOKEN = "wrong-token";
  const body = { request_id: "integration-deny-1", principal: { unity_id: "unity-integration" }, text: "hello" };
  const res = await signedPost(env, "/v1/authorize", body);
  const data = await res.json();
  assert.equal(res.status, 503);
  assert.equal(data.authorized, false);
});
