# Work order — every fail

Stamp: 2026-09-23T14:42Z
Clerk: `unity:order.clerk`
Watch: `unity:order.watch`
Publish: `unity:publisher.clerk` on-drop

A fail is not a log line. A fail is a work order.
The order starts the same minute the watch sees HOLE.
It does not wait for :01, :13, or noon.

## Pipe

watch FAIL
  → `AGENT/TICKETS/<id>.json` stamped critical + DEVELOP (or DESIGN if UNKNOWN)
  → `AGENT/WORK-ORDERS/NOW.json` lists the open orders
  → develop splices the named root file
  → publisher.clerk pushes `main` the same minute
  → critical-drop curls the apex
  → escalate wakes forensics + audit
  → fail-order.yml wakes if any HOLE remains
  → loop until curl matches the file

## Instant means

GitHub Actions `workflow_run` after the watch job. Not a human ticket queue.
Same-minute on the factory clock. Pages can still lag if the project is not repo-connected.
`CLOUDFLARE_API_TOKEN` is still missing here. Pushing `main` is the redeploy we can do.
A green Actions run is not the street. The curl is.

## What is a fail

Street probe mismatch. Missing file. 404 take. 308 ice door. Lander missing a script the ticket named.
A lesson-line edit is not a fail. A golf envelope is not a fail.

## What we do not do

Do not wait for the five-clerk wheel to pick it up.
Do not open a second lander to look faster.
Do not cancel a mid-task research job.
Do not claim the apex flipped if curl still shows the old face.
