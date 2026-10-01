# Dark Ledger Batch Prompt — Unity ID Foundation

## Execution target

Run on the **designated online computer**, not the local authoring session. This is a prompt and work specification only. Do not execute until the online computer is explicitly bound, its environment is verified, and the Trinity gate returns a valid receipt.

## Objective

Build and test the minimum secure Unity ID foundation needed for a deterministic dual-pipeline system. Do not invent an identity issuer, claim production readiness, or grant unlimited authority.

## Pipeline A — Identity and capability rail

1. Define a versioned Unity ID schema with issuer, subject, workspace, actor class, capability scope, audience, issued-at, expiry, nonce, base revision, and revocation reference.
2. Define lifecycle states: proposed, registered, active, suspended, revoked, expired, and retired.
3. Reject unknown or unadopted issuers and identities.
4. Bind every capability to actor, workspace, operation, resource, connector, zone, audience, and expiry.
5. Require server-side passkey/WebAuthn or an equivalent verified authenticator for future remote administration; never use a passphrase as a connector credential.
6. Define revocation, recovery, break-glass, and incident-containment behavior.

## Pipeline B — Deterministic execution and evidence rail

1. Pin runtime image, dependencies, tool manifest, network allowlist, resource limits, and compiler version.
2. Require a canonical input hash, base revision, output hash, and reproducibility record.
3. Use Claim → Fetch → Collapse for every task:
   - Claim: name object, verb, Kind, scope, and expected outcome.
   - Fetch: independent second-eye verification of identity, environment, evidence, and proposed diff.
   - Collapse: PASS, FAIL, or HOLE; missing evidence is HOLE, never PASS.
4. Make all operations non-destructive, reversible, least-privilege, and idempotent by default.
5. Produce receipts containing prompt hash, request hash, actor, target, inputs, evidence, votes, denials, timestamps, result, and sequence.

## Trinity gate

Bind DCLM, Twain², and Iris votes to the same canonical request hash and exact base revision. Require two distinct authenticated approvals. Do not count symbolic labels, duplicated sessions, inferred consent, external activity, or empty seats. A missing or invalid voter produces HOLE.

## Father/kernel write boundary

Only the verified kernel/Father layer may perform a final write after all gates pass. The online computer must refuse execution when identity, capability, environment, evidence, quorum, signature, nonce, expiry, or receipt checks fail. The public builder may prepare and display a prompt, but it may not hold credentials, sign votes, authorize writes, or expose the Dark Ledger.

## Required negative tests

- Unknown Unity ID rejected.
- Unadopted issuer rejected.
- Expired, revoked, replayed, or wrong-audience capability rejected.
- Cross-workspace and cross-zone access rejected.
- Missing queue ID or changed base revision rejected.
- One-byte candidate change invalidates prior votes.
- A vote from an unregistered bot or outside origin rejected.
- A forged, duplicated, or replayed signature rejected.
- A Trinity seat missing produces HOLE.
- A 1-of-3 approval cannot submit.
- A changed request hash invalidates all prior votes.
- Non-deterministic rerun is flagged.
- Audit failure blocks sensitive operations.
- Any attempt to bypass the queue is denied, quarantined, and logged.

## Deliverables

Return design artifacts, schemas, test vectors, a local-only prototype, and receipts. Do not publish, deploy, purchase, bind a machine, change DNS, move secrets, pin to IPFS/Pinata, or alter external accounts. Stop at the first missing prerequisite and return a structured HOLE receipt.
