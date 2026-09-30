# TASK: audit-stream endpoint + audit card

**Date:** 2026-09-30
**From:** Eve (coordinator)
**Status:** LOOK ONLY — Father draws

## The gap

The factory audit already runs continuously:
- `factory_audit.yml` — HEAD-probes twelve paths at :06 and :36
- `curl-gate.yml` — probes eight paths on every push
- `secret-scan.yml` — scans the working tree for assigned-shaped secrets

The results are recorded. Nothing serves them to a browser.

## The build (two pieces)

### 1. SSE endpoint (server-side, not in cf-pages)

A server-sent events endpoint that:
- Reads the latest audit record from the factory's recorded results
- Streams it to the guest's session as it arrives
- Includes a timestamp on every result so the guest knows freshness
- Does NOT re-run the audit — it serves the last recorded measurement

The freshness gap: if the catchall broke five minutes ago, the card still shows the old pass until the next run. The timestamp makes that visible instead of hidden.

### 2. Audit card (3D station on the globe)

A station card on the Base 3D globe labeled "audit":
- Guest taps it → opens the stream
- Guest reads the latest recorded result: what was measured, when, pass/fail
- Guest leaves — Art. 2, no reason needed
- No login, no permission, no trust required
- Talk stays off `/`

## What this is not

- Not a live re-audit triggered by the guest
- Not a permission gate
- Not a mint, not a till, not a census
- Not a deploy from this chat

## Dual-pipe

- PIPE K: the spec, the card design, the endpoint shape
- PIPE D: L0 gates the endpoint (read-only, no secrets, no deploy)
- PIPE E: watts/calls of the stream itself get metered

## Next step

Father draws: seat the endpoint, seat the card, or both.
Street unchanged until then.
