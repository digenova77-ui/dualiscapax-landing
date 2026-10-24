/**
 * Omnisoftware universal work contract v1.
 *
 * Pure validation/accounting primitives only: no authorization, execution,
 * metering, or settlement is performed here. Callers must still enforce Trinity.
 */

const SHA256_RE = /^[a-f0-9]{64}$/;
const ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;
const PRINCIPAL_RE = /^[A-Za-z0-9_-]{8,128}$/;
const ACTION_RE = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const VERSION_RE = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,63}$/;
const COMPLEXITY_CLASSES = new Set(["constant", "logarithmic", "linear", "linearithmic", "quadratic", "exponential", "unknown", "empirical"]);
const MEASUREMENT_CLASSES = new Set(["measured", "estimated", "provider-reported"]);
const VERIFICATION_CLASSES = new Set(["deterministic-check", "proof-check", "independent-validation", "domain-validation", "none"]);

const isRecord = (value) => !!value && typeof value === "object" && !Array.isArray(value);
const isFiniteNonnegative = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));

export function validateWorkEnvelope(envelope) {
  const errors = [];
  if (!isRecord(envelope)) return { valid: false, errors: ["envelope-must-be-object"] };

  const topKeys = [
    "contract", "request_id", "input_sha256", "unity_id", "action",
    "module", "policy_version", "complexity", "resource_budget", "verification",
  ];
  if (!hasOnlyKeys(envelope, topKeys)) errors.push("unknown-envelope-field");
  if (envelope.contract !== "dualis.work.v1") errors.push("invalid-contract");
  if (typeof envelope.request_id !== "string" || !ID_RE.test(envelope.request_id)) errors.push("invalid-request-id");
  if (typeof envelope.input_sha256 !== "string" || !SHA256_RE.test(envelope.input_sha256)) errors.push("invalid-input-digest");
  if (typeof envelope.unity_id !== "string" || !PRINCIPAL_RE.test(envelope.unity_id)) errors.push("invalid-unity-id");
  if (typeof envelope.action !== "string" || !ACTION_RE.test(envelope.action)) errors.push("invalid-action");
  if (typeof envelope.module !== "string" || !VERSION_RE.test(envelope.module)) errors.push("invalid-module");
  if (typeof envelope.policy_version !== "string" || !VERSION_RE.test(envelope.policy_version)) errors.push("invalid-policy-version");

  if (!isRecord(envelope.complexity)) {
    errors.push("invalid-complexity");
  } else {
    if (!hasOnlyKeys(envelope.complexity, ["class", "features", "estimate_basis"])) errors.push("unknown-complexity-field");
    if (!COMPLEXITY_CLASSES.has(envelope.complexity.class)) errors.push("invalid-complexity-class");
    if (!isRecord(envelope.complexity.features)) errors.push("invalid-complexity-features");
    else {
      for (const [key, value] of Object.entries(envelope.complexity.features)) {
        if (!/^[a-z][a-z0-9_]{0,63}$/.test(key) || !isFiniteNonnegative(value)) errors.push("invalid-complexity-feature");
      }
    }
    if (typeof envelope.complexity.estimate_basis !== "string" || !envelope.complexity.estimate_basis.trim() || envelope.complexity.estimate_basis.length > 256) {
      errors.push("invalid-complexity-estimate-basis");
    }
  }

  if (!isRecord(envelope.resource_budget)) {
    errors.push("invalid-resource-budget");
  } else {
    if (!hasOnlyKeys(envelope.resource_budget, ["cpu_ms", "memory_bytes", "energy_joules", "network_bytes"])) errors.push("unknown-resource-budget-field");
    const keys = ["cpu_ms", "memory_bytes", "energy_joules", "network_bytes"];
    if (!keys.some((key) => Object.hasOwn(envelope.resource_budget, key))) errors.push("empty-resource-budget");
    for (const key of keys) {
      if (Object.hasOwn(envelope.resource_budget, key) && !isFiniteNonnegative(envelope.resource_budget[key])) {
        errors.push("invalid-resource-budget-" + key);
      }
    }
  }

  if (!isRecord(envelope.verification)) {
    errors.push("invalid-verification");
  } else {
    if (!hasOnlyKeys(envelope.verification, ["class", "acceptance_criterion"])) errors.push("unknown-verification-field");
    if (!VERIFICATION_CLASSES.has(envelope.verification.class)) errors.push("invalid-verification-class");
    if (typeof envelope.verification.acceptance_criterion !== "string" ||
        !envelope.verification.acceptance_criterion.trim() ||
        envelope.verification.acceptance_criterion.length > 512) {
      errors.push("invalid-acceptance-criterion");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Cost decomposition is an estimate/quote only, never a charge or settlement.
 * All components use the caller-declared currency unit. Energy and provider
 * charges cannot be double-counted when the provider rate already includes energy.
 */
export function quoteWorkCost({
  currency,
  energyCost = 0,
  computeCost = 0,
  verificationCost = 0,
  platformCost = 0,
  moduleCost = 0,
  providerIncludesEnergy = false,
  energyBasis = "not-applicable",
}) {
  const components = { energyCost, computeCost, verificationCost, platformCost, moduleCost };
  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
    return { status: "INVALID_INPUT", errors: ["invalid-currency"], total: null };
  }
  for (const [key, value] of Object.entries(components)) {
    if (!isFiniteNonnegative(value)) return { status: "INVALID_INPUT", errors: ["invalid-" + key], total: null };
  }
  if (typeof providerIncludesEnergy !== "boolean") {
    return { status: "INVALID_INPUT", errors: ["invalid-provider-energy-flag"], total: null };
  }
  if (providerIncludesEnergy && energyCost !== 0) {
    return { status: "DOUBLE_COUNTED_ENERGY", errors: ["provider-cost-already-includes-energy"], total: null };
  }
  if (energyCost > 0 && !MEASUREMENT_CLASSES.has(energyBasis)) {
    return { status: "INVALID_INPUT", errors: ["energy-basis-required"], total: null };
  }
  const total = Object.values(components).reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total)) return { status: "INVALID_INPUT", errors: ["cost-overflow"], total: null };
  return {
    status: "QUOTE_ONLY",
    currency,
    components,
    total: Math.round((total + Number.EPSILON) * 1e10) / 1e10,
    energy_basis: energyCost > 0 ? energyBasis : "not-applicable",
    provider_includes_energy: providerIncludesEnergy,
    settled: false,
  };
}

