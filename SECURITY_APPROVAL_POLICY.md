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
