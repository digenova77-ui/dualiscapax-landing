export const EVIDENCE_STATUSES = [
  "IDEA",
  "SCAFFOLDED",
  "LOCAL-VERIFIED",
  "STAGING-VERIFIED",
  "PRODUCTION-DEPLOYED",
  "LIVE-VERIFIED",
  "BLOCKED/DRIFTED",
] as const;

export type EvidenceStatus = typeof EVIDENCE_STATUSES[number];

export type LedgerEvidence = {
  source: string;
  observedAt: string;
  outcome: "PASS" | "FAIL" | "SKIPPED" | "OBSERVED";
  sha256: string;
  revisionSha?: string;
};

export type LedgerVerification = {
  name: string;
  revisionSha: string;
  outcome: "PASS" | "FAIL" | "SKIPPED";
  source: string;
};

export type EvidenceLedgerRecord = {
  schemaVersion: "iris-evidence-v1";
  taskId: string;
  createdAt: string;
  updatedAt: string;
  goal: string;
  pillarIds: string[];
  status: EvidenceStatus;
  proposedSteps: string[];
  evidence: LedgerEvidence[];
  changes: Array<{ repository: string; branch: string; commitSha: string; paths: string[] }>;
  verification: LedgerVerification[];
  limitations: string[];
  previousRecordDigest: string | null;
};

const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT_SHA = /^[a-f0-9]{40}$/i;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const PILLARS = new Set([
  "residual-law-finance",
  "hybrid-bicameral-ai",
  "edge-frontier-intelligence",
  "research-engineering-architecture",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isUtc(value: unknown): value is string {
  return typeof value === "string" && ISO_UTC.test(value) && Number.isFinite(Date.parse(value));
}

function isSafeText(value: unknown, max = 2000): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max &&
    !/(bearer\s+[a-z0-9._~+/-]+=*|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/i.test(value);
}

export function validateEvidenceLedgerRecord(value: unknown): value is EvidenceLedgerRecord {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== "iris-evidence-v1" ||
      !isSafeText(value.taskId, 128) ||
      !isUtc(value.createdAt) || !isUtc(value.updatedAt) ||
      Date.parse(value.updatedAt) < Date.parse(value.createdAt) ||
      !isSafeText(value.goal, 1000) ||
      !Array.isArray(value.pillarIds) || value.pillarIds.length < 1 ||
      !value.pillarIds.every((p) => typeof p === "string" && PILLARS.has(p)) ||
      !Array.isArray(value.proposedSteps) || !value.proposedSteps.every((s) => isSafeText(s, 1000)) ||
      !Array.isArray(value.evidence) || !Array.isArray(value.changes) ||
      !Array.isArray(value.verification) || !Array.isArray(value.limitations) ||
      !value.limitations.every((s) => isSafeText(s, 1000)) ||
      !(value.previousRecordDigest === null || (typeof value.previousRecordDigest === "string" && SHA256.test(value.previousRecordDigest))) ||
      !EVIDENCE_STATUSES.includes(value.status as EvidenceStatus)) return false;

  if (!value.evidence.every((entry) => isRecord(entry) &&
    isSafeText(entry.source, 2000) && isUtc(entry.observedAt) &&
    ["PASS", "FAIL", "SKIPPED", "OBSERVED"].includes(String(entry.outcome)) &&
    typeof entry.sha256 === "string" && SHA256.test(entry.sha256) &&
    (entry.revisionSha === undefined || (typeof entry.revisionSha === "string" && COMMIT_SHA.test(entry.revisionSha))))) return false;

  if (!value.changes.every((change) => isRecord(change) &&
    isSafeText(change.repository, 200) && isSafeText(change.branch, 200) &&
    typeof change.commitSha === "string" && COMMIT_SHA.test(change.commitSha) &&
    Array.isArray(change.paths) && change.paths.every((p) => isSafeText(p, 500)))) return false;

  if (!value.verification.every((check) => isRecord(check) &&
    isSafeText(check.name, 200) && typeof check.revisionSha === "string" &&
    COMMIT_SHA.test(check.revisionSha) && isSafeText(check.source, 2000) &&
    ["PASS", "FAIL", "SKIPPED"].includes(String(check.outcome)))) return false;

  // Higher states require actual successful evidence, bound to the exact revision.
  if (["LOCAL-VERIFIED", "STAGING-VERIFIED", "PRODUCTION-DEPLOYED", "LIVE-VERIFIED"].includes(String(value.status))) {
    const successfulChecks = value.verification.filter((check) => isRecord(check) && check.outcome === "PASS");
    if (successfulChecks.length === 0 || successfulChecks.some((check) =>
      typeof check.revisionSha !== "string" || !COMMIT_SHA.test(check.revisionSha))) return false;
    const passingEvidence = value.evidence.filter((entry) => isRecord(entry) && entry.outcome === "PASS" &&
      typeof entry.source === "string" && typeof entry.sha256 === "string" && SHA256.test(entry.sha256));
    if (passingEvidence.length === 0) return false;
    // The verification result and its supporting evidence must name the same immutable revision.
    if (!successfulChecks.every((check) => passingEvidence.some((entry) =>
      isRecord(check) && isRecord(entry) &&
      typeof check.revisionSha === "string" &&
      typeof entry.revisionSha === "string" &&
      check.revisionSha.toLowerCase() === entry.revisionSha.toLowerCase()))) return false;
  }
  const revisionBoundPass = (pattern?: RegExp) => value.evidence.some((entry) =>
    isRecord(entry) && entry.outcome === "PASS" &&
    typeof entry.source === "string" && (!pattern || pattern.test(entry.source)) &&
    typeof entry.revisionSha === "string" && COMMIT_SHA.test(entry.revisionSha) &&
    value.verification.some((check) => isRecord(check) && check.outcome === "PASS" &&
      typeof check.revisionSha === "string" &&
      check.revisionSha.toLowerCase() === entry.revisionSha.toLowerCase()));

  if (["STAGING-VERIFIED", "PRODUCTION-DEPLOYED", "LIVE-VERIFIED"].includes(String(value.status))) {
    if (!revisionBoundPass()) return false;
  }
  if (["PRODUCTION-DEPLOYED", "LIVE-VERIFIED"].includes(String(value.status))) {
    if (!revisionBoundPass(/deployment|deploy/i)) return false;
  }
  if (value.status === "LIVE-VERIFIED" && !revisionBoundPass(/live|post-deploy|health/i)) return false;
  return true;
}

export async function digestLedgerRecord(record: EvidenceLedgerRecord): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(record));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyDigestChain(
  records: Array<{ record: EvidenceLedgerRecord; digest: string }>,
): Promise<boolean> {
  let previous: string | null = null;
  for (const item of records) {
    if (!validateEvidenceLedgerRecord(item.record) || !SHA256.test(item.digest)) return false;
    if (item.record.previousRecordDigest !== previous) return false;
    if (await digestLedgerRecord(item.record) !== item.digest) return false;
    previous = item.digest;
  }
  return true;
}
