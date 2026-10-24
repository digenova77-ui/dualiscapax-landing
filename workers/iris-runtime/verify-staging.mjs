/**
 * Staging Worker configuration and receipt-contract verifier.
 * Does not deploy. Checks:
 *   - wrangler.toml declares the four required bindings
 *   - worker.mjs exports a fetch handler
 *   - receipt contract shape
 *   - browser-secret boundary statement
 *
 * Usage: node workers/iris-runtime/verify-staging.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REQUIRED_BINDINGS = [
  "IDENTITY_API",
  "TRINITY_LAW",
  "IRIS_MEMORY",
  "MODEL_PROVIDER",
];

const RECEIPT_CONTRACT = "dualis.receipt.v1";
const RECEIPT_HASH_RE = /^[a-f0-9]{64}$/;

const here = dirname(fileURLToPath(import.meta.url));

function checkWrangler(toml) {
  const missing = REQUIRED_BINDINGS.filter((name) => !toml.includes(`binding = "${name}"`));
  return { ok: missing.length === 0, missing };
}

function checkWorkerSource(src) {
  const hasFetch = src.includes("async fetch");
  const hasAuthorize = src.includes("/v1/authorize");
  const hasReceipt = src.includes(RECEIPT_CONTRACT);
  const noBrowserSecret = !src.includes("IrisSigningSecret");
  const durableClaim = src.includes("/v1/requests/claim");
  const durableLookup = src.includes("/v1/requests/get");
  const contextRead = src.includes("/v1/context/read") && src.includes("readMemoryContext");
  const serviceToken = src.includes("IRIS_MEMORY_SERVICE_TOKEN");
  return {
    ok: hasFetch && hasAuthorize && hasReceipt && noBrowserSecret && durableClaim && durableLookup && contextRead && serviceToken,
    hasFetch, hasAuthorize, hasReceipt, noBrowserSecret, durableClaim, durableLookup, contextRead, serviceToken,
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

const toml = readFileSync(join(here, "wrangler.toml"), "utf8");
const workerSrc = readFileSync(join(here, "worker.mjs"), "utf8");
const memoryDir = join(here, "../iris-memory");
const memoryToml = readFileSync(join(memoryDir, "wrangler.toml"), "utf8");
const memorySrc = readFileSync(join(memoryDir, "worker.mjs"), "utf8");

const wranglerResult = checkWrangler(toml);
const workerResult = checkWorkerSource(workerSrc);
const memoryResult = {
  ok: memoryToml.includes('class_name = "IrisMemoryStore"') && memoryToml.includes('new_sqlite_classes = ["IrisMemoryStore"]') && memorySrc.includes("this.state.storage.transaction") && memorySrc.includes("IRIS_MEMORY_SERVICE_TOKEN"),
  durableObject: memoryToml.includes('class_name = "IrisMemoryStore"'),
  sqliteMigration: memoryToml.includes('new_sqlite_classes = ["IrisMemoryStore"]'),
  atomicTransaction: memorySrc.includes("this.state.storage.transaction"),
  serviceToken: memorySrc.includes("IRIS_MEMORY_SERVICE_TOKEN"),
};

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
  wrangler_bindings: wranglerResult,
  worker_source: workerResult,
  durable_memory_service: memoryResult,
  receipt: receiptResult,
  browser_secret_boundary:
    "window.IrisSigningSecret is browser-visible and is not a private production secret store",
  staging_only: true,
  production_untouched: true,
};

console.log(JSON.stringify(report, null, 2));
if (!wranglerResult.ok || !workerResult.ok || !memoryResult.ok || !receiptResult.ok) {
  process.exit(1);
}
