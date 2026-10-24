/**
 * PUEL (Proof of Universal Legitimacy) evidence bundle v0.1.
 *
 * This is a structural binding gate, not a cryptographic proof verifier,
 * identity provider, consensus protocol, or truth oracle. A structurally valid
 * bundle must never be described as universally legitimate until each evidence
 * source is independently authenticated and its signatures/proofs verified.
 */
import { validateWorkEnvelope, validateResourceMeasurement } from "./universal-work-contract.mjs";

const HASH_RE = /^[a-f0-9]{64}$/;
const ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;
const PRINCIPAL_RE = /^[A-Za-z0-9_-]{8,128}$/;
const isRecord = (value) => !!value && typeof value === "object" && !Array.isArray(value);
const hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
const nonEmpty = (value, max = 512) => typeof value === "string" && !!value.trim() && value.length <= max;

function checkBinding(record, expected, errors, label) {
  for (const [key, value] of Object.entries(expected)) {
    if (record?.[key] !== value) errors.push(label + "-binding-mismatch-" + key);
  }
}

export function validatePuelEvidenceBundle(bundle) {
  const errors = [];
  if (!isRecord(bundle)) {
    return {
      valid: false,
      status: "EVIDENCE_INVALID",
      proof_claim: "NOT_PROVEN",
      errors: ["bundle-must-be-object"],
    };
  }

  if (!hasOnlyKeys(bundle, ["contract", "work_envelope", "identity_evidence", "trinity_decision", "execution_receipt", "resource_measurements", "settlement_evidence"])) {
    errors.push("unknown-bundle-field");
  }
  if (bundle.contract !== "dualis.puel.evidence.v1") errors.push("invalid-contract");

  const work = validateWorkEnvelope(bundle.work_envelope);
  if (!work.valid) errors.push(...work.errors.map((error) => "work-" + error));
  const envelope = bundle.work_envelope;
  const expected = isRecord(envelope) ? {
    unity_id: envelope.unity_id,
    request_id: envelope.request_id,
    action: envelope.action,
    input_sha256: envelope.input_sha256,
  } : {};

  const identity = bundle.identity_evidence;
  if (!isRecord(identity) || !hasOnlyKeys(identity, ["contract", "verified", "unity_id", "request_id", "input_sha256", "evidence_ref"])) {
    errors.push("invalid-identity-evidence");
  } else {
    if (identity.contract !== "dualis.identity.attestation.v1") errors.push("invalid-identity-contract");
    if (identity.verified !== true) errors.push("identity-not-verified");
    checkBinding(identity, { unity_id: expected.unity_id, request_id: expected.request_id, input_sha256: expected.input_sha256 }, errors, "identity");
    if (!nonEmpty(identity.evidence_ref)) errors.push("identity-evidence-reference-required");
  }

  const trinity = bundle.trinity_decision;
  if (!isRecord(trinity) || !hasOnlyKeys(trinity, ["contract", "decision", "authorized", "unity_id", "request_id", "action", "input_sha256", "policy_version", "evidence_ref"])) {
    errors.push("invalid-trinity-decision");
  } else {
    if (trinity.contract !== "dualis.trinity.decision.v1") errors.push("invalid-trinity-contract");
    if (trinity.decision !== "allow" || trinity.authorized !== true) errors.push("trinity-not-allow");
    checkBinding(trinity, expected, errors, "trinity");
    if (trinity.policy_version !== envelope?.policy_version) errors.push("trinity-binding-mismatch-policy_version");
    if (!nonEmpty(trinity.evidence_ref)) errors.push("trinity-evidence-reference-required");
  }

  const receipt = bundle.execution_receipt;
  if (!isRecord(receipt) || !hasOnlyKeys(receipt, ["contract", "unity_id", "request_id", "action", "input_sha256", "result_sha256", "receipt_id", "receipt_sha256", "evidence_ref"])) {
    errors.push("invalid-execution-receipt");
  } else {
    if (receipt.contract !== "dualis.receipt.v1") errors.push("invalid-execution-receipt-contract");
    checkBinding(receipt, expected, errors, "receipt");
    if (!HASH_RE.test(receipt.result_sha256 || "")) errors.push("invalid-result-digest");
    if (!nonEmpty(receipt.receipt_id, 256)) errors.push("invalid-receipt-id");
    if (!HASH_RE.test(receipt.receipt_sha256 || "")) errors.push("invalid-receipt-digest");
    if (!nonEmpty(receipt.evidence_ref)) errors.push("receipt-evidence-reference-required");
  }

  if (!Array.isArray(bundle.resource_measurements)) {
    errors.push("resource-measurements-must-be-array");
  } else {
    if (bundle.resource_measurements.length > 64) errors.push("too-many-resource-measurements");
    for (const [index, measurement] of bundle.resource_measurements.entries()) {
      const result = validateResourceMeasurement(measurement);
      if (!result.valid) errors.push(...result.errors.map((error) => "measurement-" + index + "-" + error));
      if (measurement?.request_id !== expected.request_id) errors.push("measurement-" + index + "-request-binding-mismatch");
    }
  }

  if (bundle.settlement_evidence !== undefined && bundle.settlement_evidence !== null) {
    const settlement = bundle.settlement_evidence;
    if (!isRecord(settlement) || !hasOnlyKeys(settlement, ["contract", "state", "unity_id", "request_id", "action", "input_sha256", "payment_sha256", "evidence_ref"])) {
      errors.push("invalid-settlement-evidence");
    } else {
      if (settlement.contract !== "dualis.settlement.evidence.v1") errors.push("invalid-settlement-contract");
      if (settlement.state !== "SETTLED" && settlement.state !== "EXECUTED") errors.push("settlement-not-final");
      checkBinding(settlement, expected, errors, "settlement");
      if (!HASH_RE.test(settlement.payment_sha256 || "")) errors.push("invalid-payment-digest");
      if (!nonEmpty(settlement.evidence_ref)) errors.push("settlement-evidence-reference-required");
    }
  }

  const valid = errors.length === 0;
  return {
    valid,
    status: valid ? "STRUCTURALLY_BOUND" : "EVIDENCE_INVALID",
    proof_claim: "NOT_CRYPTOGRAPHICALLY_VERIFIED",
    errors,
    checks: {
      envelope_structure: work.valid,
      identity_evidence_present: isRecord(identity) && identity.verified === true,
      trinity_allow_present: isRecord(trinity) && trinity.decision === "allow" && trinity.authorized === true,
      execution_receipt_present: isRecord(receipt),
      resource_measurements: Array.isArray(bundle.resource_measurements) ? bundle.resource_measurements.length : null,
      settlement_evidence_present: isRecord(bundle.settlement_evidence),
    },
  };
}
