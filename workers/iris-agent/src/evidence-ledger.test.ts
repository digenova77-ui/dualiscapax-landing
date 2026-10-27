import { describe, expect, it } from "vitest";
import {
  digestLedgerRecord,
  validateEvidenceLedgerRecord,
  verifyDigestChain,
  type EvidenceLedgerRecord,
} from "./evidence-ledger";

const baseRecord = (): EvidenceLedgerRecord => ({
  schemaVersion: "iris-evidence-v1",
  taskId: "task-demo-001",
  createdAt: "2026-10-27T12:00:00.000Z",
  updatedAt: "2026-10-27T12:00:00.000Z",
  goal: "Validate a synthetic planning task",
  pillarIds: ["research-engineering-architecture"],
  status: "SCAFFOLDED",
  proposedSteps: ["Run isolated tests"],
  evidence: [],
  changes: [],
  verification: [],
  limitations: ["Synthetic test record only"],
  previousRecordDigest: null,
});

describe("Iris evidence ledger record validation", () => {
  it("accepts a well-formed scaffolded record without claiming verification", () => {
    expect(validateEvidenceLedgerRecord(baseRecord())).toBe(true);
  });

  it("rejects unknown statuses and invalid pillar identifiers", () => {
    expect(validateEvidenceLedgerRecord({ ...baseRecord(), status: "DONE" })).toBe(false);
    expect(validateEvidenceLedgerRecord({ ...baseRecord(), pillarIds: ["unregistered-pillar"] })).toBe(false);
  });

  it("rejects promotion to local-verified without revision-bound passing evidence", () => {
    expect(validateEvidenceLedgerRecord({ ...baseRecord(), status: "LOCAL-VERIFIED" })).toBe(false);
    const record = baseRecord();
    record.status = "LOCAL-VERIFIED";
    record.verification = [{
      name: "unit tests",
      revisionSha: "a".repeat(40),
      outcome: "PASS",
      source: "CI run #1",
    }];
    record.evidence = [{
      source: "test artifact",
      observedAt: "2026-10-27T12:00:00.000Z",
      outcome: "PASS",
      sha256: "b".repeat(64),
    }];
    expect(validateEvidenceLedgerRecord(record)).toBe(true);
  });

  it("rejects staging status without evidence bound to an exact commit", () => {
    const record = baseRecord();
    record.status = "STAGING-VERIFIED";
    record.verification = [{
      name: "staging check",
      revisionSha: "a".repeat(40),
      outcome: "PASS",
      source: "workflow run",
    }];
    record.evidence = [{
      source: "staging response",
      observedAt: "2026-10-27T12:00:00.000Z",
      outcome: "PASS",
      sha256: "b".repeat(64),
    }];
    expect(validateEvidenceLedgerRecord(record)).toBe(false);
  });

  it("rejects bearer tokens and private-key material in text fields", () => {
    expect(validateEvidenceLedgerRecord({ ...baseRecord(), goal: "Bearer abcdef123456" })).toBe(false);
    expect(validateEvidenceLedgerRecord({ ...baseRecord(), limitations: ["-----BEGIN PRIVATE KEY-----"] })).toBe(false);
  });
});

describe("Iris evidence ledger digest chain", () => {
  it("validates an empty chain and a single record digest", async () => {
    expect(await verifyDigestChain([])).toBe(true);
    const record = baseRecord();
    const digest = await digestLedgerRecord(record);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(await verifyDigestChain([{ record, digest }])).toBe(true);
  });

  it("detects modified content and broken previous-digest links", async () => {
    const first = baseRecord();
    const firstDigest = await digestLedgerRecord(first);
    const second = { ...baseRecord(), taskId: "task-demo-002", previousRecordDigest: firstDigest };
    const secondDigest = await digestLedgerRecord(second);
    expect(await verifyDigestChain([
      { record: first, digest: firstDigest },
      { record: second, digest: secondDigest },
    ])).toBe(true);
    expect(await verifyDigestChain([
      { record: first, digest: firstDigest },
      { record: { ...second, goal: "tampered" }, digest: secondDigest },
    ])).toBe(false);
    expect(await verifyDigestChain([
      { record: first, digest: firstDigest },
      { record: { ...second, previousRecordDigest: "c".repeat(64) }, digest: secondDigest },
    ])).toBe(false);
  });
});
