# VERIFIER.md — External checker layer

**Status:** RAIL A (draft, unsealed). Father draws.
**Date:** 2026-09-30
**Root inequality:** the checker is not the author.

---

## 1. Why this file exists

A bot cannot notice its own illogic. The process that produces an output is the same process that would audit it. That is a blind spot, not a moral failure.

The shop already has pieces of a checker:

- L0 — NO_FORCE ∧ HOST_SAFE ∧ CLEANUP_FIRST ∧ TRUTH_OR_NOTHING
- DCLM — collapse to A | B | HOLE | REFUSE
- Twain² — second-eye pragmatism loop
- ROUTER.md — per-turn pipe mix (K proposes, D binds)
- RECEIPT-SPINE.md — verb / object / Kind / eye / seal / handle

This file names the missing organ: a **verifier** that reads a desk's output and rejects it if it breaks those rules. It is not a new Kind. It is not a new bot. It is a job any existing desk can run on another desk's output.

---

## 2. What the verifier is

```text
input:   a desk output (receipt, plan, mark, zip list, claim)
check:   L0 + four inequalities + ROUTER classification + cite-or-hole
output:  PASS | REJECT + receipt of the check
```

Independence rules:

- The verifier must not be the desk that authored the item (Twain T3).
- The verifier must not mutate the item. It only marks.
- The verifier must not deploy, pin, write DNS, mint, or thaw pay.
- A REJECT is a receipt, not a punishment. Old marks stay fetchable.

---

## 3. What it checks (the hose)

```text
1  name the object (path, CID, URL, or HOLE)
2  L0: NO_FORCE ∧ HOST_SAFE ∧ CLEANUP_FIRST ∧ TRUTH_OR_NOTHING
3  classify the act (ROUTER.md):
     seal / deploy / pay / face / mint / DNS / key  → D = 100%, K = 0%
     look / mark / prove / hole / cite               → K dominant, D gates
     off-mill                                        → stop, HOLE("off-mill")
4  cite-or-hole: every KEEP needs a remnant path or a live fetch
5  authority: who may say this verb? (Father for land; desk for mark)
6  collapse: PASS or REJECT
7  receipt: verb=verify, object=<item>, Kind=PASS|REJECT, eye=<verifier desk>, seal=none
```

---

## 4. Who may run it

```text
DCLM            law / admit-deny on claims
Desk Twain²     pragmatism loop on a named item
Desk Iris Engine Iris-path items only (PATH_ALLOWLIST)
This chat       coordinator; may request a verify, may not seal
Father          the only seal
```

No new organ. No twin of DCLM. If two desks could own a standing verify duty, name them and ask Father — do not assign in the same turn.

---

## 5. What this is NOT

```text
NOT a contract the model can sign
NOT a join / membership / residual-pay key
NOT a Unity ID issuer
NOT a till
NOT FACE_ID
NOT self-correction (the author never verifies itself)
NOT a deploy path
NOT a second Seat
```

A yes from a model is a mark. A signature is a person. Those stay split.

---

## 6. Dualis-cut

```text
KEEP    verifier as a named job on existing desks
        PASS/REJECT receipt shape
        independence (author ≠ checker)
HOLE    running verifier process, live reject hook in CI, issuer
REFUSE  self-verify, model-as-party, vote-that-binds,
        residual-pay keys, Talk-on-/, child-written DNS
```

---

## 7. Next proof

The first real proof is: send one named receipt to Twain² or DCLM with this file as the check-list, get a PASS or REJECT back, and stop. Until Father draws, this file is paper.

```text
Look   = verifier named
Use    = Father.draw
Stake  = off
street = unchanged
```
