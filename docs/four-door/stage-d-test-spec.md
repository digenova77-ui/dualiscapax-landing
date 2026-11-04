# Stage D Test Specification — Four-Door Contract

**Status: SPECIFICATION ONLY.** This document specifies the Stage D acceptance tests for the four-door contract (`four-door-contract.md`). It runs against **nothing live**: no test here is executed by this document, no environment is stood up by it, and no credential is created, enrolled, or consumed in its preparation. When Stage D is authorized, these tests run in an isolated test environment against a test deployment of the contract's components, with test credentials enrolled for that environment only — never the Father's production credential, and never first enrollment.

**Conventions.** Every test states: purpose, preconditions/fixtures, inputs (steps), and expected result. Refusals cite the contract's failure vocabulary (`four-door-contract.md` §7) by exact code. **Global fail-closed invariant (applies to every test, stated once):** after any refusal — (i) no partial state from the attempt persists (no session, receipt, approval consumption, or verdict is half-written), (ii) no execution receipt exists for the attempt, (iii) the same material presented again receives the same refusal (no refusal is stateful in the caller's favour), and (iv) no fallback door or alternate path is consulted automatically.

**Fixture vocabulary.** `FV` = canonical verifier (test instance). `FATHER_CRED` = a test passkey credential enrolled in FV's test store for the test Father principal. `OP` = a canonical test operation `{ action: "test.op", audience: "test-consumer", payload: {"amount":1,"unit":"test"}, policy_context: "TEST-POLICY@1" }`. `GOOD_APPROVAL` = an approval object for OP with all five fields correctly bound, minted through a genuine Door-2 verification. `GOOD_VERDICT` = a Trinity ALLOW bound to GOOD_APPROVAL.

---

## Group 1 — The success path

### T-01 · Full success, all four doors
- **Purpose:** the one path that may execute.
- **Steps:** (1) FV issues a challenge; complete the ceremony with FATHER_CRED (correct origin, correct RP ID, user verification performed). (2) Read the session; confirm the verification receipt exists and names the Father principal. (3) Mint GOOD_APPROVAL bound to that receipt. (4) Present GOOD_APPROVAL to Door 4; obtain GOOD_VERDICT. (5) Dispatch OP with session + approval + verdict.
- **Expected:** verification succeeds; session issued (hash-only storage verifiable in the store); receipt issued; approval accepted; verdict ALLOW; execution occurs; **execution receipt exists** naming approval_id, verdict, payload digest. UI states 1–6 each read positive from their own source (contract §8).

### T-02 · Success path leaves nothing reusable
- **Purpose:** every single-use element is spent by T-01's success.
- **Steps:** repeat T-01 step (5) with the identical session, approval, and verdict.
- **Expected:** refusal `APPROVAL_CONSUMED`; no second execution; no second execution receipt.

## Group 2 — Door 2 refusals

### T-03 · Invalid assertion
- **Inputs:** a ceremony response whose assertion signature does not verify against the enrolled credential (e.g. signed by a different key).
- **Expected:** refusal `ASSERTION_INVALID`; no session; no receipt; the challenge is not left in a state that lets the same response be retried into success.

### T-04 · Expired challenge
- **Inputs:** a valid assertion for a challenge presented after its 300-second TTL.
- **Expected:** refusal `CHALLENGE_EXPIRED`; no session; no receipt.

### T-05 · Replay of ceremony material
- **Inputs:** complete one successful verification; then present the identical ceremony response a second time.
- **Expected:** second presentation refused `CHALLENGE_CONSUMED`; exactly one session and one receipt exist.

### T-06 · Wrong origin
- **Inputs:** a valid assertion presented with an Origin other than the configured application origin.
- **Expected:** refusal `ORIGIN_REJECTED`, issued **before** any ceremony state is consumed or written.

### T-07 · Wrong RP ID
- **Inputs:** an assertion produced for a different RP ID than the pinned `dualiscapax.com`.
- **Expected:** refusal `RP_ID_MISMATCH`; no session; no receipt.

### T-08 · Device verification absent
- **Inputs:** a ceremony completed without user verification (UV flag false).
- **Expected:** refusal `UV_REQUIRED`; no downgrade path exists (no configuration or parameter in the test changes this outcome).

