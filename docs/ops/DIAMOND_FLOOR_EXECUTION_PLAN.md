# Diamond-Floor Execution Plan

**Updated:** 2026-10-17  
**Work branch:** `workbench/domain-handoff-audit`  
**Production changes:** None. DNS changes: None. Live-server changes: None.

## Active findings

- [x] Preserve a reviewable work branch separate from `main`.
- [x] Correct Iris session state recovery: answer lookup success/failure returns the session to `idle` instead of leaving it stuck in `think`.
- [x] Add Node built-in tests for missing engine, successful answer, and rejected lookup paths.
- [x] Restrict the browser-controlled `?api=` override to the same origin or the configured DualisCapax API worker in both API clients. The previous code could direct chat POSTs to an arbitrary origin.
- [x] Add tests for untrusted, same-origin, and trusted API override paths.
- [ ] Run all tests in a real checkout and verify the supported runtime.
- [ ] Inspect Replit workspace changes when agent usage is available; do not assume all changes are committed.
- [ ] Confirm which exact Cloudflare Worker/branch emitted the invalid build-token log.

## Identity handoff — blocked pending backend evidence

- [x] Identify invalid proposed WebAuthn design: an `.ai` page cannot assert using `dualiscapax.com` as RP ID because the RP ID is not a suffix of the calling origin.
- [ ] Identify the authoritative identity backend and server-side session store.
- [ ] Implement a short-lived, single-use, audience-bound server handoff only after the receiving backend and atomic replay protection are confirmed.
- [ ] Test success, expiry, replay, forged callback, origin mismatch, direct unauthenticated entry, and failure/cancel paths.

## Iris / 3D World

- [x] Improve the Iris session controller's error recovery and truthful fallback behavior.
- [ ] Verify file selection and actual file reading; current UI language implies analysis without demonstrating that file contents are processed.
- [ ] Verify camera permission and preview behavior separately from actual visual understanding.
- [ ] Verify voice recognition, answer engine availability, speech synthesis, and visible status on desktop and mobile.
- [ ] Redesign and validate both the Replit Iris app and the `.ai` HUD.
- [ ] Confirm `.com` remains the 2D identity surface and `.ai` the 3D World surface.

## API, build, and release

- [ ] Trace the API v2 route to the authoritative kernel; do not treat a client-side label or mock response as backend proof.
- [ ] Add or run deterministic tests and a production build in a safe environment.
- [ ] Confirm the actual deployment rail and rollback artifact.
- [ ] Obtain explicit user approval before production deployment, DNS edits, auth-provider changes, or live server/database/firewall changes.

## Cloudflare build log (2026-10-17 04:56:49 UTC)

Build environment initialization succeeded. The build then failed because the selected Worker Builds token had been deleted or rotated. This is a credential/configuration failure; it does not prove the application source is broken. Deferred until the user wants to address it. No token or DNS changes were made.

The repository also documents a separate Cloudflare Pages direct-upload workflow with a standing token authorization error. That is a different deployment path and is **not yet proven to be the same token or build as the user's log**. Keep the incidents separate until the affected Worker/build is identified.
