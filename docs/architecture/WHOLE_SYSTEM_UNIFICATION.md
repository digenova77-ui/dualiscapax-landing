# DualisCapax whole-system unification contract

**Status:** implementation contract / staging plan, not a claim of production readiness  
**Authority:** Trinity is the only authorization gate. No other layer may grant authority.  
**Change boundary:** no production DNS, route, deployment, database, secrets, credentials, or permissions changes without explicit approval.

## 1. One system, explicit planes

The site, Iris interface, identity, compute, economics, and evidence are one product but must remain separable services with versioned contracts.

1. **Presentation plane:** every served HTML page, language variant, navigation item, link, form, click handler, keyboard action, media action, and deep link.
2. **Identity plane:** Unity ID is a stable subject identifier, not authentication by itself. WebAuthn/passkey verification and session issuance happen server-side. Device habits, localStorage values, public IDs, and client correlation stamps are not proof.
3. **Decision plane:** deterministic checks first where the question is exactly computable; probabilistic inference only when needed; deterministic validation after inference; Trinity alone authorizes consequential actions.
4. **Compute plane:** DCLM selects a bounded execution path, records provider/model/version, input and output hashes, measured resource use, deterministic checks, uncertainty, and result.
5. **Economic plane:** measured Joules, external provider cost, service overhead, budget, energy-index version, CAD/J conversion, pricing policy, and settlement receipt are separate typed fields. No token balance or browser number can represent real measured energy or settled value.
6. **Memory plane:** reads and writes are scoped to verified Unity ID; global knowledge requires permitted, validated, non-identifying evidence. Memories have source, timestamp, confidence, supersession, contradiction, and outcome links.
7. **Evidence plane:** each consequential operation has an idempotent request ID, a canonical receipt, a parent link, and a server-verifiable signature or hash anchored to durable storage. A browser-only hash chain is a local demonstration, not tamper-proof public proof.

## 2. Deterministic / probabilistic self-arbitrage

Use a versioned decision envelope, not a free-form model choice.

- **Deterministic lane:** schema checks, authentication/session checks, policy rules, exact arithmetic, canonicalization, cryptographic verification, idempotency, quota and budget enforcement, settlement, and receipt verification.
- **Probabilistic lane:** language understanding, summarization, ambiguous intent resolution, synthesis, planning, and hypotheses. It proposes; it does not grant authority or self-certify correctness.
- **Arbitration:** classify task and risk; check whether a deterministic solution exists; estimate cost/latency/uncertainty; choose the least expensive sufficient path; run independent deterministic validation; compare outputs against policy and source evidence; send any side effect through Trinity; record result and later outcome.
- **Disagreement:** verified deterministic result beats an unsupported model assertion for exact claims. Conflicting authoritative evidence becomes CONFLICT; unresolved material uncertainty becomes UNVERIFIED; missing authorization becomes DENY. Never silently average incompatible legal, identity, financial, or physical facts.
- **Learning:** retain prior belief, new evidence, reason for revision, confidence change, and measured outcome. Do not rewrite history or treat an answer's fluency as evidence.

## 3. Key indexing and identity binding

Use a server-controlled key registry with records such as:

- key_id / kid: immutable opaque identifier; never the secret.
- subject_unity_id: verified owner/subject.
- purpose: webauthn-credential, receipt-signing, service-identity, or provider-reference.
- algorithm, public_key_fingerprint, created_at, not_before, expires_at, status, version, revoked_at, rotation_parent, and evidence_ref.
- WebAuthn credential IDs are indexed by RP ID and verified subject. Challenge, origin, RP ID, user presence/verification, signature counter policy, expiry, and one-time consumption are validated server-side.
- Private keys, provider secrets, session tokens, passkey material, and raw credentials never appear in URLs, localStorage, source code, logs, or public indexes. The index stores public metadata/fingerprints only.
- A client-generated Unity ID or session stamp is a correlation hint only. The server returns the authoritative subject after validating the authenticated session.

## 4. Decision envelope and Trinity gate

