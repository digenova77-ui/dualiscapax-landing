import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';

const API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const GATEWAY_BASE = 'https://gateway.pinata.cloud/ipfs';
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const CID_RE = /^(bafy[a-z2-7]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{44})$/;
const WEB_EXT = new Set(['.html','.htm','.css','.js','.mjs','.json','.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.woff','.woff2','.ttf','.otf','.webmanifest','.xml','.wasm','.glb','.gltf','.bin']);
const FULL_EXTRA_EXT = new Set(['.md','.txt','.pdf','.csv']);
const DENIED_DIRS = new Set(['.git','.github','.vscode','node_modules','tests','scripts','workers','server','iris-voice-standalone','planckos','dualiscapax_remote_core','FACTORY_BULLETIN_BOARD','factory','tools']);
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bsk-proj-[A-Za-z0-9_-]{20,}\b/,
  /\bxai-[A-Za-z0-9_-]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
];

export const sha256Hex = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function isPublicSitePath(filePath, { full = false } = {}) {
  if (typeof filePath !== 'string' || !filePath || filePath.includes('\\') || filePath.startsWith('/') || filePath.split('/').some(part => !part || part === '.' || part === '..')) return false;
  const parts = filePath.split('/');
  if (parts.some(part => part.startsWith('.') && part !== '.well-known')) return false;
  if (parts.some(part => DENIED_DIRS.has(part))) return false;
  if (parts[0] === '.well-known' && filePath !== '.well-known/security.txt') return false;
  const name = parts.at(-1);
  if (/^\.env$/i.test(name) || /(?:secret|credentials?|private[-_.]?key|token|backup|\.bak)/i.test(name)) return false;
  const ext = path.posix.extname(name).toLowerCase();
  return WEB_EXT.has(ext) || (full && FULL_EXTRA_EXT.has(ext));
}

export function findSecretMaterial(bytes) {
  const text = Buffer.from(bytes).toString('utf8');
  return SECRET_PATTERNS.some(pattern => pattern.test(text));
}

export function collectPublicManifest(paths, readFile, { full = false } = {}) {
  const files = [];
  let totalBytes = 0;
  for (const filePath of [...new Set(paths)].sort()) {
    if (!isPublicSitePath(filePath, { full })) continue;
    const bytes = Buffer.from(readFile(filePath));
    if (bytes.length > MAX_FILE_BYTES) throw new Error('public-file-too-large:' + filePath);
    if (findSecretMaterial(bytes)) throw new Error('possible-secret-material:' + filePath);
    totalBytes += bytes.length;
    if (totalBytes > MAX_TOTAL_BYTES) throw new Error('public-tree-too-large');
    files.push({ path: filePath, bytes, byteLength: bytes.length, sha256: sha256Hex(bytes) });
  }
  if (!files.some(file => file.path === 'index.html')) throw new Error('public-root-index-missing');
  return {
    schema: 'dualis-public-site-manifest-v1',
    mode: full ? 'full-public-static' : 'public-site',
    fileCount: files.length,
    totalBytes,
    files: files.map(({ path, byteLength, sha256 }) => ({ path, byteLength, sha256 })),
    _files: files,
  };
}

