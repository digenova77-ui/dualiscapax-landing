import { test } from "node:test";
import assert from "node:assert/strict";
import memoryWorker, { IrisMemoryStore } from "../workers/iris-memory/worker.mjs";

function makeHarness() {
  const values = new Map();
  let queue = Promise.resolve();
  const state = {
    blockConcurrencyWhile: async (fn) => fn(),
    storage: {
      get: async (k) => values.get(k),
      transaction: async (fn) => {
        let release;
        const prior = queue;
        queue = new Promise((resolve) => { release = resolve; });
        await prior;
        try {
          return await fn({
            get: async (k) => values.get(k),
            put: async (k, v) => { values.set(k, v); },
          });
        } finally { release(); }
      },
    },
  };
  const store = new IrisMemoryStore(state);
  const token = "test-token";
  const env = {
    IRIS_MEMORY_SERVICE_TOKEN: token,
    IRIS_MEMORY_STORE: {
      idFromName: (name) => name,
      get: () => ({ fetch: (url, init) => store.fetch(new Request(url, init)) }),
    },
  };
  const call = (path, body, auth = token) => memoryWorker.fetch(new Request("https://memory.test" + path, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + auth },
    body: JSON.stringify(body),
  }), env);
  return { call };
}
const principal = "unity-test";
const digest = "a".repeat(64);
const args = (request_id, p = principal, d = digest) => ({ request_id, principal: p, input_sha256: d });

async function claim(call, request_id) {
  const receipt = {
    contract: "dualis.receipt.v1", request_id, unity_id: principal,
    id: "rct_" + request_id, sha256: digest, action: "iris.turn.look",
    issued_at: new Date().toISOString(),
  };
  const res = await call("/v1/requests/claim", {
    request_id, principal, action: receipt.action, input_sha256: digest, receipt,
  });
  assert.equal(res.status, 200);
}

test("memory service rejects requests without its service token", async () => {
  const { call } = makeHarness();
  assert.equal((await call("/v1/inference/begin", args("auth"), "wrong")).status, 401);
});

test("concurrent begin calls yield exactly one durable claim", async () => {
  const { call } = makeHarness();
  await claim(call, "race");
  const responses = await Promise.all([
    call("/v1/inference/begin", args("race")),
    call("/v1/inference/begin", args("race")),
  ]);
  const bodies = await Promise.all(responses.map((r) => r.json()));
  assert.equal(bodies.filter((x) => x.claimed === true).length, 1);
  assert.equal(bodies.filter((x) => x.state === "RUNNING").length, 2);
});

test("inference claim rejects principal and digest mismatches", async () => {
  const { call } = makeHarness();
  await claim(call, "mismatch");
  assert.equal((await call("/v1/inference/begin", args("mismatch", "other-unity"))).status, 403);
  assert.equal((await call("/v1/inference/begin", args("mismatch", principal, "b".repeat(64)))).status, 403);
  assert.equal((await call("/v1/inference/begin", args("mismatch"))).status, 200);
});

test("revocation blocks an inference claim", async () => {
  const { call } = makeHarness();
  await claim(call, "revoked");
  assert.equal((await call("/v1/requests/revoke", { request_id: "revoked" })).status, 200);
  assert.equal((await call("/v1/inference/begin", args("revoked"))).status, 403);
});

test("UNKNOWN state is terminal and cannot be retried", async () => {
  const { call } = makeHarness();
  await claim(call, "unknown");
  assert.equal((await call("/v1/inference/begin", args("unknown"))).status, 200);
  const marked = await call("/v1/inference/unknown", args("unknown"));
  assert.equal((await marked.json()).state, "UNKNOWN");
  const retry = await call("/v1/inference/begin", args("unknown"));
  assert.equal(retry.status, 409);
  assert.equal((await retry.json()).state, "UNKNOWN");
});

test("completion persists one result and ignores conflicting replay output", async () => {
  const { call } = makeHarness();
  await claim(call, "complete");
  await call("/v1/inference/begin", args("complete"));
  const original = { answer: "stored" };
  assert.equal((await call("/v1/inference/complete", { ...args("complete"), output: original })).status, 200);
  const replay = await call("/v1/inference/complete", { ...args("complete"), output: { answer: "different" } });
  assert.deepEqual((await replay.json()).output, original);
  const begin = await call("/v1/inference/begin", args("complete"));
  assert.deepEqual((await begin.json()).output, original);
});
