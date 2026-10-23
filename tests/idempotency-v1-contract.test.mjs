import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const contract = JSON.parse(await readFile(new URL('../protocol/idempotency-v1-vectors.json', import.meta.url), 'utf8'));

function compareScalars(a, b) {
  const aa = Array.from(a, c => c.codePointAt(0));
  const bb = Array.from(b, c => c.codePointAt(0));
  for (let i = 0; i < Math.min(aa.length, bb.length); i++) if (aa[i] !== bb[i]) return aa[i] - bb[i];
  return aa.length - bb.length;
}
function canonical(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    if (typeof value === 'string') {
      for (let i = 0; i < value.length; i++) {
        const unit = value.charCodeAt(i);
        if (unit >= 0xD800 && unit <= 0xDBFF) {
          const next = value.charCodeAt(i + 1);
          assert.ok(next >= 0xDC00 && next <= 0xDFFF, 'unpaired high surrogate');
          i++;
        } else assert.ok(!(unit >= 0xDC00 && unit <= 0xDFFF), 'unpaired low surrogate');
      }
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    assert.ok(Number.isSafeInteger(value), 'safe integers only');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  assert.equal(typeof value, 'object', 'unsupported canonical value');
  return '{' + Object.keys(value).sort(compareScalars).map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
}
test('landing edge matches shared idempotency v1 vectors', () => {
  assert.equal(contract.contract, 'dualis.idempotency.v1');
  for (const v of contract.vectors) {
    const bytes = canonical(v.input);
    assert.equal(bytes, v.canonical_utf8);
    assert.equal(createHash('sha256').update(bytes, 'utf8').digest('hex'), v.sha256);
  }
});
test('landing canonicalization rejects invalid inputs', () => {
  assert.throws(() => canonical(1.5));
  assert.throws(() => canonical(Number.NaN));
  assert.throws(() => canonical(String.fromCharCode(0xD800)));
  assert.throws(() => canonical(String.fromCharCode(0xDC00)));
});
