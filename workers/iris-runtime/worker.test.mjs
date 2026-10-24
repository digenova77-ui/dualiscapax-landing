import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import worker, { canonicalJson as runtimeCanonicalJson } from "./worker.mjs";
import { AMOUNT, PAY_TO, encodeHeader, requirementOf } from "../../js/x402-exchange.js";

function compareUnicodeScalars(a, b) {
  const left = Array.from(a, (character) => character.codePointAt(0));
  const right = Array.from(b, (character) => character.codePointAt(0));
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return left.length - right.length;
}
const sha256Text = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const canonicalJson = (value) => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("non-canonical-number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  const keys = Object.keys(value).sort(compareUnicodeScalars);
  return "{" + keys.map((key) => JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
};
test("runtime canonical JSON orders object keys by Unicode scalar value", () => {
  const value = { ["\u{10000}"]: 1, ["\uE000"]: 2 };
  const expected = "{" + JSON.stringify("\uE000") + ":2," + JSON.stringify("\u{10000}") + ":1}";
  assert.equal(runtimeCanonicalJson(value), expected);
  assert.equal(canonicalJson(value), expected);
});

const durableReceipt = (body, output, receiptId) => {
  const envelope = {
    contract: "dualis.receipt.v1",
    unity_id: body.unity_id,
    request_id: body.request_id,
    action: body.action,
    input_sha256: body.input_sha256,
    result_sha256: sha256Text(output),
    receipt_id: receiptId,
  };
  return { receipt_id: receiptId, receipt: envelope, receipt_sha256: sha256Text(canonicalJson(envelope)) };
};
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
    X402_AMOUNT: AMOUNT,
    X402_PAY_TO: PAY_TO,
    X402_ENABLE_MAINNET: "true",
    IDENTITY_API: binding("identity", async () => ({ verified: true, unity_id: "unity_user_123" })),
    IRIS_MEMORY: binding("memory", async (body, request) => {
      const route = new URL(request.url).pathname;
      if (route.endsWith("/context")) return { unity_id: body.unity_id, items: [] };
      if (route.endsWith("/claim")) return { contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "RESERVED", claimed: true };
      return { contract: body.contract, unity_id: body.unity_id, persisted: true, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, result_sha256: sha256Text(body.output), ...durableReceipt(body, body.output, "receipt-1") };
    }),
    TRINITY_LAW: binding("trinity", async (body) => ({
      decision: "allow", authorized: true, request_id: body.request_id,
      action: body.action, input_sha256: body.input_sha256, principal: body.principal,
    })),
    X402_LEDGER_TOKEN: "test-ledger-token-with-at-least-thirty-two-characters",
    X402_LEDGER: binding("paymentLedger", async (body, request) => {
      const path = new URL(request.url).pathname;
      if (path.endsWith("/claim")) return {
        contract: body.contract, unity_id: body.unity_id, request_id: body.request_id,
        action: body.action, input_sha256: body.input_sha256,
        payment_sha256: body.payment_sha256, state: "RESERVED", claimed: true,
        claim_token: "test-claim-token-1234567890",
      };
      if (path.endsWith("/attempting")) return {
        contract: body.contract, unity_id: body.unity_id, request_id: body.request_id,
        payment_sha256: body.payment_sha256, state: "PAYMENT_ATTEMPTED",
      };
      if (path.endsWith("/record")) return {
        contract: body.contract, unity_id: body.unity_id, request_id: body.request_id,
        action: body.action, input_sha256: body.input_sha256,
        payment_sha256: body.payment_sha256, state: "SETTLED",
        payment_receipt: body.payment_receipt,
      };
      if (path.endsWith("/complete")) return {
        contract: body.contract, unity_id: body.unity_id, request_id: body.request_id,
        payment_sha256: body.payment_sha256, state: "EXECUTED",
      };
      if (path.endsWith("/release")) return {
        contract: body.contract, request_id: body.request_id, state: "RELEASED",
      };
      if (path.endsWith("/in-doubt")) return {
        contract: body.contract, request_id: body.request_id, state: "IN_DOUBT",
      };
      return { state: "UNKNOWN" };
    }),
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
  assert.equal(calls[2].body.contract, "dualis.idempotency.v1");
  assert.equal(calls[2].body.input_sha256, calls[1].body.input_sha256,
    "the durable claim must bind the same digest Trinity authorized");
});

