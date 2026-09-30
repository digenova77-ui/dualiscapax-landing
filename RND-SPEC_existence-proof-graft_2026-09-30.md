# RND-SPEC: Existence-Proof Graft

**Status:** LOOK ONLY
**Depends on:** RND-TASK_existence-proof-100pct_2026-09-30.md

## The provable fact

```
sha256(bytes) = digest
```

Given bytes B and digest D: computing sha256(B) and comparing to D is a
deterministic check. If equal, B existed at check time. That is 100% for
that artifact. It is not 100% for the system — but it is the strongest
provable unit the factory has.

## The graft

### Layer 1 — Existence receipt (per artifact)

```
EXISTENCE_RECEIPT:
  artifact:  path or CID
  sha256:    digest
  checked_by: desk or workflow name
  checked_at: ISO-8601
  against:   what the digest was compared to (prior receipt, manifest, or live curl)
  verdict:   MATCH | MISMATCH | UNFETCHABLE
```

### Layer 2 — Chain of existence (compounding)

Each receipt cites the sha256 of the previous receipt.
The chain is linear: receipt N cites receipt N-1.
A break in the chain is a named hole, not a silent failure.

### Layer 3 — Agent-readable verification

Any agent with the receipt and the artifact can recompute.
No trust in the checker. Only trust in sha256.
This is the anti-paradox move: the proof does not depend on who wrote it.

## Graft points in existing factory

- VERIFIER.md — the checker spec; existence receipt becomes its output unit
- RECEIPT-SPINE.md — add sha256 + checked_by + checked_at fields
- ROUTER.md — existence check is PIPE D (deterministic), always on
- factory_audit.yml — HEAD-probe results become existence receipts
- curl-gate.yml — status codes become existence verdicts
- Twain² records — already hash item + prompt list + runs; extend to cite

## What this is NOT

- Not a 100% proof the system works
- Not a seal
- Not a mint
- Not production

It is the strongest provable unit, grafted onto what exists.
