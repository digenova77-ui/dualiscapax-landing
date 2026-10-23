import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectPublicManifest,
  findSecretMaterial,
  isPublicSitePath,
  runPinataDirectoryPublication,
} from '../scripts/pin-pinata.mjs';

const sourceRevision = 'a32bacc668277f089efac8d0033c7a7fba1c1cb6';
const cid = 'bafybeigdyrzt5sfp7udm7hu76uhh4l2l4z2v7f5b4k6m5g3r2q7s6t5u4a';
const files = [
  { path: 'index.html', bytes: Buffer.from('<h1>Public</h1>'), byteLength: 15, sha256: 'unused' },
  { path: 'assets/app.js', bytes: Buffer.from('console.log("public");'), byteLength: 22, sha256: 'unused' },
];

function response({ ok = true, status = 200, json, bytes } = {}) {
  return {
    ok, status,
    async json() { return json; },
    async arrayBuffer() {
      const buffer = Buffer.from(bytes);
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    },
  };
}

test('public path allowlist rejects source, test, secret, and traversal paths', () => {
  assert.equal(isPublicSitePath('index.html'), true);
  assert.equal(isPublicSitePath('assets/app.js'), true);
  assert.equal(isPublicSitePath('.well-known/security.txt', { full: true }), true);
  assert.equal(isPublicSitePath('../outside.html'), false);
  assert.equal(isPublicSitePath('/absolute.html'), false);
  assert.equal(isPublicSitePath('workers/iris-runtime/worker.mjs'), false);
  assert.equal(isPublicSitePath('tests/secret-fixture.json'), false);
  assert.equal(isPublicSitePath('.env'), false);
  assert.equal(isPublicSitePath('credentials.json'), false);
});

test('manifest is deterministic, hashes each selected file, and excludes denied paths', () => {
  const data = new Map([
    ['index.html', Buffer.from('index')],
    ['assets/app.js', Buffer.from('app')],
    ['workers/private.mjs', Buffer.from('not-public')],
    ['notes.md', Buffer.from('full-only')],
  ]);
  const read = (file) => data.get(file);
  const manifest = collectPublicManifest([...data.keys()].reverse(), read);
  assert.deepEqual(manifest.files.map(f => f.path), ['assets/app.js', 'index.html']);
  assert.equal(manifest.fileCount, 2);
  assert.equal(manifest.totalBytes, 8);
  const full = collectPublicManifest([...data.keys()], read, { full: true });
  assert.equal(full.files.some(f => f.path === 'notes.md'), true);
  assert.equal(full.files.some(f => f.path === 'workers/private.mjs'), false);
});

test('private key and known credential formats are detected', () => {
  assert.equal(findSecretMaterial(Buffer.from('-----BEGIN PRIVATE KEY-----\nnot-a-key')), true);
  assert.equal(findSecretMaterial(Buffer.from('ghp_abcdefghijklmnopqrstuvwxyz1234567890')), true);
  assert.equal(findSecretMaterial(Buffer.from('ordinary public website copy')), false);
});

test('missing JWT fails before any network request', async () => {
  let calls = 0;
  const result = await runPinataDirectoryPublication({ jwt: '', files, sourceRevision, fetchImpl: async () => { calls++; } });
  assert.deepEqual(result, { ok: false, stage: 'preflight', reason: 'missing-pinata-jwt' });
  assert.equal(calls, 0);
});

test('directory publication retrieves every path and verifies exact bytes', async () => {
  const calls = [];
  const byPath = new Map(files.map(f => [f.path, Buffer.from(f.bytes)]));
  const fetchImpl = async (url, options) => {
    calls.push({ url, method: options.method, auth: options.headers?.Authorization });
    if (options.method === 'POST') return response({ json: { IpfsHash: cid } });
    const urlPath = new URL(url).pathname.split('/').slice(3).map(decodeURIComponent).join('/');
    return response({ bytes: byPath.get(urlPath) });
  };
  const result = await runPinataDirectoryPublication({ jwt: 'test-secret-never-log', files, sourceRevision, fetchImpl });
  assert.equal(result.ok, true);
  assert.equal(result.verifiedCount, files.length);
  assert.equal(result.failedCount, 0);
  assert.equal(result.contentAddressVerification, 'not-independently-proven');
  assert.equal(calls.length, files.length + 1);
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].auth, 'Bearer test-secret-never-log');
  assert.equal(JSON.stringify(result).includes('test-secret-never-log'), false);
});

test('gateway content tampering makes publication verification fail', async () => {
  let getIndex = 0;
  const fetchImpl = async (_url, options) => {
    if (options.method === 'POST') return response({ json: { IpfsHash: cid } });
    getIndex++;
    return response({ bytes: getIndex === 1 ? Buffer.from('altered') : files[1].bytes });
  };
  const result = await runPinataDirectoryPublication({ jwt: 'test-secret', files, sourceRevision, fetchImpl });
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'verification');
  assert.equal(result.failedCount, 1);
  assert.equal(result.failed[0].reason, 'content-integrity-mismatch');
});

test('upload failure stops before gateway retrieval and does not leak errors', async () => {
  let calls = 0;
  const result = await runPinataDirectoryPublication({
    jwt: 'must-not-leak', files, sourceRevision,
    fetchImpl: async () => { calls++; return response({ ok: false, status: 401 }); },
  });
  assert.equal(result.reason, 'pinata-upload-rejected');
  assert.equal(calls, 1);
  assert.equal(JSON.stringify(result).includes('must-not-leak'), false);
});

test('invalid manifest entry fails before upload', async () => {
  let calls = 0;
  const result = await runPinataDirectoryPublication({
    jwt: 'test-secret', sourceRevision,
    files: [{ path: '../secret.txt', bytes: Buffer.from('x') }],
    fetchImpl: async () => { calls++; },
  });
  assert.equal(result.reason, 'invalid-public-file-entry');
  assert.equal(calls, 0);
});