test("extra client-controlled fields are rejected before identity or Trinity", async () => {
  const { env, calls } = fixture();
  const res = await worker.fetch(req({ text: "do something", ticket: { ok: true, authorized: true } }), env);
  assert.equal(res.status, 400);
  assert.equal((await res.json()).reason, "invalid-input");
  assert.equal(calls.length, 0);
});

test("browser-supplied authorization ticket cannot bypass Trinity deny", async () => {
  const { env, calls } = fixture({
    TRINITY_LAW: { async fetch() { calls.push({ name: "trinity" }); return jsonResponse({ decision: "deny", authorized: false, request_id: "unused" }); } },
  });
  const res = await worker.fetch(req({ text: "do something" }), env);
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

test("missing required service bindings fail before any service side effect", async () => {
  const missingBindings = [
    ["IDENTITY_API", "identity"],
    ["TRINITY_LAW", "trinity"],
    ["IRIS_MEMORY", "idempotency-claim"],
    ["MODEL_PROVIDER", "inference"],
  ];
  for (const [binding, stage] of missingBindings) {
    const { env, calls } = fixture({ [binding]: undefined });
    const res = await worker.fetch(req(), env);
    assert.equal(res.status, 503, binding);
    assert.equal((await res.json()).stage, stage, binding);
    assert.deepEqual(calls, [], `${binding} absence must be detected before any service call`);
  }
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

test("same request ID with changed input is rejected before a second effect", async () => {
  const calls = [];
  const claims = new Map();
  const base = fixture({
    IRIS_MEMORY: {
      async fetch(request) {
        const body = await request.clone().json().catch(() => ({}));
        const path = new URL(request.url).pathname;
        calls.push({ name: "memory", path, body });
        if (path.endsWith("/claim")) {
          const key = body.unity_id + ":" + body.request_id;
          const prior = claims.get(key);
          if (prior) {
            // Model the required durable-store behavior: the operation key is
            // already bound, so a changed semantic request cannot be claimed.
            return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "CONFLICT", claimed: false });
          }
          claims.set(key, { action: body.action, input_sha256: body.input_sha256 });
          return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "RESERVED", claimed: true });
        }
        if (path.endsWith("/context")) return jsonResponse({ unity_id: body.unity_id, items: [] });
        return jsonResponse({ contract: body.contract, unity_id: body.unity_id, persisted: true, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, result_sha256: sha256Text(body.output), ...durableReceipt(body, body.output, "receipt-1") });
      },
    },
    MODEL_PROVIDER: {
      async fetch(request) {
        calls.push({ name: "provider", body: await request.clone().json() });
        return jsonResponse({ output: "Iris response", provider: "test-provider" });
      },
    },
  });
  const requestId = "request-same-id-123456";
  const first = await worker.fetch(req({ text: "first request" }, { "x-request-id": requestId }), base.env);
  assert.equal(first.status, 200);
  const second = await worker.fetch(req({ text: "different request" }, { "x-request-id": requestId }), base.env);
  assert.equal(second.status, 409);
  assert.equal((await second.json()).reason, "operation-content-conflict");
  assert.equal(calls.filter(c => c.name === "provider").length, 1);
  assert.equal(calls.filter(c => c.name === "memory" && c.path.endsWith("/append")).length, 1);
  const claimBodies = calls.filter(c => c.name === "memory" && c.path.endsWith("/claim")).map(c => c.body);
  assert.notEqual(claimBodies[0].input_sha256, claimBodies[1].input_sha256);
});

