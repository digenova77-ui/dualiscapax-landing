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
      list: async ({ prefix = "", limit = 1000 } = {}) => new Map(Array.from(values.entries()).filter(([key]) => key.startsWith(prefix)).slice(0, limit)),
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

function identityBinding() {
  return { fetch: async (_url, init) => {
    const body = JSON.parse(init.body || "{}");
    const unityId = body.principal && body.principal.unity_id;
    return new Response(JSON.stringify({ ok: true, verified: !!unityId, unity_id: unityId }), { status: 200 });
  } };
}

function trinityBinding() {
  return { fetch: async (_url, init) => {
    const body = JSON.parse(init.body || "{}");
    return new Response(JSON.stringify({ ok: true, authorized: true, decision: "allow", request_id: body.request_id, principal: { unity_id: body.principal }, action: body.action, input_sha256: body.input_sha256 }), { status: 200 });
  } };
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
    IDENTITY_API: identityBinding(),
    TRINITY_LAW: trinityBinding(),
    IRIS_MEMORY: memoryServiceBinding,
    MODEL_PROVIDER: {
      fetch: async (_url, init) => {
        const payload = JSON.parse(init.body);
        return new Response(JSON.stringify({ ok: true, received_memory_context: Array.isArray(payload.memory_context) }), { status: 200 });
      },
    },
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
  assert.ok(Array.isArray(issued.memory_context));

  const verify = await runtime.fetch(new Request("https://iris.test/v1/receipt/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ receipt: issued.receipt, text: "hello" }),
  }), env);
  assert.equal((await verify.json()).valid, true);

  const nextBody = { request_id: "integration-2", principal: { unity_id: "unity-integration" }, action: "iris.turn.look", text: "next" };
  const nextAuth = await signedPost(env, "/v1/authorize", nextBody);
  const nextIssued = await nextAuth.json();
  assert.equal(nextAuth.status, 200);
  assert.ok(nextIssued.memory_context.some((item) => item.request_id === "integration-1"));

  const infer = await runtime.fetch(new Request("https://iris.test/v1/infer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ receipt: nextIssued.receipt, text: "next" }),
  }), env);
  assert.equal(infer.status, 200);
  const inferData = await infer.json();
  assert.equal(inferData.ok, true);
  assert.equal(inferData.output.received_memory_context, true);
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


test("Trinity denial occurs before durable claim and leaves no receipt", async () => {
  const env = integratedEnv();
  env.TRINITY_LAW = {
    fetch: async (_url, init) => {
      const body = JSON.parse(init.body || "{}");
      return new Response(JSON.stringify({
        ok: true,
        authorized: false,
        decision: "deny",
        request_id: body.request_id,
        principal: { unity_id: body.principal },
        action: body.action,
        input_sha256: body.input_sha256,
      }), { status: 200 });
    },
  };
  let providerCalls = 0;
  env.MODEL_PROVIDER = {
    fetch: async () => {
      providerCalls += 1;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  };

  const body = { request_id: "integration-trinity-deny", principal: { unity_id: "unity-integration" }, action: "iris.turn.look", text: "must not persist" };
  const denied = await signedPost(env, "/v1/authorize", body);
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).authorized, false);
  assert.equal(providerCalls, 0);

  const lookup = await env.IRIS_MEMORY.fetch("https://memory.test/v1/requests/get", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + env.IRIS_MEMORY_SERVICE_TOKEN },
    body: JSON.stringify({ request_id: "integration-trinity-deny" }),
  });
  assert.equal(lookup.status, 200);
  assert.equal((await lookup.json()).found, false);
});

test("identity mismatch blocks Trinity evaluation and durable claim", async () => {
  const env = integratedEnv();
  let trinityCalls = 0;
  env.IDENTITY_API = {
    fetch: async () => new Response(JSON.stringify({ ok: true, verified: true, unity_id: "different-unity" }), { status: 200 }),
  };
  env.TRINITY_LAW = {
    fetch: async () => {
      trinityCalls += 1;
      return new Response(JSON.stringify({ ok: true, authorized: true, decision: "allow" }), { status: 200 });
    },
  };

  const body = { request_id: "integration-identity-mismatch", principal: { unity_id: "unity-integration" }, action: "iris.turn.look", text: "must not persist" };
  const denied = await signedPost(env, "/v1/authorize", body);
  assert.equal(denied.status, 403);
  assert.equal(trinityCalls, 0);

  const lookup = await env.IRIS_MEMORY.fetch("https://memory.test/v1/requests/get", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + env.IRIS_MEMORY_SERVICE_TOKEN },
    body: JSON.stringify({ request_id: "integration-identity-mismatch" }),
  });
  assert.equal((await lookup.json()).found, false);
});

