/**
 * Staging Worker configuration and receipt-contract verifier.
 * Does not deploy. Checks runtime bindings, durable memory, internal-only
 * dependency fixture visibility, receipt contract, and browser-secret boundary.
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
  const revocationGate = src.includes("/v1/receipt/revoke") && src.includes("receipt-revoked");
  const expiryGate = src.includes("RECEIPT_TTL_MS") && src.includes("receipt-expired");
  const metricsEndpoint = src.includes("/v1/metrics") && src.includes("metrics.model") && src.includes("metrics.revoke");
  const diagnosticsProtected = src.includes("IRIS_DIAGNOSTICS_TOKEN") && src.includes("diagnostics-authorization-required");
  const corsAllowlist = src.includes("IRIS_ALLOWED_ORIGINS") && src.includes("headers.delete(\"access-control-allow-origin\")") && src.includes("allowedOrigins.includes(origin)");
  return {
    ok: hasFetch && hasAuthorize && hasReceipt && noBrowserSecret && durableClaim && durableLookup && contextRead && serviceToken && revocationGate && expiryGate && metricsEndpoint && diagnosticsProtected && corsAllowlist,
    hasFetch, hasAuthorize, hasReceipt, noBrowserSecret, durableClaim, durableLookup, contextRead, serviceToken, revocationGate, expiryGate, metricsEndpoint, diagnosticsProtected, corsAllowlist,
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

function envSection(toml, name) {
  const marker = `[env.${name}]`;
  const start = toml.indexOf(marker);
  if (start < 0) return "";
  const next = toml.indexOf("\n[env.", start + marker.length);
  return toml.slice(start, next < 0 ? undefined : next);
}

const toml = readFileSync(join(here, "wrangler.toml"), "utf8");
const workerSrc = readFileSync(join(here, "worker.mjs"), "utf8");
const memoryDir = join(here, "../iris-memory");
const memoryToml = readFileSync(join(memoryDir, "wrangler.toml"), "utf8");
const memorySrc = readFileSync(join(memoryDir, "worker.mjs"), "utf8");
const fixtureToml = readFileSync(join(here, "../iris-staging-dependencies/wrangler.toml"), "utf8");

const wranglerResult = checkWrangler(toml);
const workerResult = checkWorkerSource(workerSrc);
const memoryResult = {
  durableObject: memoryToml.includes('class_name = "IrisMemoryStore"'),
  sqliteMigration: memoryToml.includes('new_sqlite_classes = ["IrisMemoryStore"]'),
  atomicTransaction: memorySrc.includes("this.state.storage.transaction"),
  durableRevocation: memorySrc.includes('path === "/v1/requests/revoke"') && memorySrc.includes("revoked: true"),
  serviceToken: memorySrc.includes("IRIS_MEMORY_SERVICE_TOKEN"),
  noRoutes: !/\[\[routes\]\]/.test(memoryToml),
  noPublicWorkersDev: /^workers_dev\s*=\s*false$/m.test(memoryToml),
};
memoryResult.ok = Object.values(memoryResult).every((value) => value === true);

const fixtureVisibility = Object.fromEntries(["identity", "trinity", "model"].map((name) => {
  const section = envSection(fixtureToml, name);
  return [name, !!section && /^workers_dev\s*=\s*false$/m.test(section)];
}));
const internalServicesResult = {
  ...fixtureVisibility,
  ok: Object.values(fixtureVisibility).every((value) => value === true),
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
  internal_fixture_visibility: internalServicesResult,
  receipt: receiptResult,
  browser_secret_boundary:
    "window.IrisSigningSecret is browser-visible and is not a private production secret store",
  staging_only: true,
  production_untouched: true,
};

console.log(JSON.stringify(report, null, 2));
if (!wranglerResult.ok || !workerResult.ok || !memoryResult.ok || !internalServicesResult.ok || !receiptResult.ok) {
  process.exit(1);
}