test("same request ID and same input replay the original committed result without a second effect", async () => {
  const calls = [];
  const records = new Map();
  const env = fixture({
    IRIS_MEMORY: {
      async fetch(request) {
        const body = await request.clone().json().catch(() => ({}));
        const path = new URL(request.url).pathname;
        calls.push({ path, body });
        if (path.endsWith("/claim")) {
          const key = body.unity_id + ":" + body.request_id;
          const prior = records.get(key);
          if (prior?.state === "APPLIED") {
            if (prior.input_sha256 !== body.input_sha256) {
              return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "CONFLICT", claimed: false });
            }
            return jsonResponse({
              contract: body.contract, unity_id: body.unity_id, request_id: body.request_id,
              action: body.action, input_sha256: body.input_sha256, state: "APPLIED", claimed: false,
              replay: prior.replay,
            });
          }
          records.set(key, { state: "RESERVED", input_sha256: body.input_sha256 });
          return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "RESERVED", claimed: true });
        }
        if (path.endsWith("/context")) return jsonResponse({ unity_id: body.unity_id, items: [] });
        const key = body.unity_id + ":" + body.request_id;
        const replay = {
          contract: body.contract, unity_id: body.unity_id, request_id: body.request_id,
          input_sha256: body.input_sha256, action: body.action, authorization: "trinity-allow",
          result: body.output, result_sha256: sha256Text(body.output), provider: body.provenance.provider,
          ...durableReceipt(body, body.output, "receipt-original"),
        };
        records.set(key, { ...records.get(key), state: "APPLIED", replay });
        return jsonResponse({ contract: body.contract, unity_id: body.unity_id, persisted: true, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, result_sha256: sha256Text(body.output), receipt_id: replay.receipt_id, receipt: replay.receipt, receipt_sha256: replay.receipt_sha256 });
      },
    },
    MODEL_PROVIDER: {
      async fetch(request) {
        calls.push({ path: "/provider", body: await request.clone().json() });
        return jsonResponse({ output: "Original answer", provider: "test-provider", confidence: 0.8 });
      },
    },
  }).env;
  const requestId = "request-replay-same-1234";
  const first = await worker.fetch(req({ text: "same input" }, { "x-request-id": requestId }), env);
  const firstBody = await first.json();
  assert.equal(first.status, 200);
  assert.equal(firstBody.result, "Original answer");
  const second = await worker.fetch(req({ text: "same input" }, { "x-request-id": requestId }), env);
  const secondBody = await second.json();
  assert.equal(second.status, 200);
  assert.equal(secondBody.replayed, true);
  assert.equal(secondBody.result, firstBody.result);
  assert.equal(secondBody.memory.receipt, firstBody.memory.receipt);
  assert.equal(calls.filter(c => c.path === "/provider").length, 1);
  assert.equal(calls.filter(c => c.path.endsWith("/append")).length, 1);
});

test("concurrent duplicate requests cannot both reserve or execute", async () => {
  const calls = [];
  const records = new Map();
  const env = fixture({
    IRIS_MEMORY: {
      async fetch(request) {
        const body = await request.clone().json().catch(() => ({}));
        const path = new URL(request.url).pathname;
        calls.push({ path, body });
        if (path.endsWith("/claim")) {
          const key = body.unity_id + ":" + body.request_id;
          const prior = records.get(key);
          if (prior) {
            const state = prior.input_sha256 !== body.input_sha256 ? "CONFLICT" : "IN_DOUBT";
            return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state, claimed: false });
          }
          records.set(key, { state: "RESERVED", input_sha256: body.input_sha256 });
          return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "RESERVED", claimed: true });
        }
        if (path.endsWith("/context")) return jsonResponse({ unity_id: body.unity_id, items: [] });
        return jsonResponse({ contract: body.contract, unity_id: body.unity_id, persisted: true, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, result_sha256: sha256Text(body.output), ...durableReceipt(body, body.output, "receipt-race") });
      },
    },
    MODEL_PROVIDER: {
      async fetch(request) {
        calls.push({ path: "/provider", body: await request.clone().json() });
        await new Promise(resolve => setTimeout(resolve, 20));
        return jsonResponse({ output: "One winner", provider: "test-provider" });
      },
    },
  }).env;
  const requestId = "request-concurrent-12345";
  const [a, b] = await Promise.all([
    worker.fetch(req({ text: "same operation" }, { "x-request-id": requestId }), env),
    worker.fetch(req({ text: "same operation" }, { "x-request-id": requestId }), env),
  ]);
  const statuses = [a.status, b.status].sort((x, y) => x - y);
  assert.deepEqual(statuses, [200, 503]);
  assert.equal(calls.filter(c => c.path === "/provider").length, 1);
  assert.equal(calls.filter(c => c.path.endsWith("/append")).length, 1);
});

