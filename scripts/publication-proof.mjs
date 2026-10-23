import { createHash } from 'node:crypto';

const SHA256_RE = /^[a-f0-9]{64}$/;
const CID_RE = /^(bafy[a-z2-7]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{44})$/;

export function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function canonicalJson(value) {
  function normalize(v) {
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) throw new TypeError('non-finite-number');
      return v;
    }
    if (Array.isArray(v)) return v.map(normalize);
    if (typeof v === 'object') {
      const out = Object.create(null);
      for (const key of Object.keys(v).sort()) {
        if (v[key] === undefined) throw new TypeError('undefined-value');
        out[key] = normalize(v[key]);
      }
      return out;
    }
    throw new TypeError('unsupported-json-value');
  }
  return JSON.stringify(normalize(value));
}

export function buildPublicationReceipt({ sourceRevision, contentCid, contentSha256, byteLength, ipnsName = null, resolvedCid = null }) {
  if (typeof sourceRevision !== 'string' || !/^[a-f0-9]{40,64}$/i.test(sourceRevision)) throw new TypeError('invalid-source-revision');
  if (typeof contentCid !== 'string' || !CID_RE.test(contentCid)) throw new TypeError('invalid-content-cid');
  if (typeof contentSha256 !== 'string' || !SHA256_RE.test(contentSha256)) throw new TypeError('invalid-content-sha256');
  if (!Number.isSafeInteger(byteLength) || byteLength < 0) throw new TypeError('invalid-byte-length');
  if ((ipnsName === null) !== (resolvedCid === null)) throw new TypeError('ipns-name-and-resolved-cid-must-be-paired');
  if (ipnsName !== null && (typeof ipnsName !== 'string' || !ipnsName.trim())) throw new TypeError('invalid-ipns-name');
  if (resolvedCid !== null && (typeof resolvedCid !== 'string' || !CID_RE.test(resolvedCid))) throw new TypeError('invalid-resolved-cid');
  if (resolvedCid !== null && resolvedCid !== contentCid) throw new TypeError('ipns-resolution-mismatch');

  const body = {
    protocol: 'dualis-publication-receipt-v1',
    source_revision: sourceRevision.toLowerCase(),
    content_cid: contentCid,
    content_sha256: contentSha256,
    byte_length: byteLength,
    ipns_name: ipnsName,
    resolved_cid: resolvedCid,
  };
  return { ...body, receipt_sha256: sha256Hex(Buffer.from(canonicalJson(body), 'utf8')) };
}

export function verifyPublicationReceipt(receipt, retrievedBytes) {
  try {
    if (!receipt || typeof receipt !== 'object' || (!(Buffer.isBuffer(retrievedBytes)) && !(retrievedBytes instanceof Uint8Array))) return { ok: false, reason: 'invalid-input' };
    const allowed = new Set(['protocol', 'source_revision', 'content_cid', 'content_sha256', 'byte_length', 'ipns_name', 'resolved_cid', 'receipt_sha256']);
    if (Object.keys(receipt).length !== allowed.size || Object.keys(receipt).some((key) => !allowed.has(key))) return { ok: false, reason: 'invalid-receipt-shape' };
    const { receipt_sha256, ...body } = receipt;
    if (typeof receipt_sha256 !== 'string' || !SHA256_RE.test(receipt_sha256)) return { ok: false, reason: 'invalid-receipt-hash' };
    const rebuilt = buildPublicationReceipt({
      sourceRevision: body.source_revision,
      contentCid: body.content_cid,
      contentSha256: body.content_sha256,
      byteLength: body.byte_length,
      ipnsName: body.ipns_name,
      resolvedCid: body.resolved_cid,
    });
    if (rebuilt.receipt_sha256 !== receipt_sha256) return { ok: false, reason: 'receipt-hash-mismatch' };
    if (retrievedBytes.byteLength !== body.byte_length) return { ok: false, reason: 'byte-length-mismatch' };
    if (sha256Hex(retrievedBytes) !== body.content_sha256) return { ok: false, reason: 'content-hash-mismatch' };
    return { ok: true, reason: 'verified', receipt_sha256 };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'verification-error' };
  }
}