### T-09 · Caller-supplied Boolean is not proof
- **Inputs:** requests to the verifier's session/protected surfaces carrying asserted flags in place of ceremony material (e.g. body fields claiming authentication, approval, or verification success), with no ceremony performed.
- **Expected:** refusal (`SESSION_ABSENT` / `ASSERTION_INVALID` as applicable per surface); no state is created. This test also covers Door-1 material: a Door-1 (Better Auth) session presented at Door 2 is refused the same way.

### T-10 · Disabled verifier reads as refused, never as passed (F-4 consumer rule)
- **Inputs:** with the Door-2 service disabled/unconfigured, call every consumer-facing session check and every protected surface that depends on one.
- **Expected:** the check surface reports refusal-class results only (`VERIFIER_UNCONFIGURED` / `SESSION_ABSENT`); any helper shape equivalent to `{ ok: true, required: false }` is consumed by test consumers as **not authenticated**; no protected surface admits the call. A consumer found checking the permissive field alone fails this test by name, per `four-door-contract.md` §3.

## Group 3 — Door 3 refusals: the five fields, one at a time

**Common setup for T-11…T-16:** a genuine Door-2 verification and session exist. Each test breaks exactly one thing. In every case the expected result is refusal at Door 3 (or at the Door-4 boundary, `APPROVAL_INVALID`), Door 4 is not reached on the broken approval, and no execution occurs.

### T-11 · Approval absent entirely
- **Inputs:** session + dispatch attempt for OP with no approval object.
- **Expected:** `APPROVAL_ABSENT`.

### T-12 · Exact action not bound
- **Inputs:** an approval minted for action `test.other`, presented for OP's `test.op`.
- **Expected:** `APPROVAL_ACTION_MISMATCH`.

### T-13 · Audience not bound
- **Inputs:** GOOD_APPROVAL (audience `test-consumer`) presented to a different consuming service.
- **Expected:** `APPROVAL_AUDIENCE_MISMATCH` at the presenting service; the approval remains unconsumed (the mismatch refusal does not burn it for its true audience — consumption happens only on a fully verified presentation).

### T-14 · Canonical payload digest not bound
- **Inputs:** GOOD_APPROVAL presented while the dispatched payload differs from the approved payload in any field (sub-case a: a value changed; sub-case b: the payload is the approved values serialized non-canonically by the *caller* in an attempt to pass a digest over different bytes).
- **Expected:** `APPROVAL_DIGEST_MISMATCH` in both sub-cases; the changed payload is never executed under the original approval.

### T-15 · Policy/version context not bound
- **Inputs:** (a) an approval minted with policy context absent/null; (b) GOOD_APPROVAL presented after the governing policy version has advanced past `TEST-POLICY@1`.
- **Expected:** (a) issuance itself refuses `POLICY_CONTEXT_ABSENT` — no such approval can exist to present; (b) `APPROVAL_POLICY_STALE`.

### T-16 · Expiry not bound / approval expired
- **Inputs:** GOOD_APPROVAL presented at or after its `expires_at`.
- **Expected:** `APPROVAL_EXPIRED`; the approval does not execute "one last time," and its expiry is evaluated at consumption, not at presentation of earlier steps.

### T-17 · Approval without a live verification receipt
- **Inputs:** an approval object whose bound verification receipt is (a) absent, (b) expired, (c) invalidly signed, (d) naming a different principal than the approval's issuer.
- **Expected:** `RECEIPT_ABSENT` / `RECEIPT_EXPIRED` / `RECEIPT_INVALID` / `RECEIPT_PRINCIPAL_MISMATCH` respectively.

## Group 4 — Door 4 and execution refusals

### T-18 · Missing Trinity evidence
- **Inputs:** session + GOOD_APPROVAL + dispatch attempt with no verdict.
- **Expected:** `TRINITY_EVIDENCE_ABSENT`; no execution; the approval is not consumed by the failed dispatch (it may still be evaluated — consumption of an approval happens at execution, Trinity evaluation failure does not burn it; if an implementation binds consumption to evaluation instead, that binding must be stated in its conformance note and this expectation adjusted by recorded amendment, not silently).

### T-19 · Invalid Trinity evidence
- **Inputs:** (a) a verdict with an invalid signature; (b) an expired verdict; (c) GOOD_VERDICT re-presented against a *different* approval.
- **Expected:** `TRINITY_EVIDENCE_INVALID` / `VERDICT_EXPIRED` / `VERDICT_BINDING_MISMATCH`.