test("duplicate request ID fails closed before memory context or provider inference", async () => {
  const { env, calls } = fixture({
    IRIS_MEMORY: {
      async fetch(request) {
        const body = await request.clone().json().catch(() => ({}));
        const route = new URL(request.url).pathname;
        calls.push({ name: "memory", path: route, body });
        if (route.endsWith("/claim")) return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "CONFLICT", claimed: false });
        return jsonResponse({ unity_id: body.unity_id, items: [] });
      },
    },
  });
  const res = await worker.fetch(req({ text: "Hello Iris" }, { "x-request-id": "request-duplicate-123" }), env);
  assert.equal(res.status, 409);
  assert.equal((await res.json()).reason, "operation-content-conflict");
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

test("deterministic arithmetic works without a model-provider binding and tells Trinity it does not request private memory", async () => {
  const { env, calls } = fixture({ MODEL_PROVIDER: undefined });
  const res = await worker.fetch(req({ text: "6 * 7" }), env);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.result, "42");
  assert.equal(calls.find(c => c.name === "trinity").body.memory_requested, false);
  assert.equal(calls.some(c => c.name === "memory" && c.path.endsWith("/context")), false);
  assert.equal(calls.some(c => c.name === "provider"), false);
});


test("malformed JSON and oversized body fail before identity access", async () => {
  const { env, calls } = fixture();
  const malformed = new Request("https://iris-runtime.test/v1/turn", {
    method: "POST", headers: { origin: "https://dualiscapax.ai", "content-type": "application/json", "x-request-id": "request-malformed-123" }, body: "{bad",
  });
  assert.equal((await worker.fetch(malformed, env)).status, 400);
  const huge = new Request("https://iris-runtime.test/v1/turn", {
    method: "POST", headers: { origin: "https://dualiscapax.ai", "content-type": "application/json", "x-request-id": "request-huge-12345678" }, body: JSON.stringify({ text: "x".repeat(17000) }),
  });
  assert.equal((await worker.fetch(huge, env)).status, 413);
  assert.equal(calls.length, 0);
});

test("Trinity service outage fails closed before claim, memory, or provider", async () => {
  const { env, calls } = fixture({ TRINITY_LAW: { async fetch() { calls.push({ name: "trinity" }); throw new Error("upstream failure"); } } });
  const res = await worker.fetch(req(), env);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).stage, "trinity");
  assert.deepEqual(calls.map(c => c.name), ["identity", "trinity"]);
});

test("memory context response for another Unity ID fails before provider", async () => {
  const { env, calls } = fixture({
    IRIS_MEMORY: {
      async fetch(request) {
        const body = await request.clone().json();
        const route = new URL(request.url).pathname;
        calls.push({ name: "memory", path: route, body });
        if (route.endsWith("/claim")) return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "RESERVED", claimed: true });
        if (route.endsWith("/context")) return jsonResponse({ unity_id: "unity_someone_else", items: [{ text: "private" }] });
        return jsonResponse({ unity_id: body.unity_id, persisted: true, request_id: body.request_id });
      },
    },
  });
  const res = await worker.fetch(req(), env);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).stage, "memory-read");
  assert.equal(calls.some(c => c.name === "provider"), false);
  assert.equal(calls.some(c => c.path?.endsWith("/append")), false);
});