Every action uses a typed envelope. The following is a contract sketch, not a live API schema:

    {
      "request_id": "unique-idempotency-key",
      "subject": {"unity_id": "server-verified-id"},
      "action": "namespace.action",
      "input_hash": "sha256-of-canonical-input",
      "policy_version": "versioned-policy",
      "evidence_refs": [],
      "resource_budget": {"cad": null, "joules": null, "tokens": null},
      "decision": "allow|deny|conflict|unverified",
      "trinity_receipt": null
    }

The gate verifies identity, action scope, policy version, evidence, budget, replay/idempotency, and authorization. Provider calls and consequential writes occur only after an explicit request-bound allow. A client-side ticket or boolean is never accepted as authority.

## 5. Joule pricing and self-arbitrage

Do not hard-code an invented energy price. Publish the source, timestamp, currency, unit, region, conversion method, calibration, and validity window of any energy index. Define:

- E_measured: measured Joules attributable to a job, with meter source and calibration version.
- P_energy: CAD per Joule derived from a named, timestamped index and explicit unit conversion.
- C_provider: separately evidenced provider invoice/usage cost in CAD.
- C_service: separately defined and disclosed service overhead.
- Candidate accounting identity: C_total = E_measured × P_energy + C_provider + C_service.

This is a candidate accounting identity, not a deployed price schedule. Do not double-count electricity if the provider cost already includes it. If energy is estimated rather than metered, label it ESTIMATED and expose its calibration/error band. If no valid index or meter exists, report UNPRICED or ESTIMATED; do not pretend it is a physics-backed settled value.

For arbitration, compare expected utility of each eligible lane against measured or explicitly estimated cost and risk. A probabilistic call is not justified merely because a provider key exists. A deterministic path is not “free” if it consumes material resources. Authorization and safety cannot be traded away for lower cost.

## 6. Merit / eFuse boundaries

- eFuse is the proposed non-tradable energy primitive; it is not sold or treated as a live energy meter until the metering, index, issuance, and audit contracts are implemented and independently tested.
- Merit is a proposed utility/access rail. Issuance and transfer rules must be explicit and verifiable; no claim of live issuance, market value, or deployed contract is valid without deployed-contract evidence.
- A local Fuel balance is a demo quota, not a ledger, payment, Joule measurement, or entitlement. Server-side atomic debit and idempotent settlement are required before paid inference can be considered production-grade.
- Payment UI state must not imply settlement. Only a verified provider webhook/receipt plus idempotent fulfillment can grant paid capability.

## 7. Website and Iris inventory gates

The static scanner is a baseline, not the end-to-end test. Release acceptance requires:

- Every served page and localized page has a canonical route, owner, purpose, and declared navigation path.
- Every link, image/script asset, form, button, click, keyboard interaction, media permission, and route is either covered by an automated test or explicitly marked as manual-only with a reason.
- Internal links resolve under the actual routing/deployment model; dynamic routes are distinguished from genuine broken paths.
- All forms validate input, reject invalid methods/origins, surface errors, and do not claim success without server receipts.
- Every Iris path reports its real stage (identity, Trinity, memory, provider, persistence) and fails closed on missing dependencies.
- Language switchers preserve route and query safely; no auth/session secrets are placed in URLs.
- Accessibility checks cover labels, focus, keyboard navigation, reduced motion, contrast, and screen-reader announcements.
- Browser journeys cover visitor, signed-in, denied, expired session, revoked key, provider unavailable, storage unavailable, duplicate request, cancel/interrupt, memory isolation, and successful persisted receipt.
- Deterministic numerical tests cover key derivation/indexing, canonical hashing, unit conversions, meter calibration/error bounds, rounding, idempotency, budget enforcement, and invariants. Property tests check no negative energy/cost, no unauthorized spend, no duplicate settlement, and no cross-Unity-ID memory access.
- Production readiness requires a staging end-to-end pass with live bindings and a recorded test receipt; passing unit tests alone is insufficient.

## 8. Current evidence and known gaps

As of the current inventory pass:

