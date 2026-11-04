# Naming Glossary — "handoff" and "HOLD"

**Purpose (Stage B, step 4):** two words in this estate each name multiple distinct mechanisms, and Stage C work has already nearly broken on the conflation (the Stage A audit names it the main breakage risk of the handoff retirement). This glossary fixes one term per mechanism. **Stage C documents cite these terms; no term below names two mechanisms, and no mechanism below is cited by another's term.**

## "Handoff" — three referents

### H-1 · The handoff ceremony (browser ceremony)

- **What:** the cross-domain browser ceremony specified in `handshake/FRONT-INTERFACE.md`: a passkey ceremony on .com, navigation to .ai with nothing carried in the URL, a second `credentials.get` on .ai, and a `DCCP/2|…|verify=webauthn|…` line posted to `/api/v2/compute`, opening the world on `accepted: true`. Groundwork exists on PR #169; the .ai-side consumer (`/auth/consume`) exists in the Replit workspace inventory.
- **Status:** retired as a mandatory authentication mechanism by the adopted direction (Nov 3, 2026); spec retained as historical record. Its design flaw is audit finding F-3 (the posted line carries no assertion bytes).
- **Cite as:** "the handoff ceremony" or "H-1". Never as evidence at any door of the four-door contract.

### H-2 · The line dialect (scarlet law-layer dialect)

- **What:** the protocol-line format and parser in scarlet's law layer: `src/dccp/handoff.ts` (`BIND_LINE`, `readHandoff`, whose BANNED list includes `biometric`, `fingerprint`, `credential`). Consumed by law-layer checks (`elite.ts` "line-not-ceremony", `constitution.ts`, `own.ts`, `alone.ts`) and tests — **by no HTTP route**: `src/routes/api/v2/compute.ts` never calls `readHandoff`.
- **Status:** historical dialect, retained under the no-deletion rule. It authenticates no one and is load-bearing for no route. The handoff retirement does not change it, and work on it is not handoff-ceremony work.
- **Cite as:** "the line dialect" or "H-2".

### H-3 · The `unity_handoff` law op

- **What:** a signed operation in scarlet's `src/dccp/args.ts` (args `idhash/nonce/exp/fc/ct/sig`, 60-second `lawWindow`, replay refusal) belonging to the PlanckOS-lineage law core's own channel.
- **Status:** untouched by the handoff retirement, by explicit decision (audit §4.3). It is a law-core mechanism, not a browser mechanism, and shares nothing with H-1 but the word.
- **Cite as:** "the `unity_handoff` law op" or "H-3". A Stage C instruction that says "handoff" intending H-3 and is executed against H-1 (or the reverse) is the exact failure this glossary exists to prevent.

## "HOLD" — three referents

### HOLD-A · The control-plane HOLD

- **What:** an owner-issued operational hold state (DSA-004 Enforceable HOLD Architecture): a durable state with monotonic revocation epochs whose governing principle is that a HOLD must **revoke the authority to act**, not merely request that a service stop. The Nov 3, 2026 gateway HOLD is its instance of record: the stack stays down, previously scheduled automation capable of defeating it was revoked/fenced in the same act, and scheduler silence was never counted as enforcement.
- **Scope:** operational, system-wide within its declared fence. Entered and released only by the owner (or the owner's standing delegated mechanism), never inferred from a service being down — a service being down is an observation; the HOLD is a state.
- **Cite as:** "the control-plane HOLD" or "HOLD-A".

### HOLD-B · The ballot-outcome HOLD

- **What:** the `'HOLD'` outcome value of scarlet's Trinity ballot in `src/dccp/govern.ts` — one possible result of a single three-seat evaluation of one proposal/operation (Lane 2 inventory finding L2-040 flagged this collision). It decides that evaluation; it is not an operational state, fences no scheduler, revokes no standing authority, and persists nowhere beyond the ballot's own record.
- **Cite as:** "the ballot HOLD" or "HOLD-B". A Stage C sentence that reads a `govern()` HOLD outcome as the control-plane HOLD (or the reverse) misstates both mechanisms.

### HOLD-C · The held operation (op-level held state)

- **What:** the held disposition of an operation class in the machine stack: operations screened and answered as held rather than executed or denied on their merits — e.g. `args.ts`'s `MERIT_TRANSFER_HELD` outcome and canon's held messaging (audit §5 / Wave 3: `merit_transfer` / `merit_sell` are defined operations whose execution is HELD). A held operation is refused **as held**: the refusal names the hold, not a defect in the request.
- **Cite as:** "held operation" or "HOLD-C". Distinct from HOLD-B (a ballot outcome on one evaluation) and from HOLD-A (an owner-issued operational state): a held operation class is a standing product/law disposition, lifted only by the decision that governs that operation class (for Merit operations, the open D04 question — the owner's, unmade).

### Adjacent identifiers — not a fourth referent, but cite carefully

- **HOLD-01…10** are acceptance-requirement identifiers, defined in DSA-003 and redefined with refined wording in DSA-004 (the two texts are not identical; the registry crosswalk grades HOLD-10 DIVERGENT between them). They are requirement IDs, not states or outcomes. A citation must name its owning document ("DSA-004 HOLD-05"), never the bare ID.

## Citation rule

Stage C issues, contracts, and test specs cite the qualified term (H-1/H-2/H-3, HOLD-A/HOLD-B/HOLD-C, or an owning-document-qualified requirement ID). An unqualified "handoff" or "HOLD" in a Stage C document is a defect to be returned for correction, because each unqualified use has, in this estate's record, eventually been read as the wrong mechanism by someone.

---

*Stage B, step 4. Branch `stage-b-four-door-contract-20261103`, docs only. Sources: Stage A audit §§4.2, 4.3, 6 (F-3, F-6 terminology caution); Lane 2 inventory L2-040, L2-044; DSA-003/DSA-004 and the test-ID registry crosswalk (Nov 3, 2026).*
