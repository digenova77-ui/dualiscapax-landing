# Diamond Protocol — Execution Checklist

**Working branch:** `integration/iris-runtime-main-20261024`  
**Current integration PR:** [#163](https://github.com/digenova77-ui/dualiscapax-landing/pull/163)  
**Rule:** A checkbox is complete only when its acceptance evidence is linked or recorded. Source code, passing CI, staging proof, and production proof are different states.

## Status key
- [x] Implemented in the integration branch and/or supported by current CI evidence.
- [~] Partial, design/source exists but end-to-end behavior or external dependency is not proven.
- [ ] Not yet completed or evidence not yet captured.

## Wave 1 — Make the protocol executable (immediate priority)

- [x] Define the universal work-envelope contract and structural evidence bundle.
- [x] Add PUEL canonical statement/signature verification and evidence digest checks.
- [x] Add bundle verification for identity attestation, Trinity decision, execution receipt, resource measurements, and optional settlement evidence.
- [x] Add root-signed PUEL trust registry verification and minimum-version anti-rollback gate.
- [x] Define fail-closed intent-role boundaries for eFuse, Merit, and Unity.
- [x] Add unit tests for rooted verification, stale registry rejection, revoked keys, and unpinned roots.
- [x] Latest observed CI for commit `bd7abf3791a13e208895ee5c745532542e980573`: Elite CI, Iris Runtime Integration, Iris/Trinity test gauntlet, static i18n, and translation catalog integrity succeeded.
- [ ] Record the exact latest test run URLs and job summaries in this checklist or PR.
- [ ] Build one deterministic end-to-end staging fixture that signs, verifies, rejects tampering, and emits a reproducible receipt.
- [ ] Add explicit negative tests for missing/expired identity, Trinity deny, malformed measurement, receipt mismatch, registry rollback, revoked signer, and replay/duplicate work ID.
- [ ] Prove the actual runtime routes call the verifier; unit tests alone do not prove route wiring.

## Wave 2 — Connect real authorities (no mock treated as live)

- [ ] Inventory the real Identity/Unity issuer, Trinity decision service, execution engine, resource meter, durable receipt store, and key custody from source/configuration.
- [ ] Mark every integration as LIVE, STAGING, FIXTURE, or MISSING; never silently fall back from live to fixture.
- [ ] Establish root-key generation, offline custody, rotation, emergency revocation, registry publication, and minimum-version persistence.
- [ ] Wire authenticated identity evidence to the actual Unity issuer; reject absent, invalid, expired, or wrong-audience identity.
- [ ] Wire Trinity as the sole authorization gate before any protected execution or write; default deny on timeout, missing response, invalid signature, or policy ambiguity.
- [ ] Bind each accepted decision to the exact work digest, requester, policy version, expiry, nonce, and unique work ID.
- [ ] Connect a real deterministic execution adapter and issue a signed execution receipt.
- [ ] Connect a real resource measurement source; label estimates as estimates and never claim joules measured without instrumented evidence.
- [ ] Persist receipts durably and verify retrieval after process restart; define idempotency and replay handling.
- [ ] Complete one harmless staging computation end to end with independently verifiable identity, Trinity allow/deny, execution receipt, and resource evidence.
- [ ] Run the same scenario with a forced denial and prove no execution or protected write occurs.

## Wave 3 — Integrate Iris and the public surfaces

- [ ] Inspect current Iris frontend and backend routes; map existing session verification and provider-connector gaps.
- [ ] Replace any browser-only fuel/authorization claim with server-verified runtime state.
- [ ] Connect Iris to the governed runtime through authenticated, versioned APIs; never expose issuer private keys or privileged credentials to the browser.
- [ ] Keep dualiscapax.com as the public frontend and dualiscapax.ai as the 3D/runtime experience, preserving the agreed separation.
- [ ] Add visible runtime status for identity, Trinity decision, execution, evidence, and errors without implying a step passed when it did not.
- [ ] Verify fail-closed behavior for missing session verifier, missing provider connector, unavailable runtime, expired session, and denied request.
- [ ] Run browser/API integration tests against staging and document the tested commit and endpoint.

## Wave 4 — Define and prove the asset trilogy

- [x] Specify source-level intent boundaries: eFuse = resource-accounting reference; Merit = access entitlement; Unity = non-transferable identity credential.
- [ ] Freeze the protocol semantics, canonical data schemas, units, issuance rules, authority, and lifecycle for all three.
- [ ] eFuse: define metering source, unit conversion, calibration, evidence provenance, uncertainty, and audit trail; do not equate a software estimate with physical energy.
- [ ] Merit: define entitlement grants, expiry, revocation, quota semantics, and non-transferability; do not imply token issuance or cash value.
- [ ] Unity: define credential subject, issuer, audience, expiry, revocation, recovery, and non-transferability.
- [ ] Define cross-asset invariants and explicit prohibited operations (unauthorized transfer, mint, burn, settlement, or privilege escalation).
- [ ] Add property/fuzz tests for role confusion, replay, boundary values, precision/rounding, revoked credentials, and cross-asset substitution.
- [ ] Keep real-money settlement and public token contracts disabled until legal, economic, custody, security, and operational gates are separately approved.

## Wave 5 — Deployment and operational readiness

- [ ] Verify repository integration PR is current with main and review the complete diff before merge.
- [ ] Resolve every failing or skipped required check; record successful run links.
- [ ] Verify required environment variables, secret bindings, service bindings, routes, migrations, and durable storage in staging without printing secrets.
- [ ] Deploy to staging through the documented deployment path; capture deployment ID, commit SHA, health check, and smoke-test evidence.
- [ ] Test rollback to the previous known-good staging release.
- [ ] Run a production-readiness review of authorization, key custody, privacy, rate limits, abuse controls, observability, backups, incident response, and recovery.
- [ ] Obtain explicit approval before merge/deployment that changes production behavior.
- [ ] Deploy only after the readiness gates pass; verify live health and rollback readiness after deployment.

## Definition of done — Diamond Protocol v1

- [ ] One independently reproducible staging run succeeds from request through verified identity, Trinity authorization, deterministic execution, resource evidence, and durable signed receipt.
- [ ] A denied request demonstrably produces no protected execution/write.
- [ ] Tampered evidence, revoked keys, expired identity, registry rollback, replay, and unavailable authorization all fail closed.
- [ ] The eFuse/Merit/Unity schemas and prohibited operations are machine-enforced and tested.
- [ ] Iris uses the governed runtime and reports truthful state.
- [ ] CI, staging smoke tests, deployment identity, and rollback evidence are linked.
- [ ] Production remains unchanged until explicitly authorized.

## Current honest boundary

The checklist's first-wave items describe source-level implementation and the latest observed passing CI on commit `bd7abf3791a13e208895ee5c745532542e980573`. They do **not** establish that a real external issuer, Trinity service, physical energy meter, durable production ledger, live token contract, or production deployment is connected. Those are explicit work items above, not assumed capabilities.
