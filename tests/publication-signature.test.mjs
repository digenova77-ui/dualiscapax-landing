import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { buildPublicationReceipt, sha256Hex } from '../scripts/publication-proof.mjs';
import { signPublicationReceipt, verifySignedPublicationReceipt } from '../scripts/publication-signature.mjs';

const bytes = Buffer.from('{"protocol":"dualis-signed-test-v1","value":9}\n');
const baseReceipt = () => buildPublicationReceipt({
  sourceRevision: 'de4dce47f133c28f42e501792ef289fd4485eb75',
  contentCid: 'bafybeigdyrzt5sfp7udm7hu76uhh4l2l4z2v7f5b4k6m5g3r2q7s6t5u4a',
  contentSha256: sha256Hex(bytes),
  byteLength: bytes.length,
});
const keypair = () => generateKeyPairSync('ed25519');

test('Ed25519 signature binds receipt and verifies exact content', () => {
  const keys = keypair();
  const signed = signPublicationReceipt(baseReceipt(), keys.privateKey, keys.publicKey);
  const result = verifySignedPublicationReceipt(signed, bytes, keys.publicKey);
  assert.equal(result.ok, true);
  assert.equal(result.reason, 'signed-receipt-verified');
});

test('tampered receipt data fails signature or integrity verification', () => {
  const keys = keypair();
  const signed = signPublicationReceipt(baseReceipt(), keys.privateKey, keys.publicKey);
  const tampered = { ...signed, source_revision: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
  assert.notEqual(verifySignedPublicationReceipt(tampered, bytes, keys.publicKey).ok, true);
});

test('wrong trusted key is rejected', () => {
  const signer = keypair();
  const other = keypair();
  const signed = signPublicationReceipt(baseReceipt(), signer.privateKey, signer.publicKey);
  assert.equal(verifySignedPublicationReceipt(signed, bytes, other.publicKey).reason, 'signing-key-id-mismatch');
});

test('private and public key mismatch is rejected before signing', () => {
  const a = keypair();
  const b = keypair();
  assert.throws(() => signPublicationReceipt(baseReceipt(), a.privateKey, b.publicKey), /public-private-key-mismatch/);
});

test('unsigned receipt cannot pass signed verification', () => {
  const keys = keypair();
  assert.equal(verifySignedPublicationReceipt(baseReceipt(), bytes, keys.publicKey).reason, 'signed-receipt-key-required');
});

test('signature verification rejects altered retrieved bytes', () => {
  const keys = keypair();
  const signed = signPublicationReceipt(baseReceipt(), keys.privateKey, keys.publicKey);
  const changed = Buffer.from(bytes); changed[0] ^= 1;
  assert.equal(verifySignedPublicationReceipt(signed, changed, keys.publicKey).ok, false);
});
