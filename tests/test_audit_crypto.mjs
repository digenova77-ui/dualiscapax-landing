import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const source = fs.readFileSync(new URL("../js/audit-crypto.js", import.meta.url), "utf8");
const pageSource = fs.readFileSync(new URL("../audit.html", import.meta.url), "utf8");

function harness({ crypto = webcrypto, failWrite = false, initial = null } = {}) {
  const store = new Map();
  if (initial !== null) store.set("dc_audit_chain_v1", JSON.stringify(initial));
  const localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) {
      if (failWrite) throw new Error("storage blocked");
      store.set(key, String(value));
    },
    removeItem(key) {
      if (failWrite) throw new Error("storage blocked");
      store.delete(key);
    },
  };
  const window = { crypto };
  const context = { window, localStorage, crypto, TextEncoder, Uint8Array };
  vm.runInNewContext(source, context, { filename: "js/audit-crypto.js" });
  return { api: window.DCAudit, store, localStorage };
}

test("canonical JSON recursively sorts object keys and preserves array order", () => {
  const h = harness();
  assert.equal(
    h.api.canonicalJson({ z: 1, a: { y: 2, b: 3 }, list: [{ z: 1, a: 2 }, 2] }),
    '{"a":{"b":3,"y":2},"list":[{"a":2,"z":1},2],"z":1}'
  );
});

test("new receipts bind nested payloads and verify the complete stored chain", async () => {
  const h = harness();
  const entry = await h.api.commit({ nested: { z: 1, a: 2 }, items: ["one", "two"] });
  assert.equal(entry.version, 2);
  assert.equal(entry.algo, "SHA-256");
  assert.match(entry.receipt, /^[a-f0-9]{64}$/);
  const result = await h.api.verifyChain();
  assert.equal(result.ok, true);
  assert.equal(result.complete, true);
  assert.equal(result.count, 1);
});

test("tampering with a nested payload invalidates its receipt", async () => {
  const h = harness();
  await h.api.commit({ nested: { value: "original" } });
  const chain = JSON.parse(h.store.get("dc_audit_chain_v1"));
  chain[0].payload.nested.value = "tampered";
  h.store.set("dc_audit_chain_v1", JSON.stringify(chain));
  const result = await h.api.verifyChain();
  assert.equal(result.ok, false);
  assert.equal(result.reason, "receipt-hash-mismatch");
  assert.equal(result.index, 0);
});

test("parent-link tampering invalidates the stored chain even when the tip payload is intact", async () => {
  const h = harness();
  await h.api.commit({ n: 1 });
  await h.api.commit({ n: 2 });
  const chain = JSON.parse(h.store.get("dc_audit_chain_v1"));
  chain[1].parent = "f".repeat(64);
  h.store.set("dc_audit_chain_v1", JSON.stringify(chain));
  const result = await h.api.verifyTip();
  assert.equal(result.ok, false);
  assert.equal(result.reason, "parent-link-mismatch");
  assert.equal(result.index, 1);
});

test("legacy v1 receipts are retained but not falsely treated as payload-bound", async () => {
  const legacy = [{ id: "old", at: "2026-01-01T00:00:00.000Z", session: null, parent: null, receipt: "a".repeat(64), payload: { text: "legacy" }, algo: "SHA-256" }];
  const h = harness({ initial: legacy });
  const result = await h.api.verifyChain();
  assert.equal(result.ok, false);
  assert.equal(result.reason, "legacy-receipt-format-unbound-payload");
});

test("cryptographic unavailability fails closed instead of creating a weak receipt", async () => {
  const h = harness({ crypto: null });
  await assert.rejects(() => h.api.commit({ value: "test" }), /crypto-unavailable/);
  assert.equal(h.api.chain().length, 0);
});

test("local-storage write failure prevents a receipt from being returned as committed", async () => {
  const h = harness({ failWrite: true });
  await assert.rejects(() => h.api.commit({ value: "test" }), /audit-storage-write-failed/);
});

test("retention cap reports a verified but truncated segment", async () => {
  const h = harness();
  for (let i = 0; i < 201; i++) await h.api.commit({ n: i });
  assert.equal(h.api.chain().length, 200);
  const result = await h.api.verifyChain();
  assert.equal(result.ok, true);
  assert.equal(result.complete, false);
  assert.equal(result.truncated, true);
  assert.equal(result.count, 200);
});

test("corrupt local storage is reported instead of silently verified as an empty chain", async () => {
  const h = harness();
  h.store.set("dc_audit_chain_v1", "{broken-json");
  const result = await h.api.verifyChain();
  assert.equal(result.ok, false);
  assert.equal(result.reason, "audit-storage-unreadable");
});

test("audit page does not render receipt content through innerHTML or accept a query API origin", () => {
  assert.doesNotMatch(pageSource, /list\.innerHTML|out\.innerHTML/);
  assert.doesNotMatch(pageSource, /URLSearchParams\(location\.search\)\.get\(['"]api['"]\)/);
  assert.match(pageSource, /input_sha256: inputHash/);
  assert.match(pageSource, /out\.textContent = 'Receipt not created/);
});


test("tampered existing chain blocks further commits instead of extending false history", async () => {
  const h = harness();
  await h.api.commit({ nested: { value: "original" } });
  const chain = JSON.parse(h.store.get("dc_audit_chain_v1"));
  chain[0].payload.nested.value = "tampered";
  h.store.set("dc_audit_chain_v1", JSON.stringify(chain));
  await assert.rejects(() => h.api.commit({ next: true }), /existing-audit-chain-invalid:receipt-hash-mismatch/);
});

test("legacy chain blocks new v2 commits until explicitly cleared", async () => {
  const legacy = [{ id: "old", at: "2026-01-01T00:00:00.000Z", session: null, parent: null, receipt: "a".repeat(64), payload: { text: "legacy" }, algo: "SHA-256" }];
  const h = harness({ initial: legacy });
  await assert.rejects(() => h.api.commit({ next: true }), /existing-audit-chain-invalid:legacy-receipt-format-unbound-payload/);
});
