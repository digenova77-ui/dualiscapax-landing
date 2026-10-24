/**
 * Diamond trilogy asset-intent contract v0.1.
 *
 * This is a policy/schema gate, not a token implementation, wallet, ledger,
 * issuance mechanism, transfer mechanism, or energy meter. It deliberately
 * rejects value-moving operations until each asset has a separately approved
 * and implemented authority/settlement contract.
 */
const isRecord = (value) => !!value && typeof value === "object" && !Array.isArray(value);
const hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
const ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;
const HASH_RE = /^[a-f0-9]{64}$/;

const ASSET_POLICY = Object.freeze({
  efuse: {
    role: "resource-accounting-reference",
    allowed_actions: new Set(["record-measurement", "quote-resource-cost", "verify-measurement-evidence"]),
    prohibited_actions: new Set(["issue", "transfer", "redeem", "trade", "settle"]),
  },
  merit: {
    role: "utility-access-entitlement",
    allowed_actions: new Set(["evaluate-access", "grant-access", "revoke-access", "record-usage"]),
    prohibited_actions: new Set(["issue", "transfer", "redeem", "trade", "settle", "cash-out"]),
  },
  unity: {
    role: "non-transferable-identity-credential",
    allowed_actions: new Set(["verify-identity", "bind-principal", "revoke-credential"]),
    prohibited_actions: new Set(["issue", "transfer", "redeem", "trade", "settle", "cash-out"]),
  },
});

export function validateTrilogyIntent(intent) {
  const errors = [];
  if (!isRecord(intent)) return { valid: false, status: "INTENT_INVALID", errors: ["intent-must-be-object"] };
  if (!hasOnlyKeys(intent, ["contract", "asset", "action", "request_id", "principal_id", "evidence_sha256", "policy_version"])) {
    errors.push("unknown-intent-field");
  }
  if (intent.contract !== "dualis.trilogy.intent.v1") errors.push("invalid-contract");
  if (typeof intent.asset !== "string" || !Object.hasOwn(ASSET_POLICY, intent.asset)) {
    errors.push("unknown-asset");
  }
  if (typeof intent.action !== "string" || !/^[a-z][a-z-]{0,63}$/.test(intent.action)) errors.push("invalid-action");
  if (typeof intent.request_id !== "string" || !ID_RE.test(intent.request_id)) errors.push("invalid-request-id");
  if (typeof intent.principal_id !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(intent.principal_id)) errors.push("invalid-principal-id");
  if (typeof intent.evidence_sha256 !== "string" || !HASH_RE.test(intent.evidence_sha256)) errors.push("invalid-evidence-digest");
  if (typeof intent.policy_version !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._+-]{0,63}$/.test(intent.policy_version)) errors.push("invalid-policy-version");

  const policy = ASSET_POLICY[intent.asset];
  if (policy && typeof intent.action === "string") {
    if (policy.prohibited_actions.has(intent.action)) errors.push("action-prohibited-for-asset");
    else if (!policy.allowed_actions.has(intent.action)) errors.push("action-not-allowlisted-for-asset");
  }

  return {
    valid: errors.length === 0,
    status: errors.length ? "INTENT_INVALID" : "INTENT_VALIDATION_ONLY",
    errors,
    asset_role: policy?.role ?? null,
    authorization_performed: false,
    ledger_write_performed: false,
    issuance_performed: false,
    transfer_performed: false,
    settlement_performed: false,
  };
}

export function trilogyAssetPolicy() {
  return Object.fromEntries(Object.entries(ASSET_POLICY).map(([asset, policy]) => [
    asset,
    {
      role: policy.role,
      allowed_actions: [...policy.allowed_actions].sort(),
      prohibited_actions: [...policy.prohibited_actions].sort(),
      implemented_token: false,
      live_balance_verified: false,
      settlement_enabled: false,
    },
  ]));
}
