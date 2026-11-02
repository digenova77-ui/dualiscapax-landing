import { createHash } from 'node:crypto';
import { TextDecoder } from 'node:util';

export const REQUIRED_FIELDS = Object.freeze([
  'model_id', 'schema_version', 'state', 'rules', 'units', 'precision',
  'boundary_conditions', 'observables', 'invariants', 'limits',
]);
export const SCHEMA_VERSION = 'dualis.seed.v1';
export const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

export class ManifestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ManifestError';
  }
}

function validateUnicodeScalarString(value, path) {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new ManifestError('unpaired high surrogate at ' + path);
      }
      i += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new ManifestError('unpaired low surrogate at ' + path);
    }
  }
}

function validatePortableValue(value, path = '$') {
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new ManifestError('number must be a safe integer at ' + path);
    }
    return;
  }
  if (typeof value === 'string') {
    validateUnicodeScalarString(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => validatePortableValue(child, path + '[' + index + ']'));
    return;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (!/^[\x00-\x7f]*$/.test(key)) {
        throw new ManifestError('non-ASCII object key at ' + path);
      }
      validatePortableValue(child, path + '.' + key);
    }
    return;
  }
  throw new ManifestError('unsupported JSON value at ' + path);
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value !== null && typeof value === 'object') {
    const sorted = Object.create(null);
    for (const key of Object.keys(value).sort()) sorted[key] = sortDeep(value[key]);
    return sorted;
  }
  return value;
}

export function canonicalizeManifest(manifest) {
  validatePortableValue(manifest);
  return JSON.stringify(sortDeep(manifest));
}

export function validateManifest(manifest) {
  if (manifest === null || Array.isArray(manifest) || typeof manifest !== 'object') {
    throw new ManifestError('manifest root must be an object');
  }
  validatePortableValue(manifest);
  const keys = Object.keys(manifest).sort();
  const required = [...REQUIRED_FIELDS].sort();
  if (keys.length !== required.length || keys.some((key, index) => key !== required[index])) {
    const missing = required.filter((key) => !keys.includes(key));
    const extra = keys.filter((key) => !required.includes(key));
    throw new ManifestError('manifest fields mismatch; missing=' + missing.join(',') + ' extra=' + extra.join(','));
  }
  if (manifest.schema_version !== SCHEMA_VERSION) {
    throw new ManifestError('unsupported schema_version: ' + String(manifest.schema_version));
  }
  for (const key of ['model_id', 'precision']) {
    if (typeof manifest[key] !== 'string' || manifest[key].trim() === '') {
      throw new ManifestError(key + ' must be a non-empty string');
    }
  }
  for (const key of ['state', 'rules', 'units', 'boundary_conditions', 'observables', 'invariants', 'limits']) {
    if (manifest[key] === null || typeof manifest[key] !== 'object') {
      throw new ManifestError(key + ' must be an object or array');
    }
  }
}

/**
 * Verify the deliberately narrow DualisCapax canonical JSON profile.
 * Raw source must already be canonical. This is NOT RFC 8785/JCS.
 */
export function verifyCanonicalManifest(source) {
  if (typeof source !== 'string') throw new ManifestError('source must be a string');
  let manifest;
  try {
    manifest = JSON.parse(source);
  } catch (error) {
    throw new ManifestError('invalid JSON: ' + error.message);
  }
  validateManifest(manifest);
  const canonical = canonicalizeManifest(manifest);
  if (source !== canonical) {
    throw new ManifestError('source is not canonical JSON (duplicates and alternate encodings are rejected)');
  }
  const sha256 = createHash('sha256').update(Buffer.from(source, 'utf8')).digest('hex');
  return {
    status: 'PASS',
    schema: SCHEMA_VERSION,
    canonical_sha256: sha256,
    scope: 'schema-and-canonical-commitment-only',
    truth_claim: 'not-established-by-hash',
    execution: 'no-user-code-executed',
  };
}

export function verifyCanonicalManifestBytes(bytes) {
  let source;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new ManifestError('source is not valid UTF-8');
  }
  return verifyCanonicalManifest(source);
}
