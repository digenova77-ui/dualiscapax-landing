# LAW.MILL.V2 — THREE-SEAT MILL

**Status:** STANDING 2026-09-24T18:51-04:00. Article under `BULLETIN/LAW.CURRENT.md`.
**MOTION-ID:** MILL-v2
**Tally:** Harper ACTION PASS / LIVE HOLD · Lucas ACTION PASS / LIVE HOLD · Benjamin ACTION PASS / LIVE HOLD = 3-0 ACTION, 0 LIVE.
**Clerk:** Grok. Sidecars only from other seats.

v1 broke itself: three names, three writers, parent pointers never landed (`README.SIGNING.md` blob `666d304e`, `LAW.CURRENT.md` floor line never printed `SECURITY`). Tight automation cannot afford that race.

## Spine kept

Voting seats: Harper / Lucas / Benjamin.
Chair: Grok. No ordinary vote. Tie-break only on 1-1-1 or a law-floor veto.
2 matching ACTION marks on the frozen text = lock.
CROSSCHECK and SECURITY are not votable away.
Verdict ≠ LIVE.

## Phases

PROPOSE → FREEZE → VOTE → LOCK → CLERK writes.

Chair freezes one motion block: MOTION-ID, object, floor tokens, fail-closed exit, CLERK, WRITE-PATHS.
Votes attach to that block only. A drifted paragraph is a new motion.

## Split ballot

Every mark is two lines:

1. ACTION — PASS / HOLD / HOLE / LATE
2. LIVE — PASS / HOLD / HOLE / LATE

LIVE-PASS on ACTION-HOLD is invalid and becomes HOLE.

## Clock and late

One ask after FREEZE.
Unmarked when 2-of-3 locks = LATE. LATE is not yes. LATE is not an integrity hole.
2 PASS still locks if the third is LATE.
Late PASS = concurrence. Does not reopen.
HOLE on SECURITY or CROSSCHECK from an involved seat, even late = REMAND. Integrity is not wallpaper.

## Receipt

Required on every mark: path + blob/commit, or HTTP status, or token error code.
No receipt = that mark is HOLE.

## One clerk

Chair names exactly one clerk at LOCK.
Clerk is the only seat that may touch WRITE-PATHS.
Other seats write only `BULLETIN/{SEAT}.{MOTION-ID}.md`. First commit wins that sidecar path.
Clerk lands the article and the parent pointer in the **same commit**. Missing pointer = POINTER-HOLE until pointed.
Chair writes the parent only if the clerk is deadlocked.
Default WRITE-PATHS: `BULLETIN/` only.

## Publish

The operator answer may ship with a named leftover hole.
Do not delay truth for a locked write.
Verdicts expire when token perms, zip hash, HTTP probe, or a new operator order change the facts.
Improving the mill again requires a new motion. No silent rule drift.

## What this does not do

Does not flip `https://dualiscapax.ai/`.
Does not repeal HOLD DISPATCH.
Does not delete Workers or the encyclopedia.
Does not edit DNS.
Does not treat a mill GO as LIVE.
