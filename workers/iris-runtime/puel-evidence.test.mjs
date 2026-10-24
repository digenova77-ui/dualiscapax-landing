import test from "node:test";
import assert from "node:assert/strict";
import { validatePuelEvidenceBundle } from "./puel-evidence.mjs";

const hash = (char) => char.repeat(64);
const validBundle = () => ({
  contract: "dualis.puel.evidence.v1",
  work_envelope: {
    contract: "dualis.work.v1",
    request_id: "request-puel-0001",
    input_sha256: hash("a"),
    unity_id: "unity_test_123",
    action: "compute.evaluate",
    module: "dclm.v1",
    policy_version: "trinity.v1",
    complexity: { class: "unknown", features: { input_items: 1 }, estimate_basis: "Uncalibrated workload descriptor" },
    resource_budget: { cpu_ms: 1000, memory_bytes: 1048576 },
    verification: { class: "deterministic-check", acceptance_criterion: "Output digest matches the persisted result." },
  },
  identity_evidence: {
    contract: "dualis.identity.attestation.v1",
    verified: true,
    unity_id: "unity_test_123",
    request_id: "request-puel-0001",
    input_sha256: hash("a"),
    evidence_ref: "identity-log:record-123",
  },
  trinity_decision: {
    contract: "dualis.trinity.decision.v1",
    decision: "allow",
    authorized: true,
    unity_id: "unity_test_123",
    request_id: "request-puel-0001",
    action: "compute.evaluate",
    input_sha256: hash("a"),
    policy_version: "trinity.v1",
    evidence_ref: "trinity-log:decision-123",
  },
  execution_receipt: {
    contract: "dualis.receipt.v1",
    unity_id: "unity_test_123",
    request_id: "request-puel-0001",
    action: "compute.evaluate",
    input_sha256: hash("a"),
    result_sha256: hash("b"),
    receipt_id: "receipt-123",
    receipt_sha256: hash("c"),
    evidence_ref: "receipt-store:receipt-123",
  },
  resource_measurements: [{
    contract: "dualis.resource-measurement.v1",
    request_id: "request-puel-0001",
    resource: "cpu-time",
    value: 12.5,
    unit: "ms",
    classification: "provider-reported",
    source_id: "worker-runtime",
    observed_at: "2026-10-24T12:00:00Z",
    evidence_ref: "sha256:" + hash("d"),
    uncertainty: 0,
  }],
});

test("accepts a structurally bound evidence bundle without claiming cryptographic proof", () => {
  const result = validatePuelEvidenceBundle(validBundle());
  assert.equal(result.valid, true);
  assert.equal(result.status, "STRUCTURALLY_BOUND");
  assert.equal(result.proof_claim, "NOT_CRYPTOGRAPHICALLY_VERIFIED");
  assert.equal(result.checks.envelope_structure, true);
  assert.equal(result.checks.trinity_allow_present, true);
});

test("rejects a Trinity allow bound to a different input digest", () => {
  const bundle = validBundle();
  bundle.trinity_decision.input_sha256 = hash("e");
  const result = validatePuelEvidenceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("trinity-binding-mismatch-input_sha256"));
});

test("rejects identity evidence for a different Unity principal", () => {
  const bundle = validBundle();
  bundle.identity_evidence.unity_id = "unity_other_456";
  const result = validatePuelEvidenceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("identity-binding-mismatch-unity_id"));
});

test("rejects execution receipts that do not bind to the authorized action", () => {
  const bundle = validBundle();
  bundle.execution_receipt.action = "admin.delete";
  const result = validatePuelEvidenceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("receipt-binding-mismatch-action"));
});

test("rejects denied Trinity decisions and forged-looking hash shapes do not become authorization", () => {
  const bundle = validBundle();
  bundle.trinity_decision.decision = "deny";
  bundle.trinity_decision.authorized = false;
  const result = validatePuelEvidenceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("trinity-not-allow"));
});

test("rejects measurement records tied to a different request", () => {
  const bundle = validBundle();
  bundle.resource_measurements[0].request_id = "request-puel-0002";
  const result = validatePuelEvidenceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("measurement-0-request-binding-mismatch"));
});

test("rejects unknown fields instead of silently dropping evidence", () => {
  const bundle = validBundle();
  bundle.unreviewed_claim = "fully legitimate";
  const result = validatePuelEvidenceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("unknown-bundle-field"));
});

test("optional settlement evidence must bind to the same operation and final state", () => {
  const bundle = validBundle();
  bundle.settlement_evidence = {
    contract: "dualis.settlement.evidence.v1",
    state: "SETTLED",
    unity_id: "unity_test_123",
    request_id: "request-puel-0001",
    action: "compute.evaluate",
    input_sha256: hash("a"),
    payment_sha256: hash("f"),
    evidence_ref: "ledger:payment-123",
  };
  assert.equal(validatePuelEvidenceBundle(bundle).valid, true);
  bundle.settlement_evidence.state = "IN_DOUBT";
  assert.ok(validatePuelEvidenceBundle(bundle).errors.includes("settlement-not-final"));
});

test("rejects a malformed bundle and missing evidence", () => {
  assert.equal(validatePuelEvidenceBundle(null).status, "EVIDENCE_INVALID");
  const bundle = validBundle();
  delete bundle.identity_evidence;
  assert.equal(validatePuelEvidenceBundle(bundle).valid, false);
});
