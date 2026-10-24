import test from "node:test";
import assert from "node:assert/strict";
import { validateWorkEnvelope, quoteWorkCost, validateResourceMeasurement } from "./universal-work-contract.mjs";

const validEnvelope = () => ({
  contract: "dualis.work.v1",
  request_id: "req-2026-000001",
  input_sha256: "a".repeat(64),
  unity_id: "unity_test_123",
  action: "iris.compute.deterministic",
  module: "arithmetic.v1",
  policy_version: "policy.v1",
  complexity: {
    class: "constant",
    features: { input_size: 5 },
    estimate_basis: "bounded arithmetic expression parser; feature values are workload descriptors, not energy",
  },
  resource_budget: { cpu_ms: 100, memory_bytes: 1048576, energy_joules: 25 },
  verification: { class: "deterministic-check", acceptance_criterion: "exact numeric result matches canonical evaluator" },
});

test("accepts a valid universal work envelope", () => {
  assert.deepEqual(validateWorkEnvelope(validEnvelope()), { valid: true, errors: [] });
});

test("rejects missing authority-adjacent bindings, malformed digests, and unknown fields", () => {
  const envelope = validEnvelope();
  delete envelope.policy_version;
  envelope.input_sha256 = "not-a-digest";
  envelope.client_claimed_energy = 1;
  const result = validateWorkEnvelope(envelope);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("invalid-policy-version"));
  assert.ok(result.errors.includes("invalid-input-digest"));
  assert.ok(result.errors.includes("unknown-envelope-field"));
});

test("complexity descriptors are not substituted for measured energy", () => {
  const envelope = validEnvelope();
  envelope.complexity = { class: "exponential", features: { search_space_size: 1000000 }, estimate_basis: "theoretical upper-bound class" };
  assert.equal(validateWorkEnvelope(envelope).valid, true);
  assert.equal(Object.hasOwn(envelope.complexity, "energy_joules"), false);
});

test("cost quote exposes components and never claims settlement", () => {
  const quote = quoteWorkCost({
    currency: "CAD", energyCost: 0.036, computeCost: 0.25,
    verificationCost: 0.05, platformCost: 0.02, moduleCost: 0.1,
    energyBasis: "measured",
  });
  assert.equal(quote.status, "QUOTE_ONLY");
  assert.equal(quote.total, 0.456);
  assert.equal(quote.settled, false);
});

test("prevents double-counting energy included in provider compute", () => {
  const quote = quoteWorkCost({ currency: "CAD", energyCost: 0.04, computeCost: 0.2, providerIncludesEnergy: true, energyBasis: "measured" });
  assert.equal(quote.status, "DOUBLE_COUNTED_ENERGY");
  assert.equal(quote.total, null);
});

test("requires a basis for a positive energy cost and rejects negative amounts", () => {
  assert.equal(quoteWorkCost({ currency: "CAD", energyCost: 0.1 }).status, "INVALID_INPUT");
  assert.equal(quoteWorkCost({ currency: "CAD", computeCost: -1 }).status, "INVALID_INPUT");
});

test("validates measurement provenance without claiming the measurement is true", () => {
  const record = {
    contract: "dualis.resource-measurement.v1",
    request_id: "req-2026-000001",
    resource: "energy",
    value: 12.5,
    unit: "J",
    classification: "measured",
    source_id: "meter-node-7",
    observed_at: "2026-10-24T12:00:00Z",
    evidence_ref: "sha256:" + "b".repeat(64),
    uncertainty: 0.2,
  };
  assert.deepEqual(validateResourceMeasurement(record), { valid: true, errors: [] });
  assert.equal(validateResourceMeasurement({ ...record, value: -1 }).valid, false);
});

test("measurement record fails closed when evidence provenance is absent", () => {
  const record = {
    contract: "dualis.resource-measurement.v1",
    request_id: "req-2026-000001",
    resource: "energy",
    value: 12.5,
    unit: "J",
    classification: "measured",
    source_id: "meter-node-7",
    observed_at: "2026-10-24T12:00:00Z",
  };
  assert.equal(validateResourceMeasurement(record).valid, false);
});
