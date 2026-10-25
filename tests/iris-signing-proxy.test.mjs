import { test } from "node:test";
import assert from "node:assert/strict";
import proxy from "../workers/iris-runtime/signing-proxy.mjs";

const SECRET = "proxy-test-secret";

function makeRequest(body, overrides = {}) {
  return new Request("https://dualiscapax.com/api/iris/v1/authorize", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://dualiscapax.com",
      "x-iris-session-token": "signed-session-token",
      ...overrides,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function envWith({ sessionData = { authenticated: true, unity_id: "unity:verified-42" }, runtimeResponse = { authorized: true, receipt: { contract: "dualis.receipt.v1" } } } = {}) {
  const calls = { session: 0, runtime: 0, forwarded: null, signatureValid: false };
  const env = {
    TRINITY_HMAC_SECRET: SECRET,
    IRIS_SESSION_VERIFIER: {
      fetch: async (url, init) => {
        calls.session += 1;
        assert.equal(url, "https://iris-session/api/session/verify");
        assert.deepEqual(JSON.parse(init.body), { session_token: "signed-session-token" });
        return new Response(JSON.stringify(sessionData), {
          status: sessionData.authenticated ? 200 : 401,
          headers: { "content-type": "application/json" },
        });
      },
    },
    IRIS_RUNTIME: {
      fetch: async (url, init) => {
        calls.runtime += 1;
        assert.equal(url, "https://iris-runtime/v1/authorize");
        const body = JSON.parse(init.body);
        calls.forwarded = body;
        const timestamp = init.headers["x-timestamp"];
        const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + "." + JSON.stringify(body)));
        const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
        calls.signatureValid = expected === init.headers["x-signature"];
        return new Response(JSON.stringify(runtimeResponse), {
          status: 200,
          headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
        });
      },
    },
  };
  return { env, calls };
}

test("proxy derives principal, digest and HMAC from trusted server-side inputs", async () => {
  const { env, calls } = envWith();
  const text = "hello governed runtime";
  const response = await proxy.fetch(makeRequest({
    request_id: "proxy-1",
    action: "iris.turn.look",
    text,
    principal: { unity_id: "attacker-controlled-id" },
    input_sha256: "0".repeat(64),
    force_deny: false,
  }), env);
  // The browser's supplied digest is inconsistent, so it is rejected before runtime.
  assert.equal(response.status, 400);
  assert.equal((await response.json()).reason, "input-digest-mismatch");
  assert.equal(calls.runtime, 0);
});

test("proxy overwrites browser identity and signs the canonical server body", async () => {
  const { env, calls } = envWith();
  const text = "hello governed runtime";
  const digestBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const digest = Array.from(new Uint8Array(digestBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const response = await proxy.fetch(makeRequest({
    request_id: "proxy-2",
    action: "iris.turn.look",
    text,
    principal: { unity_id: "attacker-controlled-id" },
    input_sha256: digest,
    force_deny: true,
    arbitrary_admin: true,
    compute_lane: "ADMIN",
    memory_requested: true,
  }), env);
  assert.equal(response.status, 200);
  assert.equal(calls.runtime, 1);
  assert.equal(calls.signatureValid, true);
  assert.equal(calls.forwarded.principal.unity_id, "unity:verified-42");
  assert.equal(calls.forwarded.input_sha256, digest);
  assert.equal(calls.forwarded.force_deny, undefined);
  assert.equal(calls.forwarded.arbitrary_admin, undefined);
  assert.equal(calls.forwarded.compute_lane, "LOOK");
  assert.equal(calls.forwarded.memory_requested, false);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("proxy rejects cross-origin requests before session verification", async () => {
  const { env, calls } = envWith();
  const response = await proxy.fetch(makeRequest({ request_id: "proxy-3", action: "iris.turn.look", text: "x" }, { origin: "https://attacker.example" }), env);
  assert.equal(response.status, 403);
  assert.equal(calls.session, 0);
  assert.equal(calls.runtime, 0);
});

test("proxy rejects requests without an authenticated browser session", async () => {
  const { env, calls } = envWith();
  const response = await proxy.fetch(makeRequest({ request_id: "proxy-4", action: "iris.turn.look", text: "x" }, { "x-iris-session-token": "" }), env);
  assert.equal(response.status, 401);
  assert.equal(calls.session, 0);
  assert.equal(calls.runtime, 0);
});

test("proxy denies an unverified session and never reaches runtime", async () => {
  const { env, calls } = envWith({ sessionData: { authenticated: false } });
  const response = await proxy.fetch(makeRequest({ request_id: "proxy-5", action: "iris.turn.look", text: "x" }), env);
  assert.equal(response.status, 401);
  assert.equal(calls.runtime, 0);
});

test("proxy fails closed when session or runtime bindings are missing", async () => {
  const request = makeRequest({ request_id: "proxy-6", action: "iris.turn.look", text: "x" });
  const noSession = await proxy.fetch(request, { TRINITY_HMAC_SECRET: SECRET, IRIS_RUNTIME: { fetch: async () => new Response("{}") } });
  assert.equal(noSession.status, 503);
  const noRuntime = await proxy.fetch(makeRequest({ request_id: "proxy-7", action: "iris.turn.look", text: "x" }), {
    TRINITY_HMAC_SECRET: SECRET,
    IRIS_SESSION_VERIFIER: { fetch: async () => new Response(JSON.stringify({ authenticated: true, unity_id: "unity:verified-42" })) },
  });
  assert.equal(noRuntime.status, 503);
});

test("proxy rejects oversized requests before session verification", async () => {
  const { env, calls } = envWith();
  const response = await proxy.fetch(makeRequest({ request_id: "proxy-8", action: "iris.turn.look", text: "x".repeat(70000) }), env);
  assert.equal(response.status, 413);
  assert.equal(calls.session, 0);
  assert.equal(calls.runtime, 0);
});