/**
 * Validates an execution measurement record without asserting its truth.
 * "measured" still requires an evidence reference and meter/provider identity.
 */
export function validateResourceMeasurement(record) {
  const errors = [];
  if (!isRecord(record)) return { valid: false, errors: ["measurement-must-be-object"] };
  if (!hasOnlyKeys(record, [
    "contract", "request_id", "resource", "value", "unit", "classification",
    "source_id", "observed_at", "evidence_ref", "uncertainty",
  ])) errors.push("unknown-measurement-field");
  if (record.contract !== "dualis.resource-measurement.v1") errors.push("invalid-contract");
  if (typeof record.request_id !== "string" || !ID_RE.test(record.request_id)) errors.push("invalid-request-id");
  if (typeof record.resource !== "string" || !["energy", "cpu-time", "memory", "network", "storage", "accelerator-time"].includes(record.resource)) errors.push("invalid-resource");
  if (!isFiniteNonnegative(record.value)) errors.push("invalid-value");
  if (typeof record.unit !== "string" || !record.unit.trim() || record.unit.length > 32) errors.push("invalid-unit");
  if (!MEASUREMENT_CLASSES.has(record.classification)) errors.push("invalid-classification");
  if (typeof record.source_id !== "string" || !record.source_id.trim() || record.source_id.length > 128) errors.push("invalid-source-id");
  if (typeof record.observed_at !== "string" || !Number.isFinite(Date.parse(record.observed_at))) errors.push("invalid-observed-at");
  if (typeof record.evidence_ref !== "string" || !record.evidence_ref.trim() || record.evidence_ref.length > 512) errors.push("invalid-evidence-ref");
  if (record.uncertainty !== undefined && !isFiniteNonnegative(record.uncertainty)) errors.push("invalid-uncertainty");
  return { valid: errors.length === 0, errors };
}
