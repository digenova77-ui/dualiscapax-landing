import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { canonicalJson, verifyPublicationReceipt } from './publication-proof.mjs';

const SIGNATURE_ALGORITHM = 'Ed25519';
const SIGNATURE_PROTOCOL = 'dualis-publication-signature-v1';

function publicKeyBytes(key) {
  return createPublicKey(key).export({ format: 'der', type: 'spki' });
}

function keyIdFor(key) {
  return createHash('sha256').update(publicKeyBytes(key)).digest('hex');
}

function unsignedPayload(receipt) {
  const { signature, ...payload } = receipt;
  return payload;
}

export function signPublicationReceipt(receipt, privateKey, publicKey) {
  if (!receipt || typeof receipt !== 'object' || !privateKey || !publicKey) throw new TypeError('receipt-and-keypair-required');
  const privateKeyObject = createPrivateKey(privateKey);
  const publicKeyObject = createPublicKey(publicKey);
  if (privateKeyObject.asymmetricKeyType !== SIGNATURE_ALGORITHM.toLowerCase() || publicKeyObject.asymmetricKeyType !== SIGNATURE_ALGORITHM.toLowerCase()) {
    throw new TypeError('ed25519-keypair-required');
  }
  const derivedPublic = createPublicKey(privateKeyObject).export({ format: 'der', type: 'spki' });
  const suppliedPublic = publicKeyObject.export({ format: 'der', type: 'spki' });
  if (!Buffer.from(derivedPublic).equals(Buffer.from(suppliedPublic))) throw new TypeError('public-private-key-mismatch');
  const payload = unsignedPayload(receipt);
  const bytes = Buffer.from(canonicalJson({ protocol: SIGNATURE_PROTOCOL, receipt: payload }), 'utf8');
  const signature = sign(null, bytes, privateKeyObject).toString('base64');
  return {
    ...payload,
    signature: {
      protocol: SIGNATURE_PROTOCOL,
      algorithm: SIGNATURE_ALGORITHM,
      key_id: keyIdFor(publicKeyObject),
      value: signature,
    },
  };
}

export function verifySignedPublicationReceipt(signedReceipt, retrievedBytes, trustedPublicKey) {
  try {
    if (!signedReceipt || typeof signedReceipt !== 'object' || !signedReceipt.signature || !trustedPublicKey) return { ok: false, reason: 'signed-receipt-key-required' };
    const { signature, ...receipt } = signedReceipt;
    if (signature.protocol !== SIGNATURE_PROTOCOL || signature.algorithm !== SIGNATURE_ALGORITHM) return { ok: false, reason: 'unsupported-signature-protocol' };
    if (typeof signature.value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(signature.value)) return { ok: false, reason: 'invalid-signature-encoding' };
    const publicKey = createPublicKey(trustedPublicKey);
    if (publicKey.asymmetricKeyType !== SIGNATURE_ALGORITHM.toLowerCase()) return { ok: false, reason: 'trusted-ed25519-key-required' };
    if (signature.key_id !== keyIdFor(publicKey)) return { ok: false, reason: 'signing-key-id-mismatch' };
    const integrity = verifyPublicationReceipt(receipt, retrievedBytes);
    if (!integrity.ok) return integrity;
    const bytes = Buffer.from(canonicalJson({ protocol: SIGNATURE_PROTOCOL, receipt }), 'utf8');
    if (!verify(null, bytes, publicKey, Buffer.from(signature.value, 'base64'))) return { ok: false, reason: 'signature-verification-failed' };
    return { ok: true, reason: 'signed-receipt-verified', key_id: signature.key_id, receipt_sha256: integrity.receipt_sha256 };
  } catch {
    return { ok: false, reason: 'signature-verification-error' };
  }
}
