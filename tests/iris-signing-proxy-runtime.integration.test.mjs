import { test } from "node:test";
import assert from "node:assert/strict";
import runtime from "../workers/iris-runtime/worker.mjs";
import proxy from "../workers/iris-runtime/signing-proxy.mjs";
import { memoryBinding } from "./fixtures/iris-memory-binding.mjs";

const SECRET = "proxy-runtime-integration-secret";

function identityBinding() {
  return {
    fetch: async (_url, init) => {
      const body = JSON.parse(init.body || "{}");
      const unityId = body.principal && body.principal.unity_id;
      return new Response(JSON.stringify({ ok: true, verified: !!unityId, unity_id: unityId }), { status: 200 });
    },
  };
}

function trinityBinding() {
  return {
    fetch: async (_url, init) => {
      const body = JSON.parse(init.body || "{}");
      return new Response(JSON.stringify({
        ok: true,
        authorized: true,
        decision: "allow",
        request_id: body.request_id,
        principal: { unity_id: body.principal },
        action: body.action,
        input_sha256: body.input_sha256,
      }), { status: 200 });
    },
  };
}

function runtimeEnv() {
  return {
    IDENTITY_API: identityBinding(),
    TRINITY_LAW: trinityBinding(),
    IRIS_MEMORY: memoryBinding(),
    MODEL_PROVIDER: {
      fetch: async () => new Response(JSON.stringify({ ok: true, output: "fixture-model" }), { status: 200 }),
    },
    TRINITY_HMAC_SECRET: SECRET,
    IRIS_MEMORY_SERVICE_TOKEN: "integration-memory-token",
    IRIS_DIAGNOSTICS_TOKEN: "integration-diagnostics-token",
    IRIS_ALLOWED_ORIGINS: "",
  };
}

test("same-origin signing proxy authorizes through the actual runtime and memory binding", async () => {
  const runtimeBindings = runtimeEnv();
  let verifierCalls = 0;
  const proxyBindings = {
    TRINITY_HMAC_SECRET: SECRET,
    IRIS_SESSION_VERIFIER: {
      fetch: async (url, init) => {
        verifierCalls += 1;
        assert.equal(url, "https://iris-session/api/session/verify");
        assert.deepEqual(JSON.parse(init.body), { session_token: "integration-session-token" });
        return new Response(JSON.stringify({ valid: true, unity_id: "unity:integration-user" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
    IRIS_RUNTIME: {
      fetch: (url, init) => runtime.fetch(new Request(url, init), runtimeBindings),
    },
  };

  const text = "authorize through the real runtime handler";
  const digestBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const digest = Array.from(new Uint8Array(digestBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const response = await proxy.fetch(new Request("https://dualiscapax.com/api/iris/v1/authorize", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://dualiscapax.com",
      "x-iris-session-token": "integration-session-token",
    },
    body: JSON.stringify({
      request_id: "proxy-runtime-integration-1",
      action: "iris.turn.look",
      text,
      input_sha256: digest,
      principal: { unity_id: "unity:attacker-controlled" },
      compute_lane: "ADMIN",
      memory_requested: true,
      force_deny: true,
    }),
  }), proxyBindings);

  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.authorized, true);
  assert.equal(data.receipt.unity_id, "unity:integration-user");
  assert.equal(data.receipt.action, "iris.turn.look");
  assert.equal(verifierCalls, 1);
});

test("proxy does not reach runtime when the session verifier denies", async () => {
  let runtimeCalls = 0;
  const response = await proxy.fetch(new Request("https://dualiscapax.com/api/iris/v1/authorize", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://dualiscapax.com",
      "x-iris-session-token": "invalid-session-token",
    },
    body: JSON.stringify({ request_id: "proxy-runtime-denied-1", action: "iris.turn.look", text: "no access" }),
  }), {
    TRINITY_HMAC_SECRET: SECRET,
    IRIS_SESSION_VERIFIER: {
      fetch: async () => new Response(JSON.stringify({ valid: false }), { status: 401 }),
    },
    IRIS_RUNTIME: {
      fetch: async () => { runtimeCalls += 1; return new Response("{}"); },
    },
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).reason, "session-invalid");
  assert.equal(runtimeCalls, 0);
});