test("invalid provider output is never persisted", async () => {
  const { env, calls } = fixture({ MODEL_PROVIDER: { async fetch(request) { calls.push({ name: "provider" }); return jsonResponse({ output: "   " }); } } });
  const res = await worker.fetch(req(), env);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).stage, "inference");
  assert.equal(calls.some(c => c.name === "memory" && c.path?.endsWith("/append")), false);
});

test("persistence response must bind Unity ID and request ID", async () => {
  const { env, calls } = fixture({
    IRIS_MEMORY: {
      async fetch(request) {
        const body = await request.clone().json();
        const route = new URL(request.url).pathname;
        calls.push({ name: "memory", path: route, body });
        if (route.endsWith("/claim")) return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "RESERVED", claimed: true });
        if (route.endsWith("/context")) return jsonResponse({ unity_id: body.unity_id, items: [] });
        return jsonResponse({ unity_id: "unity_other_999", persisted: true, request_id: "request-other-123" });
      },
    },
  });
  const res = await worker.fetch(req(), env);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).reason, "persistence-unconfirmed");
  assert.equal(res.headers.get("cache-control"), "no-store, max-age=0");
});

test("idempotency claim with mismatched action fails before memory or provider", async () => {
  const { env, calls } = fixture({
    IRIS_MEMORY: {
      async fetch(request) {
        const body = await request.clone().json();
        const route = new URL(request.url).pathname;
        calls.push({ name: "memory", path: route, body });
        if (route.endsWith("/claim")) return jsonResponse({
          contract: body.contract, unity_id: body.unity_id, request_id: body.request_id,
          action: "iris.admin.override", input_sha256: body.input_sha256, state: "RESERVED", claimed: true,
        });
        return jsonResponse({ unity_id: body.unity_id, items: [] });
      },
    },
  });
  const res = await worker.fetch(req(), env);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).reason, "claim-binding-mismatch");
  assert.equal(calls.some(c => c.path?.endsWith("/context")), false);
  assert.equal(calls.some(c => c.name === "provider"), false);
  assert.equal(calls.some(c => c.path?.endsWith("/append")), false);
});
test("unsupported method is rejected without calling any binding", async () => {
  const { env, calls } = fixture();
  const res = await worker.fetch(new Request("https://iris-runtime.test/v1/turn", {
    method: "GET", headers: { origin: "https://dualiscapax.ai" },
  }), env);
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("allow"), "POST");
  assert.equal(calls.length, 0);
});


test("oversized provider output is rejected and never persisted", async () => {
  const { env, calls } = fixture({
    MODEL_PROVIDER: { async fetch() { calls.push({ name: "provider" }); return jsonResponse({ output: "x".repeat(12001) }); } },
  });
  const res = await worker.fetch(req(), env);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).stage, "inference");
  assert.equal(calls.some(c => c.name === "memory" && c.path?.endsWith("/append")), false);
});

test("oversized private memory context fails before provider inference", async () => {
  const { env, calls } = fixture({
    IRIS_MEMORY: {
      async fetch(request) {
        const body = await request.clone().json();
        const route = new URL(request.url).pathname;
        calls.push({ name: "memory", path: route, body });
        if (route.endsWith("/claim")) return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "RESERVED", claimed: true });
        if (route.endsWith("/context")) return jsonResponse({ unity_id: body.unity_id, items: Array.from({ length: 13 }, (_, i) => ({ id: i })) });
        return jsonResponse({ unity_id: body.unity_id, persisted: true, request_id: body.request_id, receipt_id: "receipt", receipt_sha256: "a".repeat(64) });
      },
    },
  });
  const res = await worker.fetch(req(), env);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).stage, "memory-read");
  assert.equal(calls.some(c => c.name === "provider"), false);
});

