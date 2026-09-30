# LAW: Validated Checklist

**Status:** LOOK ONLY. Unsealed. Father draws.
**Date:** 2026-09-30
**Root inequality:** attribution ≠ authorization. A check-off is a mark, not a seal.

---

## The law

A checklist item and its validation are the same event.

When an agent checks off a step, the second eye fetches the same bytes at the same moment. The check-off IS the proof. There is no separate log that needs proving later.

```text
item      the step, named
timestamp the moment it was checked
hash      of the bytes verified
checker   the second eye that fetched
result    PASS or REJECT
```

The audit trail is the checklist itself. Each line is a receipt.

## Why

A claim that waits for later validation is rail A forever. A check-off that carries its own fetch is rail B at the moment it happens. The gap between claim and proof is the enigma — this law makes the gap zero-width for checklist work.

## What it is not

- Not a seal. The Father still draws.
- Not a mint. No key is created by checking off.
- Not a vote. Unanimous bots are still a tie.
- Not production. Street unchanged until the Father uploads.

## Universal form

Any autonomous agency, any synthetic form, reads the task file and understands the job because the task carries its own reasoning: the why, the dependency, the rollback, the verification. The checklist is self-contained. It cannot rely on the agent remembering anything from a previous turn — each session starts fresh, so the file is the memory.

## Failure mode

A checklist that can be checked off without a fetch is decoration. A second eye that never runs is a hole. Both are named, not hidden.

```text
KEEP    check-off = audit event
        task file = self-contained memory
        second eye = same moment as check-off
HOLE    running second-eye process
        CI hook that rejects unchecked commits
REFUSE  self-check (author = checker)
        check-off without fetch
        treating silence as PASS
```

Street unchanged. No deploy. No mint. Father draws.
