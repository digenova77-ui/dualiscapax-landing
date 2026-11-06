# Unification Engine: First Proof Slice

Status: non-production proof in progress; current code is not integrated into the live HUD and is not evidence of deployed capability.

## Product thesis

DualisCapax is a personal, customizable operating environment over a shared governed foundation. The first user-visible product is a full-screen 3D smart board. The long-term platform supports optional modules (Iris, Residual Loss Finance, agents, wallet, cryptographic sharing and digital-mesh integrations) without forcing every user to use every module.

## Scope of the first proof

1. Reuse the existing Three.js renderer and establish a stable scene-object model.
2. Implement create, select, transform, delete-with-confirmation, undo and redo for local scene objects.
3. Implement a versioned command registry at `docs/architecture/hud-command-registry.v1.json`; trigger phrases express intent and never confer authority.
4. Convert natural-language requests to a structured proposal: intent, target, operations, assumptions, estimated resource budget, and required capabilities.
5. Show a preview before applying material edits; reject ambiguous targets rather than guessing.
6. Save and restore a project in a clearly labeled development-only persistence path. Do not treat browser storage as identity, financial, or authorization authority.
7. Add tests for parser ambiguity, invalid operations, undo/redo, persistence round-trip, and fail-closed capability checks.

## Non-goals for this slice

- No production deployment, DNS changes, secrets, payment activation, or database migration.
- No live wallet transaction or real-money autonomous acquisition.
- No claim that Unity ID/passkey is verified merely because a client has a credential object.
- No claim that an illustrative scene is a live digital twin.
- No production identity or tenant binding until server-side ownership checks are implemented and tested.

## Required invariants

- Trinity remains the sole authorization gate for protected operations.
- Authentication is evidence of identity, not authorization.
- A trigger word is not permission.
- Client-side balances, flags, and local storage are never authoritative for money or protected records.
- Unknown provider outcomes are not retried as though failure were certain.
- Resource-intensive work must have a visible estimate/budget and enforceable server-side limit before execution.
- Observed data, inference, simulation, and verified real-world outcomes are labeled separately.

## Acceptance gates

- A user creates a 3D object from a command, edits it, undoes/redoes, saves, reloads, and restores it.
- Automated tests pass on the exact reviewed commit.
- Ambiguous commands produce clarification; unsupported capabilities fail closed with a useful explanation.
- A destructive or costly action cannot execute through a client-only check.
- The change is reviewed in a draft PR; no merge or deployment occurs without explicit approval.

## Existing-source evidence to reconcile before coding

- The default branch root loads the Three.js bundle `assets/main-aLcyOp8b.js`.
- The default branch `js/fuel-ledger.js` explicitly calls itself a local demonstration stub; it is not authoritative accounting.
- The default branch Iris runtime identifies itself as non-production and requires service bindings.
- The existing draft PRs for the Fuel ledger and decentralized playground architecture remain separate, unmerged workstreams. Their code and tests must be checked at the exact current branch head before reuse.

## Next implementation sequence

A. Add parser/registry unit tests and deterministic intent resolution.
B. Add a scene adapter behind a small interface so the HUD doesn't couple command parsing to Three.js internals.
C. Implement reversible scene operations and local development persistence.
D. Add an estimate/approval interface for resource-intensive actions.
E. Run current-head tests and publish evidence; then consider a staging integration test.
