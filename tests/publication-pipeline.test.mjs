import test from 'node:test';
import assert from 'node:assert/strict';
import { publishAndVerify } from '../scripts/publication-pipeline.mjs';
import { createMockAdapter } from '../scripts/mock-publication-adapter.mjs';

const bytes = Buffer.from('{"protocol":"dualis-test-fixture-v1","value":42}\n');
const sourceRevision = 'de4dce47f133c28f42e501792ef289fd4485eb75';

test('mock publication, CID adapter check, IPNS and two pins', async () => {
  const adapter = createMockAdapter();
  const result = await publishAndVerify({ adapter, bytes, sourceRevision, ipnsName: 'test-only-key', providers: ['pin-a', 'pin-b'] });
  assert.equal(result.ok, true);
  assert.equal(result.cidVerified, true);
  assert.equal(result.ipns.ok, true);
  assert.equal(result.pinCountConfirmed, 2);
  assert.equal(result.receiptVerification.ok, true);
});

test('incomplete adapter fails closed', async () => {
  assert.deepEqual(await publishAndVerify({ adapter: {}, bytes, sourceRevision }), { ok: false, stage: 'preflight', reason: 'adapter-contract-incomplete' });
});

test('upload failure prevents later actions', async () => {
  const adapter = createMockAdapter({ failPut: true });
  const result = await publishAndVerify({ adapter, bytes, sourceRevision, ipnsName: 'test-only-key', providers: ['pin-a'] });
  assert.equal(result.reason, 'content-publication-failed');
  assert.deepEqual(adapter.calls, ['put']);
});

test('failed content-address verification stops before retrieval', async () => {
  const adapter = createMockAdapter();
  adapter.verifyCid = async () => false;
  const result = await publishAndVerify({ adapter, bytes, sourceRevision });
  assert.equal(result.reason, 'cid-content-mismatch');
  assert.equal(adapter.calls.includes('get'), false);
});

test('IPNS mismatch stops before pinning and retrieval', async () => {
  const adapter = createMockAdapter({ ipnsCid: 'bafybbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' });
  const result = await publishAndVerify({ adapter, bytes, sourceRevision, ipnsName: 'test-only-key', providers: ['pin-a'] });
  assert.equal(result.reason, 'ipns-resolution-mismatch');
  assert.equal(adapter.calls.some((call) => call.startsWith('pin:')), false);
  assert.equal(adapter.calls.includes('get'), false);
});

test('retrieval outage fails closed', async () => {
  const result = await publishAndVerify({ adapter: createMockAdapter({ failGet: true }), bytes, sourceRevision });
  assert.equal(result.reason, 'independent-retrieval-failed');
});

test('tampered retrieved bytes fail receipt verification', async () => {
  const result = await publishAndVerify({ adapter: createMockAdapter({ tamperGet: true }), bytes, sourceRevision });
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'receipt-verification');
  assert.match(result.reason, /mismatch/);
});

test('one pin-provider outage is visible while another pin succeeds', async () => {
  const result = await publishAndVerify({ adapter: createMockAdapter({ failingProviders: ['pin-b'] }), bytes, sourceRevision, providers: ['pin-a', 'pin-b'] });
  assert.equal(result.ok, true);
  assert.equal(result.pinCountConfirmed, 1);
  assert.equal(result.pinCountFailed, 1);
  assert.deepEqual(result.pinResults.map((item) => item.ok), [true, false]);
});

test('missing CID verifier is reported as unproven, not silently trusted', async () => {
  const adapter = createMockAdapter();
  delete adapter.verifyCid;
  const result = await publishAndVerify({ adapter, bytes, sourceRevision });
  assert.equal(result.ok, true);
  assert.equal(result.cidVerified, false);
  assert.equal(result.cidVerificationStatus, 'not-proven-by-adapter');
});

test('invalid source revision is rejected before upload', async () => {
  const adapter = createMockAdapter();
  const result = await publishAndVerify({ adapter, bytes, sourceRevision: 'latest' });
  assert.deepEqual(result, { ok: false, stage: 'preflight', reason: 'invalid-source-revision' });
  assert.equal(adapter.calls.includes('put'), false);
});
