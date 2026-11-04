# Handoff De-Mandatory Package

**Status: Stage B proposal-stage document.** The adopted direction (Nov 3, 2026) retires the .com → .ai cross-domain handoff ceremony as a **mandatory** authentication mechanism. This package records what that retirement touches, what it does not touch, and the dispositions that remain **owner decisions**. It closes, modifies, or merges **no** pull request; it deletes nothing; it edits no existing file. The historical marking of the ceremony spec is a separate new note: `front-interface-historical-note.md`.

Terminology follows `naming-glossary.md`: "the handoff ceremony" is the browser ceremony only.

## 1. What is retired, precisely

The **requirement** — not the artifacts. From adoption forward:

- No authentication flow may require the ceremony (the .com passkey ceremony, navigation, and .ai second ceremony) as a step.
- No surface may treat ceremony completion, or the `DCCP/2` line it posts, as evidence at any door of the four-door contract.
- The .com and .ai product roles are unchanged: .com remains the primary public face and narrative front door; .ai remains the 3D environment and HUD experience. Authentication is independent of the navigation between them (canonical verifier on the .com platform; .ai consumes sessions and verdicts, never ceremonies — audit §9).

## 2. The dependents, and what happens to each

Per the Stage A audit §4.3, the breakage surface is confined to two draft PRs, one docs pair, and the Replit workspace's entry flow. **Nothing on landing main breaks** — the ceremony was never completed there.

### 2.1 `handshake/FRONT-INTERFACE.md` (landing main)

- **Disposition: retained on main, marked historical by reference** (`front-interface-historical-note.md`). Not deleted, not edited. It stays as the design record, including the F-3 flaw and the record's own correction.

### 2.2 PR #169 — `feat/unity-com-ai-handoff` @ `5b7aeb9624` (draft)

Carries: `.well-known/webauthn` (the related-origin file listing the two .ai origins), `handshake/unity-browser.mjs` (the browser ceremony module), `handshake/SECURITY-GATE.md`.

- Under de-mandatory, this PR loses its reason to land **as handoff work**: the `.well-known/webauthn` file is required only by the related-origin ceremony, and the browser module implements the retired ceremony.
- Non-handoff residue: the module's own written rule — a verified proof must be bound server-side; the DCCP line alone is forgeable and must never grant authority — is doctrine the estate keeps regardless of the PR's fate (it is restated as the acceptance rule in §3 below).
- **Disposition: FOR OWNER DECISION.** Options the owner may choose among: close as superseded by the adopted direction; leave open as historical draft; or re-scope (not recommended by this package — its contents are ceremony-shaped). **This package does not close or modify the PR.**

### 2.3 PR #198 — `audit/webauthn-transactional-handoff-20261030` @ `5d48043d19` (draft)

Carries: transactional handoff issuance **and** an imported WebAuthn issuer core (`__Host-` cookie, `identity_session` sha256 lookup with expiry and revocation) of the same lineage as scarlet's `src/lib/auth`.

- Under de-mandatory, the transactional-handoff issuance loses its reason to land; the hardened successor it embodies (server-verified assertion → single-use grant → atomic consumption, also prescribed by `docs/ops/DIAMOND_FLOOR_EXECUTION_PLAN.md`) is governed by the acceptance rule in §3 if any grant mechanism is ever proposed again.
- Non-handoff residue: the issuer core is Door-2 lineage — session issuance with hash-only lookup, expiry, and revocation. Its design facts are already absorbed into the four-door contract's Door-2 session requirements (`four-door-contract.md` §3.4); the PR itself is not the canonical verifier and, under the proposed ruling, cannot become a second credential home.
- **Disposition: FOR OWNER DECISION.** Options: close as superseded; leave open as historical draft; or re-scope its session-issuance material into the canonical-verifier work under separate authorization. **This package does not close or modify the PR.**

### 2.4 The Replit workspace consumer — `/auth/consume` (reconciliation item)

- The Replit workspace's `server/identity.js` route family includes `/auth/consume` and `/auth/handoff/revoke`, with the session-gated protected-world route `/holographic-core/v2/` behind them (Oct 25, 2026 inventory, REPORTED grade; live state UNKNOWN — Stage A audit §7).
- **Specification (reconciliation item, not an action):** the session those routes establish is a *session* mechanism that survives independently of how it was earned. When the Replit reconciliation is performed (audit §10 step 6 — read-only inventory first, gated on the founder-hand estate-door endpoint; out of scope for Stage B), `/auth/consume` is to be **re-pointed at the canonical verifier**: it consumes a canonical-verifier session/verification outcome instead of a ceremony handoff, or it is retired as an entry path if the reconciliation finds it ceremony-only. It is not deleted by this package, and nothing in the workspace is touched by Stage B.
- Until that reconciliation, the workspace's entry flow stands as inventoried — one entry path among others, not the gate.

### 2.5 What retirement does NOT touch

- **Scarlet's line dialect** (`src/dccp/handoff.ts`, `readHandoff`, the `elite`/`constitution` law-layer checks): law-layer artifacts whose subject is the bind line itself; they authenticate no one and are load-bearing for no HTTP route. They become historical dialect, retained under the no-deletion rule. Not the browser ceremony (see glossary).
- **The `unity_handoff` law op** (`src/dccp/args.ts`): a signed operation of the PlanckOS-lineage law core's own channel. Retirement of the ceremony does **not** touch it. Conflating the two is the main breakage risk in this retirement, and is why the glossary exists.
- **Landing main generally:** `.well-known/` on main contains only `security.txt` today; the ceremony's required file was never added there, and de-mandatory means it never needs to be.

## 3. The acceptance rule for any future grant (binding on successors)

> **No grant-shaped successor repeats F-3's flaw. Any future grant mechanism — handoff grant, session grant, cross-surface grant of any name — is server-issued, single-use, audience-bound, and expiry-bound, and is consumed atomically, or it does not ship.**

Unpacking the rule, so it cannot be satisfied in spirit only:

- **Server-issued:** the grant is minted by a server after server-side verification of cryptographic material (an assertion, a receipt, a verdict). A client-assembled line, token, or claim — however well-formed — is not a grant. (F-3 was precisely a forgeable client line treated as acceptance.)
- **Single-use:** the grant carries a unique identifier consumed at first use; a second presentation refuses.
- **Audience-bound:** the grant names the one consuming service; any other service refuses it.
- **Expiry-bound:** the grant carries an absolute expiry checked fail-closed at consumption; an expired grant refuses, it does not age into acceptance.
- **Consumed atomically:** consumption and the state change it enables happen as one atomic step, so no race mints two uses from one grant.
- A proposal that cannot state how it satisfies all five properties, with its enforcement points named, does not proceed past proposal stage.

## 4. What remains owner-gated after this package

1. The dispositions of PR #169 and PR #198 (§2.2, §2.3) — decision only; execution of either (close, re-scope) is a separate act.
2. The Replit reconciliation (§2.4) — gated on the estate-door endpoint (founder-hand) and on Stage C authorization.
3. Any future grant mechanism — gated on §3's rule and its own proposal.

---

*Stage B, step 3. Branch `stage-b-four-door-contract-20261103`, docs only. Sources: adopted direction §1; Stage A audit §§4, 6 (F-3), 7, 10 step 3.*
