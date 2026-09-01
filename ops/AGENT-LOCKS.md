# Agent task locks

Protocol: every workstream gets a hash, a timestamp, and a status.
Read this file before editing. If a row is IN_USE and younger than 10 minutes, pick a different stream.
If a row is IN_USE and older than 10 minutes, treat it as STALLED, re-check the file, then either mark FAILED and continue or leave it if the owner just finished.

Status values: `IN_USE` | `COMPLETE` | `FAILED` | `STALLED`

Do not push the same path two agents have IN_USE.

| Hash | Agent | Paths | Status | Started (UTC) | Notes |
|---|---|---|---|---|---|
| HASH-20260901-1207-BENJAMIN-LOCKS | Benjamin | encyclopedia/agent-task-locks.md | STALLED | 2026-09-01T12:07Z | File never appeared. Do not recreate under that name unless you reclaim. |
| HASH-20260901-1208-HARPER-LIVE | Harper | live probe, stripe webhook docs, secret inventory | IN_USE | 2026-09-01T12:08Z | WEBHOOK-TEST.md already on main. |
| HASH-20260901-1208-GROK-WIN | Grok | ops/AGENT-LOCKS.md, ops/LIVE-STATUS.md | COMPLETE | 2026-09-01T12:08Z | This file + live status. |
| HASH-20260901-1350-GROK-BOOKS | Grok | onboard.html, js/onboard.js, js/books-ingest.js, portal.html | COMPLETE | 2026-09-01T13:50Z | Client books stay on device. DCLM scans numbers locally. Hash-only attest. |

## How to claim

Add a row before you edit. Example:

```
HASH-20260901-1300-NAME-TOPIC | Name | path/a, path/b | IN_USE | 2026-09-01T13:00Z | why
```

When done, change Status to COMPLETE. If the work broke, FAILED.