export async function runPinataDirectoryPublication({ jwt, files, fetchImpl = fetch, sourceRevision, apiUrl = API_URL, gatewayBase = GATEWAY_BASE }) {
  if (typeof jwt !== 'string' || !jwt.trim()) return { ok: false, stage: 'preflight', reason: 'missing-pinata-jwt' };
  if (typeof sourceRevision !== 'string' || !/^[a-f0-9]{40,64}$/i.test(sourceRevision)) return { ok: false, stage: 'preflight', reason: 'invalid-source-revision' };
  if (!Array.isArray(files) || files.length === 0) return { ok: false, stage: 'preflight', reason: 'empty-public-manifest' };
  let totalBytes = 0;
  for (const file of files) {
    if (!file || !isPublicSitePath(file.path, { full: true }) || !(file.bytes instanceof Uint8Array)) return { ok: false, stage: 'preflight', reason: 'invalid-public-file-entry' };
    if (file.bytes.byteLength > MAX_FILE_BYTES || findSecretMaterial(file.bytes)) return { ok: false, stage: 'preflight', reason: 'unsafe-or-oversized-public-file' };
    totalBytes += file.bytes.byteLength;
    if (totalBytes > MAX_TOTAL_BYTES) return { ok: false, stage: 'preflight', reason: 'public-tree-too-large' };
  }
  if (!files.some(file => file.path === 'index.html')) return { ok: false, stage: 'preflight', reason: 'public-root-index-missing' };
  if (typeof fetchImpl !== 'function') return { ok: false, stage: 'preflight', reason: 'fetch-unavailable' };

  const form = new FormData();
  for (const file of files) {
    const name = file.path.split('/').map(encodeURIComponent).join('/');
    form.append('file', new Blob([file.bytes]), name);
  }
  form.append('pinataMetadata', JSON.stringify({
    name: 'dualis-public-site-' + sourceRevision.slice(0, 12),
    keyvalues: { protocol: 'dualis-public-site-manifest-v1', source_revision: sourceRevision, environment: 'public-static-site' },
  }));
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1, wrapWithDirectory: true }));

  let uploadResponse;
  try { uploadResponse = await fetchImpl(apiUrl, { method: 'POST', headers: { Authorization: 'Bearer ' + jwt }, body: form }); }
  catch { return { ok: false, stage: 'publish', reason: 'pinata-upload-request-failed' }; }
  if (!uploadResponse?.ok) return { ok: false, stage: 'publish', reason: 'pinata-upload-rejected', httpStatus: uploadResponse?.status ?? null };
  let uploadJson;
  try { uploadJson = await uploadResponse.json(); }
  catch { return { ok: false, stage: 'publish', reason: 'pinata-response-not-json' }; }
  const cid = uploadJson?.IpfsHash;
  if (typeof cid !== 'string' || !CID_RE.test(cid)) return { ok: false, stage: 'publish', reason: 'pinata-returned-invalid-cid' };

  const verified = [];
  const failed = [];
  for (const file of files) {
    const encodedPath = file.path.split('/').map(encodeURIComponent).join('/');
    try {
      const response = await fetchImpl(gatewayBase + '/' + cid + '/' + encodedPath, { method: 'GET', headers: { Accept: 'application/octet-stream' } });
      if (!response?.ok) {
        failed.push({ path: file.path, reason: 'gateway-retrieval-rejected', httpStatus: response?.status ?? null });
        continue;
      }
      const retrieved = Buffer.from(await response.arrayBuffer());
      if (retrieved.byteLength !== file.byteLength || sha256Hex(retrieved) !== sha256Hex(file.bytes)) {
        failed.push({ path: file.path, reason: 'content-integrity-mismatch' });
        continue;
      }
      verified.push({ path: file.path, byteLength: retrieved.byteLength, sha256: sha256Hex(retrieved) });
    } catch {
      failed.push({ path: file.path, reason: 'gateway-retrieval-failed' });
    }
  }
  return {
    ok: failed.length === 0 && verified.length === files.length,
    stage: failed.length ? 'verification' : 'complete',
    status: failed.length ? 'publication-not-fully-verified' : 'all-public-files-retrieved-and-byte-verified',
    sourceRevision,
    cid,
    fileCount: files.length,
    totalBytes,
    verifiedCount: verified.length,
    failedCount: failed.length,
    failed: failed.slice(0, 50),
    contentAddressVerification: 'not-independently-proven',
    note: 'Every listed path was retrieved from the returned directory CID and compared byte-for-byte. This does not independently recompute the UnixFS directory CID multihash or prove availability from a second provider.',
  };
}

function gitTrackedPaths() {
  return execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
}

function main() {
  const args = new Set(process.argv.slice(2));
  const publish = args.has('--pin');
  const full = args.has('--full');
  const paths = gitTrackedPaths();
  const manifest = collectPublicManifest(paths, filePath => {
    const absolute = path.resolve(process.cwd(), filePath);
    if (!absolute.startsWith(process.cwd() + path.sep) || !existsSync(absolute) || !lstatSync(absolute).isFile()) throw new Error('unsafe-public-path:' + filePath);
    return readFileSync(absolute);
  }, { full });
  const summary = { mode: publish ? 'publish' : 'dry-run', manifest: { ...manifest, _files: undefined } };
  if (!publish) {
    process.stdout.write(JSON.stringify({ ...summary, noNetworkCalls: true, nextStep: 'Use --pin only for an explicitly authorized Pinata publication.' }, null, 2) + '\n');
    return;
  }
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    process.stdout.write(JSON.stringify({ ok: false, stage: 'preflight', reason: 'missing-pinata-jwt', noNetworkCalls: true }, null, 2) + '\n');
    process.exitCode = 1;
    return;
  }
  const sourceRevision = process.env.GITHUB_SHA || process.env.SOURCE_REVISION || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  runPinataDirectoryPublication({ jwt, files: manifest._files, sourceRevision })
    .then(result => {
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      if (!result.ok) process.exitCode = 1;
    })
    .catch(() => {
      process.stderr.write('pinata-publication-failed\n');
      process.exitCode = 1;
    });
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  try { main(); }
  catch (error) {
    process.stderr.write(JSON.stringify({ ok: false, reason: error instanceof Error ? error.message : 'preflight-failed' }) + '\n');
    process.exitCode = 1;
  }
}
