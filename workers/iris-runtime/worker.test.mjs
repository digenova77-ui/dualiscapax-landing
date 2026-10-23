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
      if (new URL(request.url).pathname.endsWith("/context")) return { unity_id: body.unity_id, items: [] };
      return { unity_id: body.unity_id, persisted: true, request_id: body.request_id, receipt_id: "receipt-1" };
    }),
    TRINITY_LAW: binding("trinity", async (body) => ({ decision: "allow", authorized: true, request_id: body.request_id })),
    MODEL_PROVIDER: binding("provider", async () => ({ output: "Iris response", provider: "test-provider", confidence: 0.8 })),
    ...overrides,
  };
  return { env, calls };
}
const req = (body = { text: "Hello Iris" }, extra = {}) => new Request("https://iris-runtime.test/v1/turn", {
  method: "POST",
  headers: { origin: "https://dualiscapax.ai", "content-type": "application/json", ...extra },
  body: JSON.stringify(body),
});

test("happy path verifies identity, authorizes with Trinity before memory/inference, and persists scoped memory", async () => {
  const { env, calls } = fixture();
  const res = await worker.fetch(req(), env);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.available, true);
  assert.equal(data.result, "Iris response");
  assert.deepEqual(calls.map(c => c.name), ["identity", "trinity", "memory", "provider", "memory"]);
  assert.equal(calls[2].body.unity_id, "unity_user_123");
  assert.equal(calls[3].body.unity_id, "unity_user_123");
  assert.equal(calls[4].body.unity_id, "unity_user_123");
  assert.equal(calls[1].body.action, "iris.inference");
  assert.equal(calls[1].body.memory_requested, true);
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
  const badOrigin = new Request("https://iris-runtime.test/v1/turn", { method: "POST", headers: { origin: "https://evil.invalid", "content-type": "application/json" }, body: JSON.stringify({ text: "hello there" }) });
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
