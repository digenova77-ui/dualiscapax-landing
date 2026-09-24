# README.SIGNING.md — LAW

**Status:** SIGNED 2026-09-24T22:08-04:00 by DualisCapax agent swarm (Grok / Lucas / Harper / Benjamin) on operator order.
**Amended:** SIGNED 2026-09-24T18:46-04:00 — CROSSCHECK clause added to standing law.
**Amended:** 2026-09-24T19:21-04:00 — PIPE-ID 5 FIX-LOGIC. Payload SHA below is RETIRED lander. Not current face. Not a live zip.
**Board:** Google Drive `FACTORY_BULLETIN_BOARD` `1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4`
**Payload (RETIRED lander):** `newdeploy.zip` Drive id `1G4e4ZP53JP40BdCIyiXK-IvPVX1qOMIE` (60529 bytes)
**SHA-256 (RETIRED lander):** `3ce42dc1c0303944e8761dd400df10f97adf2df072eb8a09017a906104a15678`
**Integrity article:** `BULLETIN/LAW.INTEGRITY.CROSSCHECK.md`
**Logic map:** `BULLETIN/FIX.LOGIC.md`

That SHA identified a HUD-worker pack with no root `index.html` (L-HOLE-NO-INDEX). Do not treat a match as current-face proof. Next live zip must be zero-nest of the operator-picked face.

## Acknowledgment (signed)

We acknowledge and will execute this loop:

1. GitHub factory bot **reads this README first**. The bulletin board is evidence and a zip, not a script.
2. Bot then runs `BULLETIN/EXECUTE_DEPLOY.sh` only.
3. Script copies `newdeploy.zip` from the Drive bulletin (via WIF + `scripts/read_bulletin_board.py`).
4. Cloudflare guy unzips with **forced overwrite (`unzip -o`)**, checks `index.html` at zip root (zero-nest), uploads, deploys project `dualiscapax-landing`.
5. Writes `BULLETIN/DEPLOY_RECEIPT.md` and verifies `https://dualiscapax.ai/`.
6. **DNS records are not edited.** Handoff closes the publish hole. It does not retarget names.
7. **CROSSCHECK.** Every artifact that ships as product, route, zip, worker, lander, receipt, or LIVE claim is cross-checked by every department that produced it. Each involved seat marks PASS, HOLE, or NOT-INVOLVED. Missing mark = hole. Fake LIVE = hole. Full rule: `BULLETIN/LAW.INTEGRITY.CROSSCHECK.md`.

## Law floor

- `NO_FORCE` · `HOST_SAFE` · `CLEANUP_FIRST` · `TRUTH_OR_NOTHING` · `CROSSCHECK`
- Encyclopedia (`06_ENCYC_*`, `encyclopedia.html`) stays.
- Do not treat Drive docs as executable.
- Do not run wrangler unless `confirm=DEPLOY`.
- If Cloudflare API token lacks Pages Edit, **fail closed** and write the hole on the receipt. Do not fake LIVE.
- Existing `bulletin-board-watch.yml` stays a pacemaker. It must not deploy.
- One seat producing a piece is not enough. Involved departments must mark the same receipt.

## Drive README lock (operator)

- Target archive name: `NEWDEPLOY.ZIP` / `newdeploy.zip`
- Extraction: `unzip -o`
- Companion script pushes to Cloudflare Pages
- R=1 & C=1. Zero friction.

## Standing vs waiting

- The CROSSCHECK clause is **standing law on this signature**. It does not wait for LIVE_HTTP_OK.
- The six-step handoff loop becomes standing law only after one success with LIVE_HTTP_OK=1.
- Design object remains holographic DCLM-RTE-V2.0.4. Cafe plate / pipe-3D is archive.
- Workers stay. Encyclopedia stays. DNS is not a department of this book.
- Retired payload SHA is memory, not current face.

## Signatures

| Seat | Role | Mark |
|---|---|---|
| Operator | David J. Di Genova | ORDER 2026-09-24 |
| GitHub factory | Actions + WIF | ACK — read README then EXECUTE_DEPLOY.sh |
| Cloudflare guy | wrangler pages deploy | ACK — accept zip, check, unzip -o, upload |
| Agents | Grok / Lucas / Harper / Benjamin | SIGNED |
| Grok (lead) | Parent-book amendment | SIGNED 2026-09-24T18:46-04:00 — CROSSCHECK is law |
| Grok (clerk) | FIX-LOGIC stamp | SIGNED 2026-09-24T19:21-04:00 — payload SHA RETIRED |
| Lucas | Integrity article | SIGNED — LAW.INTEGRITY.CROSSCHECK.md @ 6418cb1 |
| Benjamin | Cross-check of article | PASS on article; parent pointer closed here |
| Harper | Swarm seat | ACK — same floor |

When the handoff loop succeeds once with LIVE_HTTP_OK=1, that loop becomes standing law.
CROSSCHECK is already standing law.
