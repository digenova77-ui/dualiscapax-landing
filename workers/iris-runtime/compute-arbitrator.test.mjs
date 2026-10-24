import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExactArithmetic, arbitrateCompute, priceCompute } from "./compute-arbitrator.mjs";

test("exact arithmetic honors precedence and parentheses", () => {
  assert.equal(evaluateExactArithmetic("2 + 3 * 4"), 14);
  assert.equal(evaluateExactArithmetic("(2 + 3) * 4"), 20);
  assert.equal(evaluateExactArithmetic("10 / 4"), 2.5);
  assert.equal(evaluateExactArithmetic("-3 + 8"), 5);
});

test("arithmetic parser rejects malformed, unsafe, oversized, and non-arithmetic input", () => {
  for (const value of [
    "", "hello Iris", "1 / 0", "2 ** 8", "1; process.exit()", "1 +",
    "(".repeat(300) + "1" + ")".repeat(300), "1e3 + 1", "1 + 2 trailing",
  ]) {
    assert.equal(evaluateExactArithmetic(value), null, JSON.stringify(value));
  }
});

test("deterministic arithmetic is separated from probabilistic inference", () => {
  assert.deepEqual(arbitrateCompute("6 * 7"), {
    lane: "deterministic",
    action: "iris.compute.deterministic",
    result: "42",
    provider_required: false,
  });
  assert.deepEqual(arbitrateCompute("What is the meaning of life?"), {
    lane: "probabilistic",
    action: "iris.inference",
    result: null,
    provider_required: true,
  });
});

test("priceCompute refuses to invent a price when index evidence is missing", () => {
  assert.deepEqual(priceCompute({ joules: 3600, cadPerJoule: null }), {
    status: "UNPRICED",
    totalCad: null,
  });
});

test("priceCompute labels supplied measurements as unverified rather than metered truth", () => {
  const result = priceCompute({
    joules: 3600,
    cadPerJoule: 0.00001,
    providerCad: 0.25,
    serviceCad: 0.05,
    measurement: "measured",
    indexId: "test-index-v1",
    indexTimestamp: "2026-10-24T12:00:00Z",
  });
  assert.equal(result.status, "PRICED_UNVERIFIED");
  assert.equal(result.energyCad, 0.036);
  assert.equal(result.totalCad, 0.336);
  assert.equal(result.currency, "CAD");
});

test("priceCompute rejects negative and non-finite resource amounts", () => {
  assert.equal(priceCompute({ joules: -1, cadPerJoule: 0.1 }).status, "INVALID_INPUT");
  assert.equal(priceCompute({ joules: Infinity, cadPerJoule: 0.1 }).status, "INVALID_INPUT");
  assert.equal(priceCompute({ joules: 1, cadPerJoule: 0.1, measurement: "magic" }).status, "UNPRICED");
});
