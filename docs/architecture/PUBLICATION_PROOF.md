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
