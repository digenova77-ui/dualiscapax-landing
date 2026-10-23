import test from "node:test";
import assert from "node:assert/strict";
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
    IRIS_MEMORY: binding("memory", async (body, request) => new URL(request.url).pathname.endsWith("/context")
      ? ({ unity_id: body.unity_id, items: [] })
      : ({ unity_id: body.unity_id, persisted: true, request_id: body.request_id, receipt_id: "receipt-math" })),
    TRINITY_LAW: binding("trinity", async (body) => ({ decision: "allow", authorized: true, request_id: body.request_id, action: body.action })),
    MODEL_PROVIDER: binding("provider", async () => ({ output: "should not be called for exact math", provider: "test-provider" })),
  };
  return { env, calls };
}

test("runtime runs exact arithmetic only after Trinity allows it and skips provider inference", async () => {
  const { env, calls } = fixture();
  const request = new Request("https://iris-runtime.test/v1/turn", {
    method: "POST",
    headers: { origin: "https://dualiscapax.ai", "content-type": "application/json" },
    body: JSON.stringify({ text: "6 * 7" }),
  });
  const response = await worker.fetch(request, env);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.result, "42");
  assert.equal(data.compute.lane, "deterministic");
  assert.equal(data.compute.provider_called, false);
  assert.equal(calls.some(c => c.name === "trinity" && c.body.action === "iris.compute.deterministic"), true);
  assert.equal(calls.some(c => c.name === "provider"), false);
  assert.equal(calls.some(c => c.name === "memory" && c.path.endsWith("/claim")), true);
  assert.equal(calls.some(c => c.name === "memory" && c.path.endsWith("/append")), true);
});
