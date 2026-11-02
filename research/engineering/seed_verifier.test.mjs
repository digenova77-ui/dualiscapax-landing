import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  canonicalizeManifest,
  verifyCanonicalManifest,
  verifyCanonicalManifestBytes,
} from './seed_verifier.mjs';

const fixturePath = fileURLToPath(new URL('./fixtures/seed-v1-known-answer.json', import.meta.url));
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
const mutableManifest = () => JSON.parse(fixture.canonical_manifest);

test('Python-compatible shared known-answer vector', () => {
  const report = verifyCanonicalManifest(fixture.canonical_manifest);
  assert.equal(report.status, 'PASS');
  assert.equal(report.canonical_sha256, fixture.sha256);
  assert.equal(report.scope, 'schema-and-canonical-commitment-only');
});

test('canonicalizer preserves fixture bytes', () => {
  assert.equal(canonicalizeManifest(mutableManifest()), fixture.canonical_manifest);
});

test('duplicate property names are rejected by canonical-byte comparison', () => {
  const duplicate = fixture.canonical_manifest.replace(
    '"model_id":"hydrogen.reference.v1"',
    '"model_id":"first","model_id":"hydrogen.reference.v1"',
  );
  assert.throws(() => verifyCanonicalManifest(duplicate), /not canonical JSON/);
});

test('whitespace and alternate key order are rejected', () => {
  assert.throws(() => verifyCanonicalManifest(fixture.canonical_manifest + '\n'), /not canonical JSON/);
  const reordered = fixture.canonical_manifest.replace(
    '"ell":0,"m":0,"n":1',
    '"n":1,"ell":0,"m":0',
  );
  assert.throws(() => verifyCanonicalManifest(reordered), /not canonical JSON/);
});

test('unsafe integers and non-integer numbers are rejected', () => {
  const unsafe = fixture.canonical_manifest.replace('"n":1', '"n":9007199254740992');
  assert.throws(() => verifyCanonicalManifest(unsafe), /safe integer/);
  const fraction = fixture.canonical_manifest.replace('"n":1', '"n":1.5');
  assert.throws(() => verifyCanonicalManifest(fraction), /safe integer/);
});

test('non-ASCII object keys are rejected', () => {
  const nonAscii = fixture.canonical_manifest.replace('"ell":0', '"é":0');
  assert.throws(() => verifyCanonicalManifest(nonAscii), /non-ASCII object key/);
});

test('unpaired surrogate values are rejected', () => {
  const surrogate = fixture.canonical_manifest.replace(
    '"hydrogen.reference.v1"',
    '"\\ud800"',
  );
  assert.throws(() => verifyCanonicalManifest(surrogate), /unpaired high surrogate/);
});

test('a valid mutation changes the commitment', () => {
  const changed = fixture.canonical_manifest.replace('hydrogen.reference.v1', 'hydrogen.reference.v2');
  const report = verifyCanonicalManifest(changed);
  assert.notEqual(report.canonical_sha256, fixture.sha256);
});

test('invalid UTF-8 byte sequences are rejected', () => {
  assert.throws(() => verifyCanonicalManifestBytes(Buffer.from([0xff, 0xfe])), /valid UTF-8/);
});

test('wrong schema and unsupported fields are rejected', () => {
  const wrongVersion = fixture.canonical_manifest.replace('dualis.seed.v1', 'dualis.seed.v99');
  assert.throws(() => verifyCanonicalManifest(wrongVersion), /unsupported schema_version/);
  const extra = fixture.canonical_manifest.replace('"units":', '"extra":0,"units":');
  assert.throws(() => verifyCanonicalManifest(extra), /fields mismatch/);
});