test("persistence without a durable receipt hash is not reported as success", async () => {
  const { env } = fixture({
    IRIS_MEMORY: {
      async fetch(request) {
        const body = await request.clone().json();
        const route = new URL(request.url).pathname;
        if (route.endsWith("/claim")) return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "RESERVED", claimed: true });
        if (route.endsWith("/context")) return jsonResponse({ unity_id: body.unity_id, items: [] });
        return jsonResponse({ unity_id: body.unity_id, persisted: true, request_id: body.request_id, receipt_id: "receipt-without-hash" });
      },
    },
  });
  const res = await worker.fetch(req(), env);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).reason, "persistence-unconfirmed");
});

test("malformed durable receipt hash is rejected", async () => {
  const { env } = fixture({
    IRIS_MEMORY: {
      async fetch(request) {
        const body = await request.clone().json();
        const route = new URL(request.url).pathname;
        if (route.endsWith("/claim")) return jsonResponse({ contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, state: "RESERVED", claimed: true });
        if (route.endsWith("/context")) return jsonResponse({ unity_id: body.unity_id, items: [] });
        return jsonResponse({ unity_id: body.unity_id, persisted: true, request_id: body.request_id, receipt_id: "receipt-bad-hash", receipt_sha256: "not-a-hash" });
      },
    },
  });
  const res = await worker.fetch(req(), env);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).reason, "persistence-unconfirmed");
});

function paidReq(payment = true) {
  const url = "https://iris-runtime.test/v1/paid-turn";
  const rail = {
    scheme: "exact", network: "eip155:8453", amount: AMOUNT,
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    payTo: PAY_TO, maxTimeoutSeconds: 300,
    extra: { name: "USD Coin", version: "2", assetTransferMethod: "eip3009" },
  };
  const headers = {
    origin: "https://dualiscapax.ai", "content-type": "application/json",
    "x-request-id": "paid-request-test-1234",
  };
  if (payment) headers["payment-signature"] = encodeHeader({
    x402Version: 2,
    resource: { url, mimeType: "application/json" },
    accepted: requirementOf(rail),
    payload: {
      signature: "0x" + "a".repeat(130),
      authorization: {
        from: "0x" + "1".repeat(40), to: PAY_TO, value: AMOUNT,
        validAfter: "0", validBefore: String(Math.floor(Date.now() / 1000) + 60),
        nonce: "0x" + "b".repeat(64),
      },
    },
  });
  return new Request(url, { method: "POST", headers, body: JSON.stringify({ text: "6 * 7" }) });
}

test("paid runtime returns x402 challenge only after Trinity allows the exact request", async () => {
  const { env, calls } = fixture();
  const response = await worker.fetch(paidReq(false), env);
  assert.equal(response.status, 402);
  assert.equal((await response.json()).x402Version, 2);
  assert.deepEqual(calls.map((call) => call.name), ["identity", "trinity", "memory"]);
  assert.equal(calls[2].path, "/v1/requests/claim");
  assert.equal(calls.some((call) => call.path.endsWith("/context") || call.path.endsWith("/append")), false);
});

test("paid runtime settles through x402, executes once, persists receipt, then completes payment ledger", async () => {
  const { env, calls } = fixture();
  const facilitatorCalls = [];
  env.X402_FACILITATOR_FETCH = async (url, init) => {
    const path = new URL(url).pathname;
    facilitatorCalls.push(path);
    if (path.endsWith("/verify")) return Response.json({ isValid: true, payer: "0x" + "1".repeat(40) });
    return Response.json({
      success: true, transaction: "0x" + "c".repeat(64),
      payer: "0x" + "1".repeat(40), network: "eip155:8453",
    });
  };
  const response = await worker.fetch(paidReq(true), env);
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  assert.equal(data.result, "42");
  assert.equal(data.payment.transaction, "0x" + "c".repeat(64));
  assert.deepEqual(facilitatorCalls, ["/verify", "/settle"]);
  assert.deepEqual(calls.map((call) => call.name), [
    "identity", "trinity", "memory", "paymentLedger", "paymentLedger", "paymentLedger",
    "memory", "paymentLedger",
  ]);
  assert.equal(calls[2].path, "/v1/requests/claim");
  assert.deepEqual(calls.filter((call) => call.name === "paymentLedger").map((call) => call.path), [
    "/v1/payments/claim", "/v1/payments/attempting", "/v1/payments/record", "/v1/payments/complete",
  ]);
  assert.equal(calls.find((call) => call.path.endsWith("/append")).body.provenance.payment.transaction, "0x" + "c".repeat(64));
});

