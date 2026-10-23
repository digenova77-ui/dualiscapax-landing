import { execFileSync } from 'node:child_process';
import { buildPublicationReceipt, sha256Hex, verifyPublicationReceipt } from './publication-proof.mjs';

const CID_RE = /^(bafy[a-z2-7]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{44})$/;
export const TEST_FIXTURE = Buffer.from('{"protocol":"dualis-publication-test-v1","purpose":"non-production-verification","value":1}\n', 'utf8');

export async function runPinataTestPublication({ jwt, fetchImpl = fetch, sourceRevision, bytes = TEST_FIXTURE, apiUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS', gatewayBase = 'https://gateway.pinata.cloud/ipfs' }) {
  if (typeof jwt !== 'string' || !jwt.trim()) return { ok: false, stage: 'preflight', reason: 'missing-pinata-jwt' };
  if (typeof sourceRevision !== 'string' || !/^[a-f0-9]{40,64}$/i.test(sourceRevision)) return { ok: false, stage: 'preflight', reason: 'invalid-source-revision' };
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > 65536) return { ok: false, stage: 'preflight', reason: 'invalid-or-oversized-test-fixture' };
  if (typeof fetchImpl !== 'function') return { ok: false, stage: 'preflight', reason: 'fetch-unavailable' };

  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'application/json' }), 'dualis-publication-test-fixture.json');
  form.append('pinataMetadata', JSON.stringify({ name: 'dualis-publication-test-fixture', keyvalues: { environment: 'test-only', protocol: 'dualis-publication-test-v1' } }));
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  let uploadResponse;
  try { uploadResponse = await fetchImpl(apiUrl, { method: 'POST', headers: { Authorization: `Bearer ${jwt}` }, body: form }); }
  catch { return { ok: false, stage: 'publish', reason: 'pinata-upload-request-failed' }; }
  if (!uploadResponse?.ok) return { ok: false, stage: 'publish', reason: 'pinata-upload-rejected', httpStatus: uploadResponse?.status ?? null };

  let uploadJson;
  try { uploadJson = await uploadResponse.json(); }
  catch { return { ok: false, stage: 'publish', reason: 'pinata-response-not-json' }; }
  const cid = uploadJson?.IpfsHash;
  if (typeof cid !== 'string' || !CID_RE.test(cid)) return { ok: false, stage: 'publish', reason: 'pinata-returned-invalid-cid' };

  let retrieved;
  try {
    const response = await fetchImpl(`${gatewayBase}/${encodeURIComponent(cid)}`, { method: 'GET', headers: { Accept: 'application/octet-stream' } });
    if (!response?.ok) return { ok: false, stage: 'retrieval', reason: 'gateway-retrieval-rejected', httpStatus: response?.status ?? null, cid };
    retrieved = Buffer.from(await response.arrayBuffer());
  } catch { return { ok: false, stage: 'retrieval', reason: 'gateway-retrieval-failed', cid }; }

  const receipt = buildPublicationReceipt({ sourceRevision, contentCid: cid, contentSha256: sha256Hex(bytes), byteLength: bytes.byteLength });
  const verification = verifyPublicationReceipt(receipt, retrieved);
  if (!verification.ok) return { ok: false, stage: 'receipt-verification', reason: verification.reason, cid };
  return {
    ok: true,
    status: 'test-fixture-uploaded-and-gateway-bytes-verified',
    cid,
    byteLength: bytes.byteLength,
    contentSha256: sha256Hex(bytes),
    receipt,
    verification,
    cidMultihashVerified: false,
    note: 'The retrieved bytes match the fixture. This script does not independently recompute the IPFS CID multihash or prove independent-provider availability.',
  };
}

async function main() {
  if (!process.argv.includes('--publish-test-fixture')) {
    process.stdout.write(JSON.stringify({
      mode: 'dry-run',
      wouldPublish: 'one fixed, harmless JSON test fixture only',
      noNetworkCalls: true,
      nextStep: 'Set PINATA_JWT and pass --publish-test-fixture to explicitly publish the test fixture.',
    }, null, 2) + '\n');
    return;
  }
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    const result = await runPinataTestPublication({ jwt, sourceRevision: '' });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exitCode = 1;
    return;
  }
  let sourceRevision = process.env.GITHUB_SHA || process.env.SOURCE_REVISION;
  if (!sourceRevision) {
    try { sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
    catch { sourceRevision = ''; }
  }
  const result = await runPinataTestPublication({ jwt, sourceRevision });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch(() => {
    process.stderr.write('publication-test-failed\n');
    process.exitCode = 1;
  });
}
