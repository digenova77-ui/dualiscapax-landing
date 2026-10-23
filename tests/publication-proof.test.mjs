import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicationReceipt, canonicalJson, sha256Hex, verifyPublicationReceipt } from '../scripts/publication-proof.mjs';

const content = Buffer.from('{"state":"test","version":1}', 'utf8');
const cid = 'bafybeigdyrzt5sfp7udm7hu76uhh4l2l4z2v7f5b4k6m5g3r2q7s6t5u4a';
const base = { sourceRevision: 'de4dce47f133c28f42e501792ef289fd4485eb75', contentCid: cid, contentSha256: sha256Hex(content), byteLength: content.length };

test('canonical JSON recursively sorts keys and preserves array order', () => {
  assert.equal(canonicalJson({ z: 1, a: { y: 2, b: 3 }, arr: [2, 1] }), '{"a":{"b":3,"y":2},"arr":[2,1],"z":1}');
});

test('receipt verifies exact retrieved bytes', () => {
  const receipt = buildPublicationReceipt(base);
  assert.deepEqual(verifyPublicationReceipt(receipt, content), { ok: true, reason: 'verified', receipt_sha256: receipt.receipt_sha256 });
});

test('altered content is rejected', () => {
  const receipt = buildPublicationReceipt(base);
  const changed = Buffer.from(content);
  changed[0] ^= 1;
  assert.equal(verifyPublicationReceipt(receipt, changed).reason, 'content-hash-mismatch');
});

test('altered receipt fields are rejected', () => {
  const receipt = { ...buildPublicationReceipt(base), source_revision: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
  assert.equal(verifyPublicationReceipt(receipt, content).reason, 'receipt-hash-mismatch');
});

test('tampered protocol identifier is rejected even if checksum is unchanged', () => {
  const receipt = { ...buildPublicationReceipt(base), protocol: 'attacker-selected-protocol' };
  assert.equal(verifyPublicationReceipt(receipt, content).reason, 'unsupported-receipt-protocol');
});

test('noncanonical uppercase source revision is rejected', () => {
  const receipt = { ...buildPublicationReceipt(base), source_revision: base.sourceRevision.toUpperCase() };
  assert.equal(verifyPublicationReceipt(receipt, content).reason, 'noncanonical-source-revision');
});

test('IPNS resolved CID must match content CID', () => {
  assert.throws(() => buildPublicationReceipt({ ...base, ipnsName: 'test-only-key', resolvedCid: 'bafybbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }), /ipns-resolution-mismatch/);
});

test('invalid length, hash and unsupported JSON values fail closed', () => {
  assert.throws(() => buildPublicationReceipt({ ...base, byteLength: -1 }), /invalid-byte-length/);
  assert.throws(() => buildPublicationReceipt({ ...base, contentSha256: 'nope' }), /invalid-content-sha256/);
  assert.throws(() => canonicalJson({ bad: undefined }), /undefined-value/);
});

test('hostile object keys do not pollute object prototypes', () => {
  const value = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"x":1}}}');
  assert.equal(canonicalJson(value), '{"__proto__":{"polluted":true},"constructor":{"prototype":{"x":1}}}');
  assert.equal({}.polluted, undefined);
});

test('uncommitted extension fields are rejected', () => {
  const receipt = { ...buildPublicationReceipt(base), extra: 'uncommitted' };
  assert.equal(verifyPublicationReceipt(receipt, content).reason, 'invalid-receipt-shape');
});

test('1,000 seeded key-order permutations produce identical canonical JSON', () => {
  const keys = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta'];
  const expected = canonicalJson(Object.fromEntries(keys.map((key, i) => [key, { index: i, nested: { z: i + 1, a: i } }])));
  let seed = 0x5eed1234;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 0x100000000; };
  for (let run = 0; run < 1000; run++) {
    const shuffled = [...keys].sort(() => random() - 0.5);
    const value = {};
    for (const key of shuffled) {
      const i = keys.indexOf(key);
      value[key] = Object.fromEntries(Object.entries({ index: i, nested: { z: i + 1, a: i } }).reverse());
    }
    assert.equal(canonicalJson(value), expected, `permutation ${run}`);
  }
});
