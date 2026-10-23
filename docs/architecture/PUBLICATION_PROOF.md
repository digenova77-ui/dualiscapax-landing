# Publication Proof Contract

## Purpose

This module separates deterministic receipt integrity from actual decentralized publication. It is a staging contract and test harness, not proof that a live IPFS/IPNS service is configured.

## Verification stages

1. Validate input and source revision before network activity.
2. Upload bytes through an adapter and validate returned CID syntax.
3. If supplied, require the adapter's content-address verifier to confirm the CID matches the bytes.
4. If an IPNS name is supplied, resolve it and require exact equality with the uploaded CID.
5. Attempt each requested pin provider and record every outcome separately.
6. Retrieve bytes independently and verify byte length, SHA-256, and receipt integrity.

## Critical distinctions

- A CID-shaped string is not proof of a correct CID. A real adapter must validate the CID multihash against the bytes.
- A receipt SHA-256 is an integrity checksum, not a digital signature or publisher identity proof.
- A successful pin request is not proof of independent retrieval or durable availability.
- IPNS resolution proves only the observed resolution at that time; stale records, key ownership, signatures, and independent resolver diversity need separate verification.
- The in-memory adapter used in tests is deliberately synthetic and must never be represented as IPFS, Pinata, or a real IPNS publication.
- Production publication, DNS changes, deployment, secrets, and payment/ledger actions remain outside this test contract and require their own authorization.

## Reproducible local test

Run with Node.js 22:

`node --test tests/publication-proof.test.mjs tests/publication-pipeline.test.mjs`

All tests must pass before integrating a real adapter. Passing these tests establishes behavior of the local logic and its mock contract only.

## Public-tree publisher

`scripts/pin-pinata.mjs` is the implementation used by the existing manual Pinata workflow. With no arguments it performs a dry run and makes no network calls. The workflow's explicit `--pin` path publishes an allowlisted public-static tree as a wrapped directory, rejects source-only directories and likely credential/private-key material, and retrieves every listed path through the returned gateway CID for byte comparison.

- `node scripts/pin-pinata.mjs` — dry-run manifest only.
- `node scripts/pin-pinata.mjs --full` — dry-run expanded static/documentation allowlist only.
- `PINATA_JWT=... node scripts/pin-pinata.mjs --pin` — external publication; run only when explicitly authorized.
- `PINATA_JWT=... node scripts/pin-pinata.mjs --pin --full` — expanded external publication; run only when explicitly authorized.

The directory CID's UnixFS multihash is **not independently recomputed** by this script. Gateway byte checks establish that each listed path was retrievable and matched the selected local bytes at the time of the check; they do not prove second-provider availability, IPNS publication, or durable pinning. Do not call this an end-to-end decentralized proof until those independent checks exist.

## Tests

Run with Node.js 22:

`node --test tests/publication-proof.test.mjs tests/publication-pipeline.test.mjs tests/pinata-test-publish.test.mjs tests/publication-signature.test.mjs tests/pin-pinata.test.mjs`

All tests are offline mocks. No test publishes website content or uses a live credential.