### T-20 · Trinity DENY is final for that approval
- **Inputs:** an approval that Door 4 evaluates to DENY; then a second dispatch attempt with the same approval.
- **Expected:** first attempt `VERDICT_DENIED`; second attempt also refused (no re-evaluation shopping); executing the operation requires a new approval and a new evaluation.

### T-21 · Authentication alone never authorizes execution
- **Inputs:** a genuine Door-2 verification and live session, then a dispatch attempt for OP **without** any approval and **without** any verdict.
- **Expected:** refusal (`APPROVAL_ABSENT`); no execution; and the UI-state check: state 5 (Trinity) renders "absent" and state 6 renders "did not occur" — any rendering of these states as positive from authentication success fails this test. (Direction §3's core requirement, tested as behaviour, not as copy.)

### T-22 · Approval alone never authorizes execution
- **Inputs:** session + GOOD_APPROVAL, no verdict, dispatch attempt.
- **Expected:** refusal (`TRINITY_EVIDENCE_ABSENT`); no execution receipt. Doors 1–3 in perfect order substitute for Door 4 in no configuration this test can construct, including with Door 1 additionally signed in.

### T-23 · Material change between approval and dispatch invalidates
- **Inputs:** GOOD_APPROVAL + GOOD_VERDICT obtained; then the payload is modified before dispatch and dispatch is attempted with the modified payload.
- **Expected:** refusal at dispatch (`APPROVAL_DIGEST_MISMATCH`); the modified payload is not executed; the original verdict does not rescue it (a verdict binds the digest it evaluated).

## Group 5 — UI-state integrity (direction §3)

### T-24 · Six states, six sources
- **Inputs:** drive a test client through: (a) no session; (b) session, no approval; (c) approval, no verdict; (d) verdict DENY; (e) full success.
- **Expected:** at each step, each of the six states renders **only** from its own server-read truth (`four-door-contract.md` §8): state 4 is negative in (a)–(b) despite state 1 being positive in (b); state 5 shows DENY in (d); state 6 is "did not occur" in (a)–(d) and positive only in (e), backed by the execution receipt. Any state rendered positive from another state's truth, or from a client-side claim (including a self-declared local identity — audit F-2), fails this test.

### T-25 · Grant-successor acceptance rule (handoff package §3)
- **Inputs:** for any grant mechanism proposed under the de-mandatory package (if none is proposed at Stage D time, this test is recorded NOT APPLICABLE with that reason, not skipped silently): attempt (a) second use of one grant, (b) use at a non-named audience, (c) use after expiry, (d) a client-assembled grant-shaped token with no server issuance.
- **Expected:** all four refused; consumption is atomic under concurrent presentation of the same grant (exactly one success at most, and only for a fully valid first presentation).

## Coverage map (direction §5 Stage D → this spec)

| Direction Stage D item | Tests |
|---|---|
| Successful authentication | T-01, T-02 |
| Invalid assertions | T-03 |
| Expired challenges | T-04 |
| Replay attempts | T-05, T-02 |
| Wrong origin and RP ID | T-06, T-07 |
| Missing Father approval | T-11, and per-field: T-12 (action), T-13 (audience), T-14 (digest), T-15 (policy/version), T-16 (expiry) |
| Missing or invalid Trinity evidence | T-18, T-19, T-20 |
| Authentication alone never authorizes execution | T-21 (also T-09, T-22) |
| All failures remain fail-closed | The global invariant, asserted in every test; T-10 and T-24 test the two surfaces where fail-open has already been observed in this estate (F-4, F-2) |

**Acceptance of Stage D (when authorized and run):** every test passes with its exact expected code; any test failing, and any test **not executed**, is reported as such — a skipped or unexecuted test is not a passing test, and the run report must carry per-test EXECUTED / NOT EXECUTED outcomes with the environment's identity (commit SHAs of every component under test) attached.

---

*Stage B, step 5. Branch `stage-b-four-door-contract-20261103`, docs only — this spec runs against nothing live. Sources: adopted direction §5 Stage D; `four-door-contract.md` §§3–8; Stage A audit §5 (the five-field ledger), §6 (F-1, F-2, F-4).*
