import { buildPublicationReceipt, sha256Hex, verifyPublicationReceipt } from './publication-proof.mjs';

const CID_RE = /^(bafy[a-z2-7]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{44})$/;

/**
 * Adapter methods: put(bytes), get(cid), optional resolve(name), optional pin(cid, provider).
 * A real adapter should provide verifyCid(cid, bytes) using an actual CID/multihash implementation.
 * Without it, CID syntax is checked but content-address correctness is explicitly unproven.
 */
export async function publishAndVerify({ adapter, bytes, sourceRevision, ipnsName = null, providers = [] }) {
  if (!adapter || typeof adapter.put !== 'function' || typeof adapter.get !== 'function') {
    return { ok: false, stage: 'preflight', reason: 'adapter-contract-incomplete' };
  }
  if (!(bytes instanceof Uint8Array) || typeof sourceRevision !== 'string') {
    return { ok: false, stage: 'preflight', reason: 'invalid-input' };
  }
  if (!/^[a-f0-9]{40,64}$/i.test(sourceRevision)) {
    return { ok: false, stage: 'preflight', reason: 'invalid-source-revision' };
  }
  if (ipnsName !== null && (typeof adapter.resolve !== 'function' || typeof ipnsName !== 'string' || !ipnsName.trim())) {
    return { ok: false, stage: 'preflight', reason: 'ipns-resolver-unavailable-or-invalid-name' };
  }
  if (providers.length && typeof adapter.pin !== 'function') {
    return { ok: false, stage: 'preflight', reason: 'pin-adapter-unavailable' };
  }

  const original = Buffer.from(bytes);
  let cid;
  try { cid = await adapter.put(original); }
  catch { return { ok: false, stage: 'publish', reason: 'content-publication-failed' }; }
  if (typeof cid !== 'string' || !CID_RE.test(cid)) return { ok: false, stage: 'publish', reason: 'invalid-published-cid' };

  let cidVerified = false;
  if (typeof adapter.verifyCid === 'function') {
    try {
      cidVerified = await adapter.verifyCid(cid, original);
      if (cidVerified !== true) return { ok: false, stage: 'cid-verification', reason: 'cid-content-mismatch' };
    } catch {
      return { ok: false, stage: 'cid-verification', reason: 'cid-verification-error' };
    }
  }

  let resolvedCid = null;
  if (ipnsName !== null) {
    try { resolvedCid = await adapter.resolve(ipnsName); }
    catch { return { ok: false, stage: 'ipns-resolution', reason: 'ipns-resolution-failed' }; }
    if (resolvedCid !== cid) return { ok: false, stage: 'ipns-resolution', reason: 'ipns-resolution-mismatch' };
  }

  const pinResults = [];
  for (const provider of providers) {
    try {
      const result = await adapter.pin(cid, provider);
      pinResults.push(result === true ? { provider, ok: true } : { provider, ok: false, reason: 'pin-not-confirmed' });
    } catch {
      pinResults.push({ provider, ok: false, reason: 'provider-error' });
    }
  }

  let retrieved;
  try { retrieved = Buffer.from(await adapter.get(cid)); }
  catch { return { ok: false, stage: 'retrieval', reason: 'independent-retrieval-failed', cid, cidVerified, pinResults }; }

  let receipt;
  try {
    receipt = buildPublicationReceipt({
      sourceRevision,
      contentCid: cid,
      contentSha256: sha256Hex(original),
      byteLength: original.byteLength,
      ipnsName,
      resolvedCid,
    });
  } catch {
    return { ok: false, stage: 'receipt-build', reason: 'receipt-construction-failed', cid, cidVerified, pinResults };
  }
  const receiptVerification = verifyPublicationReceipt(receipt, retrieved);
  if (!receiptVerification.ok) return { ok: false, stage: 'receipt-verification', reason: receiptVerification.reason, cid, cidVerified, pinResults };

  return {
    ok: true,
    status: 'verified-content-integrity',
    cid,
    cidVerified,
    cidVerificationStatus: cidVerified ? 'verified-by-adapter' : 'not-proven-by-adapter',
    ipns: ipnsName === null ? { tested: false } : { tested: true, resolvedCid, ok: resolvedCid === cid },
    pinResults,
    pinCountConfirmed: pinResults.filter((item) => item.ok).length,
    pinCountFailed: pinResults.filter((item) => !item.ok).length,
    receipt,
    receiptVerification,
  };
}
