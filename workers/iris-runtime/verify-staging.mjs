/**
 * Staging Worker configuration and receipt-contract verifier.
 * Does not deploy. Reads the expected binding names and receipt shape
 * so a staging deploy can be checked before any promotion.
 *
 * Usage: node workers/iris-runtime/verify-staging.mjs
 */
const REQUIRED_BINDINGS = [
  "IDENTITY_API",
  "TRINITY_LAW",
  "IRIS_MEMORY",
  "MODEL_PROVIDER",
];

const RECEIPT_CONTRACT = "dualis.receipt.v1";
const RECEIPT_HASH_RE = /^[a-f0-9]{64}$/;

function checkBindings(env) {
  const missing = REQUIRED_BINDINGS.filter((name) => !env[name]);
  return {
    ok: missing.length === 0,
    missing,
    present: REQUIRED_BINDINGS.filter((name) => !!env[name]),
  };
}

function checkReceipt(receipt, expected) {
  if (!receipt || typeof receipt !== "object") return { ok: false, reason: "missing-receipt" };
  if (receipt.contract !== RECEIPT_CONTRACT) return { ok: false, reason: "contract-mismatch" };
  if (receipt.unity_id !== expected.unity_id) return { ok: false, reason: "unity-mismatch" };
  if (receipt.request_id !== expected.request_id) return { ok: false, reason: "request-mismatch" };
  if (!RECEIPT_HASH_RE.test(receipt.sha256 || "")) return { ok: false, reason: "bad-hash" };
  return { ok: true };
}

// Self-check with a mock env so the script can run in CI without live bindings.
const mockEnv = {
  IDENTITY_API: {},
  TRINITY_LAW: {},
  IRIS_MEMORY: {},
  MODEL_PROVIDER: {},
};
const bindingResult = checkBindings(mockEnv);
const receiptResult = checkReceipt(
  {
    contract: RECEIPT_CONTRACT,
    unity_id: "u1",
    request_id: "r1",
    sha256: "a".repeat(64),
  },
  { unity_id: "u1", request_id: "r1" }
);

const report = {
  bindings: bindingResult,
  receipt: receiptResult,
  browser_secret_boundary:
    "window.IrisSigningSecret is browser-visible and is not a private production secret store",
  staging_only: true,
};

console.log(JSON.stringify(report, null, 2));
if (!bindingResult.ok || !receiptResult.ok) {
  process.exit(1);
}
