# ESCALATE — a fail wakes the order now

Stamp: 2026-09-23T14:42Z
Clerk: unity:publisher.clerk (drop)
Watch: unity:forensics.clerk + factory-audit + unity:order.clerk
Law: AGENT/TICK.md + AGENT/PIPELINE.md + AGENT/WORK-ORDER.md

## Pipe

watch FAIL or develop splice
  → publisher.clerk pushes main          (the drop)
  → critical-drop.yml curls the apex     (same minute)
  → escalate.yml starts when that job
    finishes its current task
      → forensics names the bot
      → factory-audit stamps the street
      → fail-order.yml refreshes WORK-ORDERS/NOW.json
      → if HOLE: ticket stays CRITICAL
           → design (UNKNOWN) or develop (known splice)
           → clerk drops again the same minute
      → if LIVE: ticket closes. Routine clock resumes.

Research does not wait for the next cron.
Research does not push the lander.
A green Actions run is still not the street. The escalate curl is.

## What wakes

critical-drop completing.
wav-watch completing with HOLE.
forensics or factory-audit completing with HOLE.
Not a golf harvest. Not a lesson-line commit. Not noon.

## Concurrency

If a desk is mid-task, let that run finish. Then the escalated run starts.
Do not cancel a research job halfway to look faster.
Escalate and fail-order concurrency: cancel-in-progress false.
