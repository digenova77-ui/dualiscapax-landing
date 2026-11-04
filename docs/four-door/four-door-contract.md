# The Four-Door Contract

**Status: SPECIFICATION — Stage B proposal-stage document.** This contract specifies the DualisCapax Father authentication flow under the adopted Frontend Architecture Update & Father Authentication Simplification (Nov 3, 2026). It authorizes no implementation, deployment, enrollment, or credential act. It is written against the Stage A audit (Nov 3, 2026): the Door-3 ledger (§5), the dependency map (§8), and the verifier recommendation (§9), and against the proposed ruling paper (Stage B step 1), whose signature settles the canonical verifier this contract names.

**The acceptance contract, in one paragraph:** four independent doors — (1) ordinary application sign-in, (2) Father device authentication, (3) Father approval of the exact operation, (4) independent Trinity authorization. **No layer may borrow proof or authority from another.** Ordinary sign-in, Father authentication, and Father approval cannot substitute for Trinity authorization. Father is the sole writing authority; Trinity is the sole authorization gate; DCLM evaluates deterministic law and never grants authority. Every refusal in this contract is **fail-closed** and carries a named failure code (§7).

---

## 1. Actors and artifacts

| Term | Meaning in this contract |
|---|---|
| **Father principal** | The single enrolled Father identity, established by enrollment in the canonical verifier's credential store (the single credential home, ruling-paper clause (c)). Which credential is the Father's is an enrollment fact; it is never inferred from code, session state, or self-declaration. |
| **Canonical verifier** | The isolated Father authentication service (PR #200 Worker shape) — the ONE Door-2 verifier, per the proposed ruling. Better Auth is Door 1's system and is never a Door-2 verifier. |
| **Verification receipt** | The signed artifact the canonical verifier issues on a successful Door-2 verification (ruling-paper clause (d)). Door 3 binds to this receipt — never to a session flag, a Boolean, or the fact of login. |
| **Approval object** | The Door-3 artifact (§4): the Father's approval of one exact operation, carrying the five bound fields. |
| **Trinity verdict** | The Door-4 artifact (§5): Trinity's independent authorization decision over one approval object. |
| **Execution receipt** | The record that execution actually occurred (§6), issued only after a Door-4 ALLOW and actual execution. Its absence means execution did not occur. |

## 2. Door 1 — Ordinary application sign-in (out of the Father path)

- Door 1 is ordinary application sign-in (in scarlet, Better Auth under its skill: Google / X via the Grok broker, or local email/password). It identifies an application user. It is **not** Father proof, at any strength, under any configuration.
- No artifact of Door 1 (session, cookie, token, claim) is an input to Doors 2, 3, or 4. A flow that requires a Father act must not accept, consult, or display Door-1 state as evidence for any other door.
- Door 1 may be absent, disabled, or unconfigured without affecting Doors 2–4. (Current estate state, per the audit: Door 1 is text-only — `VITE_AUTH_ENABLED=false`, no sign-in route in the app tree. That is a Door-1 fact only and changes nothing below.)

## 3. Door 2 — Father device authentication (the canonical verifier)

**Flow: verify → session → receipt.**

1. **Challenge.** The verifier generates the challenge server-side and writes it to its own store before serving ceremony options, with `expires_at = issued_at + 300s` and a single-use marker. A challenge not present in the store, already consumed, or past expiry is refused (`CHALLENGE_UNKNOWN`, `CHALLENGE_CONSUMED`, `CHALLENGE_EXPIRED`).
2. **Ceremony.** WebAuthn authentication ceremony against the enrolled credential: `RP_ID = "dualiscapax.com"` pinned; exact Origin match against the configured application origin enforced **before** all routes; `userVerification` required — a verification result without device user verification is refused (`UV_REQUIRED`), never downgraded.
3. **Verification.** The verifier verifies the assertion with its pinned verification library (`@simplewebauthn/server` shape): signature, challenge equality with the stored unconsumed challenge, origin, RP ID, and user-verified flag. Any mismatch refuses with its named code (§7). **The verifier consumes the challenge atomically at verify** — a second presentation of the same ceremony material is a replay and is refused (`CHALLENGE_CONSUMED`).
4. **Session.** On success the verifier issues a session: a random token of which **only the SHA-256 hash is stored server-side**, delivered in a `__Host-` cookie (Secure, HttpOnly, SameSite=Strict), with a server-side expiry and server-side revocation (logout revokes; revocation is checked on every read). The session proves *that a Door-2 verification succeeded for the Father principal at a time* — nothing more. **A session is not an approval and not an authorization.**
5. **Verification receipt.** On the same success the verifier issues the signed **verification receipt** of ruling-paper clause (d): verified principal, credential identifier, verification time, user-verification result, RP ID and origin verified against, unique receipt identifier, receipt expiry — signed by the verifier. This receipt, and only this receipt, is what Door 3 binds to.

**Consumer rule (finding F-4, written down as required):** any helper or session check that can report both "the check ran" and "authentication was actually required and passed" must be consumed on the second value only. Concretely, for scarlet's `requireUnitySession` shape — `{ ok: true, required: false, unityId: null }` when Door 2 is disabled — **a consumer must check `required` (and a non-null principal), never `ok` alone.** A check that reads `ok: true, required: false` as "authenticated" borrows "no authentication" as "authentication passed" and is a contract violation wherever it appears. The canonical verifier's own check surface must not offer an ambiguous shape: its session read returns either a verified principal or a refusal (`SESSION_ABSENT`, `SESSION_EXPIRED`, `SESSION_REVOKED`) — there is no "ok but not required" state.

**Never accepted at Door 2:** raw biometric material (never transmitted or stored — the authenticator holds it); a caller-supplied Boolean as proof of authentication; a client-side claim of device verification (device verification is true only as verified server-side); a Door-1 session; a self-declared identity (audit F-2 — a client-minted local identity is below Door 1 and is evidence for nothing).

## 4. Door 3 — Father approval of the exact operation (the approval object)

Door 3 exists only as the **approval object**: a signed artifact issued under the Father principal, through the Door-2-verified session, binding the verification receipt. Per the audit §5 ledger, all five fields are **not bound** in the current estate; this section is the schema those findings specify. Each field names its enforcement point. **Any material change to a bound field invalidates the approval** — the object is refused at consumption, not reinterpreted.

| # | Field | Schema | Enforcement point |
|---|---|---|---|
| 1 | **Exact action** | `action`: the canonical identifier of the one operation approved (verb + target, from the consuming service's action vocabulary — no wildcards, no families) | **Issuance:** the approval is minted for exactly the action presented in the Father's approval act. **Consumption:** the executing service refuses any action not string-equal to `action` (`APPROVAL_ACTION_MISMATCH`). One approval, one action, ever. |
| 2 | **Audience** | `audience`: the identity of the single consuming service (its canonical service identifier, e.g. the Door-4 endpoint or executing service that will consume this approval) | **Consumption:** the consuming service verifies `audience` equals its own identity before any other check is trusted; any other service refuses (`APPROVAL_AUDIENCE_MISMATCH`). An approval is not portable across services. |
| 3 | **Canonical payload digest** | `payload_digest`: `sha256:<hex>` over the canonical serialization (RFC 8785 JCS) of the exact payload the action will execute | **Issuance:** computed over the payload as presented for approval. **Execution:** recomputed over the payload actually dispatched and compared; any difference refuses (`APPROVAL_DIGEST_MISMATCH`). A digest computed for a different serialization is a different digest and does not match. |
| 4 | **Policy / version context** | `policy_context`: the policy identifier and version under which the approval was given (the same policy identity Door 4 evaluates; a null or unset policy context is **not a valid value** — issuance refuses, `POLICY_CONTEXT_ABSENT`) | **Issuance:** the current policy id+version is bound in. **Dispatch:** re-validated at consumption — if the governing policy or its version has changed since issuance, the approval is invalid (`APPROVAL_POLICY_STALE`), however fresh its expiry. |
| 5 | **Expiry** | `expires_at`: an absolute time, set at issuance, short-lived by policy; plus `approval_id` (unique, single-use) | **Consumption:** checked fail-closed at the moment of consumption — an approval at or past `expires_at` refuses (`APPROVAL_EXPIRED`), it does not merely age. The `approval_id` is consumed atomically at first use; a second presentation refuses (`APPROVAL_CONSUMED`). |

**Binding to Door 2:** the approval object carries `verification_receipt_id` and is signed/keyed under the authority established by that receipt. An approval presented without a live, unexpired verification receipt from the canonical verifier is refused (`RECEIPT_ABSENT`, `RECEIPT_EXPIRED`, `RECEIPT_INVALID`). An approval whose receipt names a different principal than the approval's issuer is refused (`RECEIPT_PRINCIPAL_MISMATCH`).

**What Door 3 is not:** it is not a session, not a login, not a standing permission. It confers nothing by itself: a perfectly bound approval may still be denied at Door 4, and **Door 4 must remain free to deny an approval that is perfectly bound.**

## 5. Door 4 — Independent Trinity authorization

1. **Input.** Trinity evaluates exactly one approval object: its five bound fields are verified first (any failure is a Door-3 refusal, §7, and Trinity is not reached on a malformed or unbound approval — `APPROVAL_INVALID` at the Door-4 boundary).
2. **Principal provenance.** Trinity's verdict is issued over the principal established by the verification receipt bound into the approval — **never over a caller-supplied principal.** (Audit F-1: landing main's `/v1/authorize` currently accepts a body-supplied principal with no session; that is the estate's one live door-borrowing path and is non-conformant with this contract. Its session-binding fix exists as unmerged PR #201; disposition is the owner's, and no part of this contract merges it.)
3. **Independence.** Trinity's decision is its own: it does not inherit Door 2's success or Door 3's binding as reasons to allow. DCLM evaluates deterministic law **inside** the Trinity process as an evaluating seat; DCLM alone grants nothing, and no solo-grant path may exist (audit F-6: none found in scarlet `src/`).
4. **Output.** A signed verdict: ALLOW or DENY, bound to the `approval_id`, the `payload_digest`, and the `policy_context` it evaluated, with its own expiry. A verdict for one approval authorizes no other approval (`VERDICT_BINDING_MISMATCH` on any reuse). DENY is final for that approval; a denied operation requires a new approval and a new evaluation.
5. **Missing or invalid evidence.** Absent verdict, expired verdict, verdict signed by an unrecognized key, or verdict whose bindings do not match the approval presented — all refuse execution (`TRINITY_EVIDENCE_ABSENT`, `TRINITY_EVIDENCE_INVALID`, `VERDICT_EXPIRED`, `VERDICT_BINDING_MISMATCH`). **Authentication alone never authorizes execution; approval alone never authorizes execution.**

## 6. Execution and the execution receipt

1. Execution is attempted only with: a live Door-2 session, an unconsumed unexpired approval object whose five fields all verify, and an unexpired Trinity ALLOW bound to that approval. Any missing element refuses before any side effect (`EXECUTION_PRECONDITION_MISSING`, naming the missing element in the refusal detail).
2. The payload executed is the payload whose digest is bound in the approval — recomputed at dispatch (§4, field 3); a change between approval and dispatch refuses, it does not execute the changed payload under the old approval.
3. On execution, the executing service issues an **execution receipt**: `approval_id`, verdict identifier, `payload_digest`, action, audience, execution time, and outcome. **Execution "actually occurred" is true only where this receipt exists.** Systems that record a job with `authorized: false`, demo surfaces, and settlement-refusing paths record, honestly, that execution did not occur.
4. Settlement and production execution remain under their own standing gates (production policy unset refuses; settlement refuses unconditionally in current configuration). This contract does not lift any of them.

## 7. Failure vocabulary — every refusal is named and fail-closed

A refusal is a terminal answer for that attempt: no partial state is committed, no fallback door is consulted, no retry succeeds on the same material. Codes are stable strings; a consumer must not map any code to success.

**Door 2:** `ORIGIN_REJECTED` · `RP_ID_MISMATCH` · `CHALLENGE_UNKNOWN` · `CHALLENGE_EXPIRED` · `CHALLENGE_CONSUMED` · `ASSERTION_INVALID` · `UV_REQUIRED` · `CREDENTIAL_UNKNOWN` · `SESSION_ABSENT` · `SESSION_EXPIRED` · `SESSION_REVOKED` · `VERIFIER_UNCONFIGURED` (503-class: the verifier refuses rather than improvises).

**Receipt:** `RECEIPT_ABSENT` · `RECEIPT_EXPIRED` · `RECEIPT_INVALID` · `RECEIPT_PRINCIPAL_MISMATCH`.

**Door 3:** `APPROVAL_ABSENT` · `APPROVAL_INVALID` · `APPROVAL_ACTION_MISMATCH` · `APPROVAL_AUDIENCE_MISMATCH` · `APPROVAL_DIGEST_MISMATCH` · `POLICY_CONTEXT_ABSENT` · `APPROVAL_POLICY_STALE` · `APPROVAL_EXPIRED` · `APPROVAL_CONSUMED`.

**Door 4:** `TRINITY_EVIDENCE_ABSENT` · `TRINITY_EVIDENCE_INVALID` · `VERDICT_DENIED` · `VERDICT_EXPIRED` · `VERDICT_BINDING_MISMATCH`.

**Execution:** `EXECUTION_PRECONDITION_MISSING` (detail names the missing element).

Unnamed failures do not exist under this contract: any condition not listed that prevents a check from completing resolves to that door's most general refusal (`ASSERTION_INVALID`, `APPROVAL_INVALID`, `TRINITY_EVIDENCE_INVALID`) — never to a pass.

## 8. The six UI states (direction §3) — each bound to exactly one server-read truth

The interface communicates six states. **Each state reads exactly one server-side truth**, named below from the audit §8 table as updated by this contract. No state may be rendered from another state's success, from a client-side claim, or from authentication alone. In particular, state 4 renders only from an approval object, and state 5 only from a Trinity verdict — an interface that displays "authorized" on biometric success violates the direction and this contract.

| # | UI state | Its one server-read truth |
|---|---|---|
| 1 | Father authentication status | The canonical verifier's session read (§3.4): a verified Father principal, or a named session refusal. (Today: no live source — nothing deployed; the state renders "not established," never a guess.) |
| 2 | Device verification succeeded | The verifier's verification result for the ceremony in question: the server-side user-verification outcome recorded in the verification receipt (§3.5). Client claims are not truth. |
| 3 | Server verified the assertion | The canonical verifier's verify outcome for that ceremony (the receipt's existence is its positive form; its §7 code is its negative form). |
| 4 | Father approval exists for this operation | The approval object store: an unconsumed, unexpired approval whose `action`, `audience`, and `payload_digest` match this operation exactly (§4). Nothing else renders this state — in particular, never authentication success. |
| 5 | Trinity authorized / denied | The Door-4 verdict bound to this approval (§5.4): ALLOW, DENY, or absent — rendered as recorded, on the surface that issued it. |
| 6 | Execution actually occurred | The execution receipt (§6.3) for this approval. Absent a receipt, the state is "did not occur" — which is the honest current value everywhere in production configuration. |

## 9. Non-goals and standing boundaries

- This contract does not retire the cross-domain handoff (see `handoff-de-mandatory-package.md`), does not resolve any PR, and does not alter the gateway HOLD, the DSA-004 programme, or any production configuration.
- Door terminology in this contract follows `naming-glossary.md`; no term here names two mechanisms.
- Conformance is tested by `stage-d-test-spec.md` — a specification that runs against nothing live.

---

*Stage B, step 2. Branch `stage-b-four-door-contract-20261103`, docs only. Sources: adopted direction §§2–3; Stage A audit §§5, 6 (F-1, F-2, F-4, F-6), 8, 9; proposed ruling paper clauses (b)–(d).*