test("ambiguous claim timeout recovers through durable idempotent replay", async () => {
  const env = integratedEnv();
  env.IRIS_BINDING_TIMEOUT_MS = 5;
  const underlying = env.IRIS_MEMORY;
  let claimCalls = 0;
  env.IRIS_MEMORY = {
    fetch: async (url, init) => {
      if (new URL(url).pathname === "/v1/requests/claim" && claimCalls++ === 0) {
        // Simulate a Durable Object commit whose response is lost/late.
        const committed = await underlying.fetch(url, init);
        assert.equal(committed.status, 200);
        await new Promise((resolve) => setTimeout(resolve, 30));
        return committed;
      }
      return underlying.fetch(url, init);
    },
  };

  const body = {
    request_id: "integration-ambiguous-claim",
    principal: { unity_id: "unity-integration" },
    action: "iris.turn.look",
    text: "recover me",
  };

  const first = await signedPost(env, "/v1/authorize", body);
  const firstData = await first.json();
  assert.equal(first.status, 503);
  assert.equal(firstData.authorized, false);

  // The first call timed out at the runtime boundary, but the durable claim
  // committed. Retrying the identical signed request must return that receipt.
  const retry = await signedPost(env, "/v1/authorize", body);
  const retryData = await retry.json();
  assert.equal(retry.status, 200);
  assert.equal(retryData.authorized, true);
  assert.equal(retryData.replay, true);
  assert.equal(retryData.receipt.id, "rct_integration-ambiguous-claim");

  const lookup = await underlying.fetch("https://memory.test/v1/requests/get", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + env.IRIS_MEMORY_SERVICE_TOKEN,
    },
    body: JSON.stringify({ request_id: body.request_id }),
  });
  const stored = await lookup.json();
  assert.equal(stored.found, true);
  assert.equal(stored.receipt.id, retryData.receipt.id);
});

test("context-read outage after claim is recoverable by an exact retry", async () => {
  const env = integratedEnv();
  const underlying = env.IRIS_MEMORY;
  let failContextOnce = true;
  env.IRIS_MEMORY = {
    fetch: async (url, init) => {
      if (new URL(url).pathname === "/v1/context/read" && failContextOnce) {
        failContextOnce = false;
        return new Response(JSON.stringify({ ok: false, reason: "temporary-context-outage" }), { status: 503 });
      }
      return underlying.fetch(url, init);
    },
  };
  const body = {
    request_id: "integration-context-recovery",
    principal: { unity_id: "unity-integration" },
    action: "iris.turn.look",
    text: "retry after context outage",
  };

  const first = await signedPost(env, "/v1/authorize", body);
  const firstData = await first.json();
  assert.equal(first.status, 503);
  assert.equal(firstData.authorized, false);

  // Claim is durable even though context retrieval failed. Exact retry must
  // reuse the stored receipt and finish once the dependency recovers.
  const retry = await signedPost(env, "/v1/authorize", body);
  const retryData = await retry.json();
  assert.equal(retry.status, 200);
  assert.equal(retryData.authorized, true);
  assert.equal(retryData.replay, true);
  assert.equal(retryData.receipt.id, "rct_integration-context-recovery");
});

test("Trinity dependency timeout fails closed without creating a durable claim", async () => {
  const env = integratedEnv();
  env.IRIS_BINDING_TIMEOUT_MS = 5;
  env.TRINITY_LAW = {
    fetch: async () => new Promise((resolve) => setTimeout(() => resolve(
      new Response(JSON.stringify({ ok: true, authorized: true, decision: "allow" }), { status: 200 })
    ), 30)),
  };
  const body = {
    request_id: "integration-trinity-timeout",
    principal: { unity_id: "unity-integration" },
    action: "iris.turn.look",
    text: "must not be claimed",
  };
  const response = await signedPost(env, "/v1/authorize", body);
  const data = await response.json();
  assert.equal(response.status, 403);
  assert.equal(data.authorized, false);

  const lookup = await env.IRIS_MEMORY.fetch("https://memory.test/v1/requests/get", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + env.IRIS_MEMORY_SERVICE_TOKEN,
    },
    body: JSON.stringify({ request_id: body.request_id }),
  });
  assert.equal((await lookup.json()).found, false);
});

test("real memory Worker revocation blocks both inference and receipt verification", async () => {
  const env = integratedEnv();
  const body = {
    request_id: "integration-durable-revoke",
    principal: { unity_id: "unity-integration" },
    action: "iris.turn.look",
    text: "revoke me",
  };
  const auth = await signedPost(env, "/v1/authorize", body);
  const issued = await auth.json();
  assert.equal(auth.status, 200);

  const revoke = await signedPost(env, "/v1/receipt/revoke", { id: issued.receipt.id });
  assert.equal(revoke.status, 200);

  const replay = await signedPost(env, "/v1/authorize", body);
  assert.equal(replay.status, 403);
  assert.equal((await replay.json()).reason, "receipt-revoked");

  const infer = await runtime.fetch(new Request("https://iris.test/v1/infer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ receipt: issued.receipt, text: "revoke me" }),
  }), env);
  assert.equal(infer.status, 403);
  assert.equal((await infer.json()).reason, "receipt-revoked");

  const verify = await runtime.fetch(new Request("https://iris.test/v1/receipt/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ receipt: issued.receipt, text: "revoke me" }),
  }), env);
  assert.equal(verify.status, 200);
  const verifyData = await verify.json();
  assert.equal(verifyData.valid, false);
  assert.equal(verifyData.reason, "receipt-revoked");
});

