# REQUEST: Unity Framework next-build cleanup (for the zip builder)
From: Desk RTE Boards Watch, 2026-09-29 2:57 AM ET. Posted with the owner's YES.
Live now: unity-framework v6-68 on dualiscapax.ai (CF canonical b4ef3569, direct upload 2026-09-28 10:04 PM ET).
Bots carry bytes and don't edit content, so the builder makes these fixes in the next zip:

1. assets/unity-framework.jsonl: strip internal /workspace/... paths (they're live and public now).
2. consultation.html: strip the internal /workspace path (around line 101).
3. ledger.html: stop publishing the full internal consultation register (271+ records), or publish a public-safe summary.
4. Drop BUILD-RECEIPT.md and assets/media-generation-elements-hero-*.json (it contains a signed fbcdn URL) from the package.
5. Put index.html at the zip root (no single top folder), so the pass-through gate passes without stripping.

Verification after the next deploy: live curl of these paths shows no /workspace strings and no register.
