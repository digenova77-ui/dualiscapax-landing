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
- [x] Add a request-level test proving World 0 remains `0` in the request body and `X-DC-World` header.
- [x] Bound L2 text-file reads to 5 MiB and metadata-only workbook fingerprinting to 25 MiB.
- [x] Parse quoted CSV/TSV fields and multiline quoted cells; count actual JSON numeric values rather than digits embedded in strings.
- [x] Refuse persistent seating when browser storage is unavailable, and report incomplete local cleanup rather than claiming success.
- [x] Make the playground label Excel workbooks as metadata-only because cell values are not parsed.
- [x] Fix API world switching so `DCWorld.apply(0|1)` updates the active request route and metadata.
- [x] Fix API config's falsy-value bug that turned World 0 into World 1 in request headers/body when the standalone client path was used.
- [x] Add an isolated pull-request test workflow; its first execution is still pending.
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
- [x] Add ephemeral local text-file reading for .txt, .md, .csv, .json, and .log files, with 256 KB input and 20,000-character context limits.
- [x] Keep extracted document contents out of Iris session telemetry events.
- [x] Prevent selected local document text from falling through to Wikipedia/Wikidata if the configured answer engine is unavailable.
- [x] Make the UI state plainly that camera preview is not the same as visual understanding.
- [ ] Verify file handling, camera permission, and answer-engine behavior in a browser on desktop and mobile.
- [ ] Verify voice recognition, answer engine availability, speech synthesis, and visible status on desktop and mobile.
- [ ] Redesign and validate both the Replit Iris app and the `.ai` HUD.
- [ ] Confirm `.com` remains the 2D identity surface and `.ai` the 3D World surface.

## API, build, and release

- [ ] Trace the API v2 route to the authoritative kernel; do not treat a client-side label or mock response as backend proof.
- [x] Add deterministic tests for Iris recovery, local-file limits/privacy, API-origin restrictions, world switching, L2 parsing limits, metadata-only workbooks, and storage failure behavior.
- [ ] Execute the test suite in a real checkout and run a production build in a safe environment.
- [ ] Confirm the actual deployment rail and rollback artifact.
- [ ] Obtain explicit user approval before production deployment, DNS edits, auth-provider changes, or live server/database/firewall changes.

## Cloudflare build log (2026-10-17 04:56:49 UTC)

Build environment initialization succeeded. The build then failed because the selected Worker Builds token had been deleted or rotated. This is a credential/configuration failure; it does not prove the application source is broken. Deferred until the user wants to address it. No token or DNS changes were made.

The repository also documents a separate Cloudflare Pages direct-upload workflow with a standing token authorization error. That is a different deployment path and is **not yet proven to be the same token or build as the user's log**. Keep the incidents separate until the affected Worker/build is identified.


## Local document privacy boundary

The playground now reads supported text files locally in memory only. File content is not written to localStorage or included in Iris session telemetry. It is included in a prompt only when the user asks a question. If the configured answer engine is unavailable, DCLMLook returns an unavailable result rather than sending document text to public search. Image and PDF understanding remain unsupported in this staged implementation.
