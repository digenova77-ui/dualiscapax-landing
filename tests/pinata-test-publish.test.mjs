import test from 'node:test';
import assert from 'node:assert/strict';
import { runPinataTestPublication, TEST_FIXTURE } from '../scripts/pinata-test-publish.mjs';

const sourceRevision = 'de4dce47f133c28f42e501792ef289fd4485eb75';
const cid = 'bafybeigdyrzt5sfp7udm7hu76uhh4l2l4z2v7f5b4k6m5g3r2q7s6t5u4a';

function response({ ok = true, status = 200, json, bytes } = {}) {
  return {
    ok, status,
    async json() { return json; },
    async arrayBuffer() { return Buffer.from(bytes).buffer.slice(Buffer.from(bytes).byteOffset, Buffer.from(bytes).byteOffset + Buffer.from(bytes).byteLength); },
  };
}

test('missing JWT fails before any request', async () => {
  let calls = 0;
  const result = await runPinataTestPublication({ jwt: '', sourceRevision, fetchImpl: async () => { calls++; } });
  assert.equal(result.reason, 'missing-pinata-jwt');
  assert.equal(calls, 0);
});

test('invalid source revision fails before any request', async () => {
  let calls = 0;
  const result = await runPinataTestPublication({ jwt: 'test-token', sourceRevision: 'latest', fetchImpl: async () => { calls++; } });
  assert.equal(result.reason, 'invalid-source-revision');
  assert.equal(calls, 0);
});

test('upload then gateway retrieval verifies fixture bytes', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, method: options.method, auth: options.headers?.Authorization });
    if (options.method === 'POST') return response({ json: { IpfsHash: cid } });
    return response({ bytes: TEST_FIXTURE });
  };
  const result = await runPinataTestPublication({ jwt: 'never-print-this-token', sourceRevision, fetchImpl });
  assert.equal(result.ok, true);
  assert.equal(result.verification.ok, true);
  assert.equal(result.cidMultihashVerified, false);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].auth, 'Bearer never-print-this-token');
  assert.match(calls[1].url, new RegExp(cid));
});

test('gateway byte tampering is rejected', async () => {
  const changed = Buffer.from(TEST_FIXTURE);
  changed[0] ^= 1;
  const fetchImpl = async (_url, options) => options.method === 'POST'
    ? response({ json: { IpfsHash: cid } })
    : response({ bytes: changed });
  const result = await runPinataTestPublication({ jwt: 'test-token', sourceRevision, fetchImpl });
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'receipt-verification');
  assert.equal(result.reason, 'content-hash-mismatch');
});

test('upload API failure stops before gateway retrieval', async () => {
  let calls = 0;
  const result = await runPinataTestPublication({
    jwt: 'test-token', sourceRevision,
    fetchImpl: async () => { calls++; return response({ ok: false, status: 401 }); },
  });
  assert.equal(result.reason, 'pinata-upload-rejected');
  assert.equal(calls, 1);
});

test('network failure is handled without leaking credentials', async () => {
  const result = await runPinataTestPublication({
    jwt: 'secret-that-must-not-be-logged', sourceRevision,
    fetchImpl: async () => { throw new Error('sensitive error'); },
  });
  assert.equal(result.reason, 'pinata-upload-request-failed');
  assert.equal(JSON.stringify(result).includes('secret-that-must-not-be-logged'), false);
});
