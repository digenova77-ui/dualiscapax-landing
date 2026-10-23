import { createHash } from 'node:crypto';

// In-memory test double only. It is not IPFS, Pinata, or a valid CID implementation.
const mockCidFor = (bytes) => `bafy${createHash('sha256').update(bytes).digest('hex').slice(0, 40).replace(/[0189]/g, 'a')}`;

export function createMockAdapter({ failPut = false, failGet = false, tamperGet = false, ipnsCid = null, failingProviders = [] } = {}) {
  const objects = new Map();
  const pins = new Map();
  const calls = [];
  return {
    calls, objects, pins,
    async put(bytes) {
      calls.push('put');
      if (failPut) throw new Error('mock-put-failure');
      const cid = mockCidFor(bytes);
      objects.set(cid, Buffer.from(bytes));
      return cid;
    },
    async get(cid) {
      calls.push('get');
      if (failGet) throw new Error('mock-get-failure');
      const bytes = objects.get(cid);
      if (!bytes) throw new Error('mock-not-found');
      if (tamperGet) {
        const changed = Buffer.from(bytes);
        if (changed.length) changed[0] ^= 1;
        return changed;
      }
      return Buffer.from(bytes);
    },
    async resolve(name) {
      calls.push(`resolve:${name}`);
      if (!name) throw new Error('mock-invalid-name');
      return ipnsCid ?? [...objects.keys()].at(-1) ?? null;
    },
    async pin(cid, provider) {
      calls.push(`pin:${provider}`);
      if (failingProviders.includes(provider)) throw new Error('mock-provider-failure');
      if (!objects.has(cid)) return false;
      if (!pins.has(provider)) pins.set(provider, new Set());
      pins.get(provider).add(cid);
      return true;
    },
    async verifyCid(cid, bytes) {
      calls.push('verifyCid');
      return objects.has(cid) && Buffer.from(objects.get(cid)).equals(Buffer.from(bytes)) && cid === mockCidFor(bytes);
    },
  };
}