test("paid runtime refuses before identity when the durable payment ledger is missing", async () => {
  const { env, calls } = fixture({ X402_LEDGER: undefined });
  const response = await worker.fetch(paidReq(false), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).stage, "payment-ledger");
  assert.equal(calls.length, 0);
});

test("paid runtime never contacts facilitator when Trinity denies the request", async () => {
  const { env, calls } = fixture({
    TRINITY_LAW: {
      async fetch(request) {
        calls.push({ name: "trinity" });
        const body = await request.json();
        return jsonResponse({
          decision: "deny", authorized: false, request_id: body.request_id,
          action: body.action, input_sha256: body.input_sha256, principal: body.principal,
        }, 200);
      },
    },
  });
  const facilitatorCalls = [];
  env.X402_FACILITATOR_FETCH = async (url) => {
    facilitatorCalls.push(new URL(url).pathname);
    return Response.json({ isValid: true });
  };
  const response = await worker.fetch(paidReq(true), env);
  assert.equal(response.status, 403);
  assert.deepEqual(facilitatorCalls, []);
  assert.equal(calls.some((call) => call.name === "paymentLedger"), false);
  assert.equal(calls.some((call) => call.name === "memory"), false);
});

test("rejected payment releases the ledger reservation and never executes", async () => {
  const { env, calls } = fixture();
  env.X402_FACILITATOR_FETCH = async (url) => {
    if (new URL(url).pathname.endsWith("/verify")) {
      return Response.json({ isValid: false, invalidReason: "invalid_signature" }, { status: 400 });
    }
    throw new Error("settlement must not run after failed verification");
  };
  const response = await worker.fetch(paidReq(true), env);
  assert.equal(response.status, 402);
  assert.deepEqual(calls.filter((call) => call.name === "paymentLedger").map((call) => call.path), [
    "/v1/payments/claim", "/v1/payments/attempting", "/v1/payments/release",
  ]);
  assert.deepEqual(calls.filter((call) => call.name === "memory").map((call) => call.path), ["/v1/requests/claim"]);
});

test("ambiguous facilitator outcome marks payment in doubt and blocks execution", async () => {
  const { env, calls } = fixture();
  env.X402_FACILITATOR_FETCH = async (url) => {
    if (new URL(url).pathname.endsWith("/verify")) {
      return Response.json({ isValid: true, payer: "0x" + "1".repeat(40) });
    }
    throw new Error("simulated settle timeout");
  };
  const response = await worker.fetch(paidReq(true), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).stage, "payment-settlement-in-doubt");
  assert.deepEqual(calls.filter((call) => call.name === "paymentLedger").map((call) => call.path), [
    "/v1/payments/claim", "/v1/payments/attempting", "/v1/payments/in-doubt",
  ]);
  assert.deepEqual(calls.filter((call) => call.name === "memory").map((call) => call.path), ["/v1/requests/claim"]);
});

test("core runtime health is independent of optional paid-payment configuration", async () => {
  const { env } = fixture({
    X402_LEDGER: undefined,
    X402_LEDGER_TOKEN: undefined,
    X402_AMOUNT: undefined,
    X402_PAY_TO: undefined,
  });
  const response = await worker.fetch(new Request("https://iris-runtime.test/health"), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.available, true);
  assert.equal(body.paid_operations, "unavailable");
});

test("paid runtime fails closed without explicit amount and recipient policy", async () => {
  const { env, calls } = fixture({ X402_AMOUNT: undefined, X402_PAY_TO: undefined });
  const response = await worker.fetch(paidReq(false), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).stage, "payment-policy");
  assert.equal(calls.length, 0);
});
