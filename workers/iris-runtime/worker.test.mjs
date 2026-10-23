import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.mjs";

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json" },
});

function fixture(overrides = {}) {
  const calls = [];
  const binding = (name, handler) => ({
    async fetch(request) {
      const body = request.method === "POST" ? await request.clone().json().catch(() => ({})) : {};
      calls.push({ name, path: new URL(request.url).pathname, body, headers: request.headers });
      return jsonResponse(await handler(body, request));
    },
  });
  const env = {
    IRIS_ALLOWED_ORIGINS: "https://dualiscapax.ai",
    IDENTITY_API: binding("identity", async () => ({ verified: true, unity_id: "unity_user_123" })),
    IRIS_MEMORY: binding("memory", async (body, request) => {
      const route = new URL(request.url).pathname;
      if (route.endsWith("/context")) return { unity_id: body.unity_id, items: [] };
      if (route.endsWith("/claim")) return { unity_id: body.unity_id, request_id: body.request_id, claimed: true };
      return { unity_id: body.unity_id, persisted: true, request_id: body.request_id, receipt_id: "receipt-1" };
    }),
    TRINITY_LAW: binding("trinity", async (body) => ({
      decision: "allow", authorized: true, request_id: body.request_id,
      action: body.action, input_sha256: body.input_sha256, principal: body.principal,
    })),
    MODEL_PROVIDER: binding("provider", async () => ({ output: "Iris response", provider: "test-provider", confidence: 0.8 })),
    ...overrides,
  };
  return { env, calls };
}
const req = (body = { text: "Hello Iris" }, extra = {}) => new Request("https://iris-runtime.test/v1/turn", {
  method: "POST",
  headers: { origin: "https://dualiscapax.ai", "content-type": "application/json", "x-request-id": "request-test-12345678", ...extra },
  body: JSON.stringify(body),
});

test("missing client request ID is rejected before service calls", async () => {
  const { env, calls } = fixture();
  const request = new Request("https://iris-runtime.test/v1/turn", {
    method: "POST",
    headers: { origin: "https://dualiscapax.ai", "content-type": "application/json" },
    body: JSON.stringify({ text: "Hello Iris" }),
  });
  const res = await worker.fetch(request, env);
  assert.equal(res.status, 400);
  assert.equal((await res.json()).reason, "valid-client-request-id-required");
  assert.equal(calls.length, 0);
});

test("happy path verifies identity, exact Trinity binding, claim ordering, and scoped persistence", async () => {
  const { env, calls } = fixture();
  const res = await worker.fetch(req(), env);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.available, true);
  assert.equal(data.result, "Iris response");
  assert.deepEqual(calls.map(c => c.name), ["identity", "trinity", "memory", "memory", "provider", "memory"]);
  assert.equal(calls[2].path.endsWith("/claim"), true);
  assert.equal(calls[3].body.unity_id, "unity_user_123");
  assert.equal(calls[4].body.unity_id, "unity_user_123");
  assert.equal(calls[5].body.unity_id, "unity_user_123");
  assert.equal(calls[1].body.action, "iris.inference");
  assert.equal(calls[1].body.memory_requested, true);
  assert.match(calls[1].body.input_sha256, /^[a-f0-9]{64}$/);
});

test("browser-supplied authorization ticket cannot bypass Trinity deny", async () => {
  const { env, calls } = fixture({
    TRINITY_LAW: { async fetch() { calls.push({ name: "trinity" }); return jsonResponse({ decision: "deny", authorized: false, request_id: "unused" }); } },
  });
  const res = await worker.fetch(req({ text: "do something", ticket: { ok: true, authorized: true } }), env);
  assert.equal(res.status, 403);
  assert.equal(calls.some(c => c.name === "provider"), false);
  assert.equal(calls.some(c => c.name === "memory"), false);
});

test("unverified identity blocks all memory, law, and provider access", async () => {
  const { env, calls } = fixture({
    IDENTITY_API: { async fetch() { calls.push({ name: "identity" }); return jsonResponse({ verified: false }); } },
  });
  const res = await worker.fetch(req(), env);
  assert.equal(res.status, 401);
  assert.deepEqual(calls.map(c => c.name), ["identity"]);
});

test("missing provider fails closed and does not claim success", async () => {
  const { env } = fixture({ MODEL_PROVIDER: undefined });
  const res = await worker.fetch(req(), env);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).stage, "inference");
});

