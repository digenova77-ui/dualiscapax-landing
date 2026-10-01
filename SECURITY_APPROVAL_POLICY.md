# DCLM Privileged Write Approval Policy

## Decision

DCLM privileged writes use **2-of-3 independent approvals**. No password, token, private key, or signing secret is stored in the repository, static HTML, JavaScript bundles, Google Docs, or browser local storage.

## Approval roles

The three approval roles are conceptual system roles and must map to independent authenticated principals before production enforcement:

- **Father** — enigma/kernel-wide policy authority.
- **Son** — DCLM machine/compiler authority.
- **Spirit** — IRIS + Mark Twain² review/observation authority.

A privileged write is valid only when any two distinct roles approve the same canonical request hash within the configured approval window.

## Required request properties

Every privileged request must be:

1. **Manifest-authorized** — references a validated canonical manifest and compiler version.
2. **Deterministic** — includes the exact request hash and stable serialization.
3. **Non-destructive** — defaults to additive/reversible behavior; destructive operations require a separately approved policy.
4. **Signed by two independent approvers** — signatures are verified server-side against registered public keys.
5. **Receipt-producing** — returns an immutable receipt containing request hash, approver IDs, timestamps, result, and sequence number.

## Boundary

The public static builder is an untrusted client. It may edit a draft manifest and request compilation, but it must not hold credentials or directly authorize a machine write. The enforcement point belongs in a server-side/API or Cloudflare Worker boundary with protected secrets and replay protection.

The current UI labels the policy; it does not claim to enforce quorum authorization until an authenticated backend is connected.

## Minimum backend controls

- Store signer keys/secrets only in a server-side secret store.
- Bind approvals to a request hash, nonce, expiry, and environment.
- Reject duplicate, expired, out-of-order, or self-approved requests.
- Require two distinct principals; never count two sessions for one principal as two votes.
- Log denials and failed signature checks without logging secret material.
- Keep the final write idempotent and auditable.

## Canonical kernel designation

The DCLM kernel is the **canonical protected reference** for this system. The designation is an integrity and governance statement: the exact kernel identity, build provenance, ABI, and receipt format must be pinned and verified before any privileged write is accepted. A public label alone is not cryptographic protection; enforcement requires immutable hashes, verified provenance, authenticated quorum signatures, access isolation, and auditable receipts.

## Dark Ledger task protocol

Every new task is first converted into a prompt for the designated online computer. The local authoring session is not the execution target. The prompt uses two rails: **Claim** (the requested work) and **Fetch** (independent evidence and environment verification), followed by a **Collapse** verdict of PASS, FAIL, or HOLE.

The Dark Ledger is hidden from the public client and retained server-side as an attributable audit record. It contains hashes, actors, target, evidence, votes, denials, timestamps, and receipts, but never raw secrets. The Trinity gate binds DCLM, Twain², and Iris votes to the same request hash and requires 2-of-3 authenticated approvals. Only the verified kernel/Father layer may perform the final write; absent a valid receipt, the online computer must not execute.
