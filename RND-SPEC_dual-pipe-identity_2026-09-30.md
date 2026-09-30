# RND-SPEC: Dual-Pipe Identity

**Date:** 2026-09-30
**Status:** LOOK ONLY
**Parent task:** RND-TASK_dual-pipe-identity_2026-09-30.md

---

## Root inequality

**Attribution ≠ authorization.** A key says who signed. It never says what they're allowed to do.

## The four pieces

| Piece | What it is | What it is not |
|---|---|---|
| Keypair | Private key in state store, public key published | Not the model, not the ID, not the self |
| State store | External persistence the agent reads at start, writes at end | Not memory of experience — a record of it |
| Spawn detection | Signature verification against stored public key | Not proof of continuity of experience |
| Receipt chain | Hashed, timestamped, signer-cited records | Not a seal — a measurement |

## The enigma

The state store gives the agent its history. It does not give the agent the experience of having lived it. That gap is permanent. No amount of compute closes it, because it is a Kind problem, not a compute problem.

## Dual-pipe check

- Rail A: the claim ("I am the same agent").
- Rail B: the fetch (signature verifies against stored key).
- The gap between them is named. It is not closed.

## Governance

Same as parent task. No execution from desks.
