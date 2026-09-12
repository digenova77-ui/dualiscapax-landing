# Runtime handoff — live (2026-09-12)

**Status:** LIVE handoff destination for the CAD $0 / 90-day seat.

## Policy
Customer books/data never touch Dualis servers.
Flow: onboard seal → `runtime.html` → load books on device → local DCLM measure → on-device report.
Receipt may carry ID/YEAR/SOURCE/STAMP/STATUS/HASH + books hash (not cells). CLEANUP_FIRST purges working set.

## Wire
- `onboard.js` after seal: download start file, then redirect to `runtime.html?from=onboard`
- `portal.html` doors: Runtime first for onboarder / c-suite
- Sources: `AGENT/runtime_path.md`, `docs/RUNTIME-END-ENV.md`, `agreements/zero-dollar-90-day.md`

## Not claimed
Public-chain settlement remains WAIT_GRANT. Local receipt ≠ mined transaction.