- The landing/Iris repository static scanner most recently covered 476 source files, including 244 HTML pages. It found 1,759 link-like references, 302 script/asset references, 8 form matches, 100 event-handler matches, 76 browser-storage references, 135 key-index-related lexical matches, 32 literal route patterns, 161 possible broken local references, and one duplicate DOM ID. These are heuristic counts; some local references are dynamic or route-rewritten and must be triaged.
- The public dualiscapax-hud repository was also scanned: 11 source files, no heuristic broken-local-reference findings.
- A separate read-only inventory now scans the private dualiscapax-deploy repository: 114 source/config files, 37 HTML pages, 203 link references, 41 asset references, 39 event-handler references, 8 literal API-call matches, 82 browser-storage references, 163 possible broken local references, and 0 duplicate DOM IDs. The scan found explicit ceremony_not_wired markers in 9 source files and simulated-settlement markers in 4 files. These are lexical/static counts, not proof of live behavior.
- Replit workspace, production New Jersey/Amsterdam process state, live Cloudflare bindings, and live browser journeys remain outside the CI source scans. They must be verified through authorized, read-only routes before declaring whole-system coverage.
- The local Fuel ledger is explicitly a local demonstration stub. The client-side Unity bind/session functions use browser storage and self-declared identifiers; those values cannot be authentication or authorization proof.
- The current staging branch removes the untrusted `?api=` API-base override and tests that session/fuel headers cannot be sent to a query-selected origin. The default deployment API base is still a separate existing rail and is not yet wired to the new governed runtime.
- The unified frontend's own verification notes grade the energy peg and Merit panel as DESIGN, state zero Merit issuance and no deployed Merit contract, and grade the physical binding chain as DESIGN. Keep those grades visible until live evidence changes them.
- Public-facing copy must never imply a physics-backed settled Joule price, live Merit issuance, verified biometric binding, or production-grade identity unless the corresponding proof exists.



### Staging runtime hardening increment (2026-10-23)

- The staging runtime now checks the exact configured Origin, supports a credentialed CORS preflight for the allowed origin, and rejects unapproved origins before calling service bindings. This is contract-tested; live browser/cookie behavior remains unverified until real staging bindings are configured.
- Trinity authorization now precedes private memory reads. A denied request must not access the memory adapter or provider.
- After Trinity allow, the runtime claims a request ID through the memory service before reading context or invoking a provider. Missing/ambiguous claims fail closed; duplicate claims return conflict without provider inference. The deployed memory adapter must implement the versioned `POST /v1/requests/claim` contract atomically for this protection to be real.
- Deterministic arithmetic uses a bounded parser and still passes through Trinity. Probabilistic inference is only selected when the input is not a complete exact arithmetic expression.
- The Joule helper now rejects malformed index timestamps and refuses to call a caller-labeled measurement “metered.” A price computed from supplied values is explicitly `PRICED_UNVERIFIED` for a “measured” claim until a trusted meter verifier and settlement receipt exist; estimated input remains `PRICED_ESTIMATED`. No live meter, calibrated Joule source, index, or settlement is implemented by this helper.
- The Cloudflare build log supplied for `npx wrangler preview` reports “Missing entry-point to Worker script or to assets directory.” The checked-in root `wrangler.toml` describes a static Pages site, not a Worker entry point, and has an empty `[previews]` section. That log is consistent with a command/configuration mismatch, but it does not identify which Cloudflare project emitted it. Do not change the production build command or deploy target until the failing project and intended output are confirmed. For a static Pages site, local preview and deployment should use the Pages workflow/commands for a confirmed output directory, not assume a Worker entry point exists.

## 9. Implementation sequence

1. Freeze the route/domain inventory and identify the actual production source of truth for .com, .ai, Pages, HUD, backend, and Replit. No cutover.
2. Build and triage the page/link/function map; add browser tests for every distinct interaction class and route.
3. Fix auth and API-base trust boundaries; unify all chat/voice/camera entry points behind one server-verified session contract.
4. Map existing identity, Trinity, memory, and provider services to the governed runtime adapters. Do not create duplicates until inventory proves absence.
5. Add durable memory and append-only receipts with Unity ID isolation and idempotency.
6. Implement the deterministic/probabilistic arbiter with explicit risk, confidence, provenance, and outcome evaluation.
7. Implement metering and Joule accounting only after the actual meter/index source and calibration are chosen and evidenced. Keep pricing UI marked DESIGN until then.
8. Prove staging end-to-end, then review each production change separately for explicit authorization.

**Release rule:** no “unified”, “verified”, “settled”, “autonomous”, or “production-ready” claim without a corresponding test, service evidence, and receipt.