test("wrong origin and invalid inputs are rejected before services are called", async () => {
  const { env, calls } = fixture();
  const badOrigin = new Request("https://iris-runtime.test/v1/turn", { method: "POST", headers: { origin: "https://evil.invalid", "content-type": "application/json", "x-request-id": "request-bad-origin-123" }, body: JSON.stringify({ text: "hello there" }) });
  assert.equal((await worker.fetch(badOrigin, env)).status, 403);
  assert.equal((await worker.fetch(req({ text: "" }), env)).status, 400);
  assert.equal(calls.length, 0);
});

test("health reports unavailable until every service binding and origin is configured", async () => {
  const { env } = fixture({ IRIS_MEMORY: undefined });
  const res = await worker.fetch(new Request("https://iris-runtime.test/health"), env);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).available, false);
});

test("allowed origin receives credentialed CORS headers and preflight is handled without service calls", async () => {
  const { env, calls } = fixture();
  const options = new Request("https://iris-runtime.test/v1/turn", {
    method: "OPTIONS",
    headers: { origin: "https://dualiscapax.ai", "access-control-request-method": "POST" },
  });
  const preflight = await worker.fetch(options, env);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "https://dualiscapax.ai");
  assert.equal(preflight.headers.get("access-control-allow-credentials"), "true");
  assert.equal(calls.length, 0);
  const response = await worker.fetch(req(), env);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://dualiscapax.ai");
  assert.equal(response.headers.get("vary"), "Origin");
});

test("unapproved preflight origin is rejected", async () => {
  const { env, calls } = fixture();
  const response = await worker.fetch(new Request("https://iris-runtime.test/v1/turn", {
    method: "OPTIONS", headers: { origin: "https://evil.invalid" },
  }), env);
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.equal(calls.length, 0);
});

test("duplicate request ID fails closed before memory context or provider inference", async () => {
  const { env, calls } = fixture({
    IRIS_MEMORY: {
      async fetch(request) {
        const body = await request.clone().json().catch(() => ({}));
        const route = new URL(request.url).pathname;
        calls.push({ name: "memory", path: route, body });
        if (route.endsWith("/claim")) return jsonResponse({ unity_id: body.unity_id, request_id: body.request_id, claimed: false });
        return jsonResponse({ unity_id: body.unity_id, items: [] });
      },
    },
  });
  const res = await worker.fetch(req({ text: "Hello Iris" }, { "x-request-id": "request-duplicate-123" }), env);
  assert.equal(res.status, 409);
  assert.equal((await res.json()).stage, "idempotency-claim");
  assert.equal(calls.some(c => c.name === "provider"), false);
  assert.equal(calls.some(c => c.name === "memory" && c.path.endsWith("/context")), false);
});

for (const mismatch of [
  ["principal", (body) => ({ principal: { unity_id: "unity_other_999" } })],
  ["action", (body) => ({ action: "iris.admin.override" })],
  ["input digest", (body) => ({ input_sha256: "0".repeat(64) })],
  ["request ID", (body) => ({ request_id: "request-other-123" })],
]) {
  test(`Trinity ${mismatch[0]} mismatch blocks all downstream side effects`, async () => {
    const { env, calls } = fixture({
      TRINITY_LAW: {
        async fetch(request) {
          const body = await request.clone().json();
          calls.push({ name: "trinity", body });
          return jsonResponse({
            decision: "allow", authorized: true, request_id: body.request_id,
            action: body.action, input_sha256: body.input_sha256, principal: body.principal,
            ...mismatch[1](body),
          });
        },
      },
    });
    const res = await worker.fetch(req({ text: "Hello Iris" }), env);
    assert.equal(res.status, 403);
    assert.equal((await res.json()).stage, "trinity");
    assert.deepEqual(calls.map(c => c.name), ["identity", "trinity"]);
  });
}

test("deterministic arithmetic tells Trinity it does not request private memory", async () => {
  const { env, calls } = fixture();
  const res = await worker.fetch(req({ text: "6 * 7" }), env);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.result, "42");
  assert.equal(calls.find(c => c.name === "trinity").body.memory_requested, false);
  assert.equal(calls.some(c => c.name === "memory" && c.path.endsWith("/context")), false);
  assert.equal(calls.some(c => c.name === "provider"), false);
});
