/**
 * PUEL signed bundle verifier v0.1.
 *
 * Composes structural binding checks with Ed25519 verification. The trust
 * registry remains an explicit dependency and is not asserted to be a root
 * of trust. Each required evidence source must be signed by a key authorized
 * for its role and bound to the exact evidence object in the bundle.
 */
import { validatePuelEvidenceBundle } from "./puel-evidence.mjs";
import { puelCanonicalJson, verifyPuelAttestation } from "./puel-signatures.mjs";

const isRecord = (value) => !!value && typeof value === "object" && !Array.isArray(value);

function sameCanonicalValue(left, right) {
  try { return puelCanonicalJson(left) === puelCanonicalJson(right); }
  catch { return false; }
}

export async function verifyPuelBundle({ bundle, attestations, trustedKeys, now = Date.now(), maxAgeMs = 86400000 }) {
  const errors = [];
  const structural = validatePuelEvidenceBundle(bundle);
  if (!structural.valid) errors.push(...structural.errors.map((error) => "bundle-" + error));
  if (!Array.isArray(attestations)) {
    errors.push("attestations-must-be-array");
    return {
      valid: false,
      status: "PUEL_REJECTED",
      proof_claim: "NOT_PROVEN",
      errors,
      structural,
      verified_roles: [],
    };
  }

  const required = [
    { role: "identity-attestation", evidence: bundle?.identity_evidence },
    { role: "trinity-decision", evidence: bundle?.trinity_decision },
    { role: "execution-receipt", evidence: bundle?.execution_receipt },
    ...((Array.isArray(bundle?.resource_measurements) ? bundle.resource_measurements : [])
      .map((evidence) => ({ role: "resource-measurement", evidence }))),
  ];
  if (isRecord(bundle?.settlement_evidence)) {
    required.push({ role: "settlement-evidence", evidence: bundle.settlement_evidence });
  }

  const verifiedRoles = [];
  const used = new Set();
  for (const item of required) {
    const index = attestations.findIndex((entry, i) =>
      !used.has(i) && isRecord(entry) && entry.role === item.role &&
      sameCanonicalValue(entry.evidence, item.evidence));
    if (index < 0) {
      errors.push("missing-signed-evidence-" + item.role);
      continue;
    }
    used.add(index);
    const entry = attestations[index];
    const result = await verifyPuelAttestation({
      attestation: entry.attestation,
      evidence: item.evidence,
      trustedKeys,
      now,
      maxAgeMs,
    });
    if (!result.valid) errors.push(...result.errors.map((error) => item.role + "-" + error));
    else verifiedRoles.push({ role: item.role, issuer_id: result.issuer_id, key_id: result.key_id, payload_sha256: result.payload_sha256 });
  }

  if (attestations.some((_, index) => !used.has(index))) errors.push("unexpected-or-duplicate-attestation");
  const valid = structural.valid && errors.length === 0 && verifiedRoles.length === required.length;
  return {
    valid,
    status: valid ? "SIGNED_EVIDENCE_VERIFIED" : "PUEL_REJECTED",
    proof_claim: valid ? "CRYPTOGRAPHIC_SIGNATURES_VERIFIED_UNDER_SUPPLIED_TRUST_REGISTRY" : "NOT_PROVEN",
    trust_scope: "caller-supplied-key-registry",
    errors,
    structural,
    verified_roles: verifiedRoles,
  };
}
