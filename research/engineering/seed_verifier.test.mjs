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
const unicodeFixturePath = fileURLToPath(new URL('./fixtures/seed-v1-unicode-known-answer.json', import.meta.url));
const unicodeFixture = JSON.parse(await readFile(unicodeFixturePath, 'utf8'));
const mutableManifest = () => JSON.parse(fixture.canonical_manifest);
const generatedFixturePath = fileURLToPath(new URL('./fixtures/seed-v1-generated-known-answers.json', import.meta.url));
const generatedFixture = JSON.parse(await readFile(generatedFixturePath, 'utf8'));

test('1000 generated cross-runtime vectors and malformed near-neighbours', () => {
  assert.equal(generatedFixture.fixture_version, 'dualis.seed.generated-known-answers.v1');
  assert.equal(generatedFixture.seed, '0xD1A0C0DE');
  assert.equal(generatedFixture.case_count, 1000);
  assert.equal(generatedFixture.cases.length, 1000);

  for (let index = 0; index < generatedFixture.cases.length; index += 1) {
    const vector = generatedFixture.cases[index];
    assert.equal(vector.index, index);
    const source = vector.canonical_manifest;
    const report = verifyCanonicalManifest(source);
    assert.equal(report.canonical_sha256, vector.sha256, 'SHA-256 differs at vector ' + index);
    assert.equal(canonicalizeManifest(JSON.parse(source)), source, 'canonical bytes differ at vector ' + index);
    assert.throws(() => verifyCanonicalManifest(source + '\\n'), /not canonical JSON/);
    const modelId = '"model_id":"generated.seed.v1.' + index + '"';
    const duplicate = source.replace(modelId, '"model_id":"duplicate",' + modelId);
    assert.throws(() => verifyCanonicalManifest(duplicate), /not canonical JSON/);
  }
});

test('Python-compatible shared known-answer vector', () => {
  const report = verifyCanonicalManifest(fixture.canonical_manifest);
  assert.equal(report.status, 'PASS');
  assert.equal(report.canonical_sha256, fixture.sha256);
  assert.equal(report.scope, 'schema-and-canonical-commitment-only');
});

test('canonicalizer preserves fixture bytes', () => {
  assert.equal(canonicalizeManifest(mutableManifest()), fixture.canonical_manifest);
});


test('Unicode scalar known-answer vector matches Python SHA-256', () => {
  const report = verifyCanonicalManifest(unicodeFixture.canonical_manifest);
  assert.equal(report.canonical_sha256, unicodeFixture.sha256);
  assert.match(unicodeFixture.canonical_manifest, /café μ 🌍/);
});

test('alternate escaped Unicode source is rejected', () => {
  const escaped = unicodeFixture.canonical_manifest.replace('café', 'caf\\u00e9');
  assert.throws(() => verifyCanonicalManifest(escaped), /not canonical JSON/);
});

test('safe-integer boundaries remain accepted', () => {
  const manifest = mutableManifest();
  manifest.state.n = Number.MAX_SAFE_INTEGER;
  const canonical = canonicalizeManifest(manifest);
  assert.equal(verifyCanonicalManifest(canonical).status, 'PASS');
  manifest.state.n = -Number.MAX_SAFE_INTEGER;
  assert.equal(verifyCanonicalManifest(canonicalizeManifest(manifest)).status, 'PASS');
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

test('UTF-8 BOM is rejected rather than silently stripped', () => {
  const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(fixture.canonical_manifest, 'utf8')]);
  assert.throws(() => verifyCanonicalManifestBytes(bytes), /invalid JSON/);
});

test('wrong schema and unsupported fields are rejected', () => {
  const wrongVersion = fixture.canonical_manifest.replace('dualis.seed.v1', 'dualis.seed.v99');
  assert.throws(() => verifyCanonicalManifest(wrongVersion), /unsupported schema_version/);
  const extra = fixture.canonical_manifest.replace('"units":', '"extra":0,"units":');
  assert.throws(() => verifyCanonicalManifest(extra), /fields mismatch/);
});
