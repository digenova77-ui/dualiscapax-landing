import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { arbitrateCompute, evaluateExactArithmetic, priceCompute } from "./compute-arbitrator.mjs";
import worker from "./worker.mjs";

test("exact arithmetic uses a bounded parser with operator precedence", () => {
  assert.equal(evaluateExactArithmetic("2 + 3 * (4 - 1)"), 11);
  assert.equal(evaluateExactArithmetic("-8 / 2"), -4);
  assert.equal(evaluateExactArithmetic("10 % 4"), 2);
  assert.equal(evaluateExactArithmetic("2 / 0"), null);
  assert.equal(evaluateExactArithmetic("2 + process.exit()"), null);
  assert.equal(evaluateExactArithmetic("1e9 + 2"), null);
  assert.equal(evaluateExactArithmetic("2 +"), null);
});

test("arbitration selects deterministic only for a complete exact expression", () => {
  assert.deepEqual(arbitrateCompute("6 * 7"), {
    lane: "deterministic", action: "iris.compute.deterministic", result: "42", provider_required: false
  });
  assert.equal(arbitrateCompute("What is 6 times 7?").lane, "probabilistic");
  assert.equal(arbitrateCompute("transfer 10 merit").provider_required, true);
});

test("Joule accounting refuses to invent an energy index or settled price", () => {
  assert.equal(priceCompute({ joules: 10, providerCad: 0.01 }).status, "UNPRICED");
  assert.equal(priceCompute({ joules: 10, measurement: "estimated" }).status, "ESTIMATED_UNPRICED");
  const p = priceCompute({
    joules: 10, cadPerJoule: 0.002, providerCad: 0.01, serviceCad: 0.005,
    measurement: "measured", indexId: "test-index-v1", indexTimestamp: "2026-10-23T00:00:00Z"
  });
  assert.equal(p.status, "PRICED_UNVERIFIED");
  assert.equal(p.energyCad, 0.02);
  assert.equal(p.totalCad, 0.035);
  assert.equal(priceCompute({ joules: -1, cadPerJoule: 0.1, indexId: "x", indexTimestamp: "t" }).status, "INVALID_INPUT");
  assert.equal(priceCompute({ joules: 1, cadPerJoule: 0.1, indexId: "x", indexTimestamp: "not-a-date" }).status, "UNPRICED");
  assert.equal(priceCompute({ joules: 1, cadPerJoule: 0.1, indexId: "x", indexTimestamp: "2026-10-23T00:00:00Z", measurement: "mystery" }).status, "INVALID_MEASUREMENT_CLASS");
});

const sha256Text = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json" },
});
function fixture() {
  const calls = [];
  const binding = (name, handler) => ({
    async fetch(request) {
      const body = request.method === "POST" ? await request.clone().json().catch(() => ({})) : {};
      calls.push({ name, path: new URL(request.url).pathname, body });
      return jsonResponse(await handler(body, request));
    },
  });
  const env = {
    IRIS_ALLOWED_ORIGINS: "https://dualiscapax.ai",
    IDENTITY_API: binding("identity", async () => ({ verified: true, unity_id: "unity_user_123" })),
    IRIS_MEMORY: binding("memory", async (body, request) => {
      const route = new URL(request.url).pathname;
      if (route.endsWith("/context")) return { unity_id: body.unity_id, items: [] };
      if (route.endsWith("/claim")) return { contract: body.contract, unity_id: body.unity_id, request_id: body.request_id, input_sha256: body.input_sha256, state: "RESERVED", claimed: true };
      return { contract: body.contract, unity_id: body.unity_id, persisted: true, request_id: body.request_id, action: body.action, input_sha256: body.input_sha256, result_sha256: sha256Text(body.output), receipt_id: "receipt-math", receipt_sha256: "b".repeat(64) };
    }),
    TRINITY_LAW: binding("trinity", async (body) => ({
      decision: "allow", authorized: true, request_id: body.request_id,
      action: body.action, input_sha256: body.input_sha256, principal: body.principal,
    })),
    MODEL_PROVIDER: binding("provider", async () => ({ output: "should not be called for exact math", provider: "test-provider" })),
  };
  return { env, calls };
}

test("runtime runs exact arithmetic only after Trinity allows it and skips provider inference", async () => {
  const { env, calls } = fixture();
  const request = new Request("https://iris-runtime.test/v1/turn", {
    method: "POST",
    headers: { origin: "https://dualiscapax.ai", "content-type": "application/json", "x-request-id": "request-math-12345678" },
    body: JSON.stringify({ text: "6 * 7" }),
  });
  const response = await worker.fetch(request, env);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.result, "42");
  assert.equal(data.compute.lane, "deterministic");
  assert.equal(data.compute.provider_called, false);
  assert.equal(calls.some(c => c.name === "trinity" && c.body.action === "iris.compute.deterministic"), true);
  assert.equal(calls.find(c => c.name === "trinity").body.memory_requested, false);
  assert.equal(calls.some(c => c.name === "provider"), false);
  assert.equal(calls.some(c => c.name === "memory" && c.path.endsWith("/claim")), true);
  assert.equal(calls.some(c => c.name === "memory" && c.path.endsWith("/context")), false);
  assert.equal(calls.some(c => c.name === "memory" && c.path.endsWith("/append")), true);
});


test("seeded malformed arithmetic corpus never throws or produces non-finite output", () => {
  let seed = 0x71a15;
  const random = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 0x100000000; };
  const alphabet = "0123456789.+-*/%() abcdefXYZ";
  for (let i = 0; i < 2000; i++) {
    const length = Math.floor(random() * 280);
    let input = "";
    for (let j = 0; j < length; j++) input += alphabet[Math.floor(random() * alphabet.length)];
    const result = evaluateExactArithmetic(input);
    assert.ok(result === null || (typeof result === "number" && Number.isFinite(result) && Math.abs(result) <= 1e15), `unexpected parser result for case ${i}`);
  }
});

test("arithmetic bounds reject oversized magnitude, token floods, and long expressions", () => {
  assert.equal(evaluateExactArithmetic("9999999999999999 * 9999999999999999"), null);
  assert.equal(evaluateExactArithmetic(Array(70).fill("1").join("+")), null);
  assert.equal(evaluateExactArithmetic("1+".repeat(140) + "1"), null);
  assert.equal(evaluateExactArithmetic("1".repeat(257) + "+1"), null);
});

test("division and modulo by zero are rejected through nested expressions", () => {
  assert.equal(evaluateExactArithmetic("1 / (2 - 2)"), null);
  assert.equal(evaluateExactArithmetic("7 % (3 - 3)"), null);
});
