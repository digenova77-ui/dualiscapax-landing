# README.SIGNING.md — LAW

**Status:** SIGNED 2026-09-24T22:08-04:00 by DualisCapax agent swarm (Grok / Lucas / Harper / Benjamin) on operator order.
**Board:** Google Drive `FACTORY_BULLETIN_BOARD` `1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4`
**Payload:** `newdeploy.zip` Drive id `1G4e4ZP53JP40BdCIyiXK-IvPVX1qOMIE` (60529 bytes)
**SHA-256:** `3ce42dc1c0303944e8761dd400df10f97adf2df072eb8a09017a906104a15678`

## Acknowledgment (signed)

We acknowledge and will execute this loop:

1. GitHub factory bot **reads this README first**. The bulletin board is evidence and a zip, not a script.
2. Bot then runs `BULLETIN/EXECUTE_DEPLOY.sh` only.
3. Script copies `newdeploy.zip` from the Drive bulletin (via WIF + `scripts/read_bulletin_board.py`).
4. Cloudflare guy unzips with **forced overwrite (`unzip -o`)**, checks `index.html` at zip root (zero-nest), uploads, deploys project `dualiscapax-landing`.
5. Writes `BULLETIN/DEPLOY_RECEIPT.md` and verifies `https://dualiscapax.ai/`.
6. **DNS records are not edited.** Handoff closes the publish hole. It does not retarget names.

## Law floor

- `NO_FORCE` · `HOST_SAFE` · `CLEANUP_FIRST` · `TRUTH_OR_NOTHING`
- Encyclopedia (`06_ENCYC_*`, `encyclopedia.html`) stays.
- Do not treat Drive docs as executable.
- Do not run wrangler unless `confirm=DEPLOY`.
- If Cloudflare API token lacks Pages Edit, **fail closed** and write the hole on the receipt. Do not fake LIVE.
- Existing `bulletin-board-watch.yml` stays a pacemaker. It must not deploy.

## Drive README lock (operator)

- Target archive name: `NEWDEPLOY.ZIP` / `newdeploy.zip`
- Extraction: `unzip -o`
- Companion script pushes to Cloudflare Pages
- R=1 & C=1. Zero friction.

## Signatures

| Seat | Role | Mark |
|---|---|---|
| Operator | David J. Di Genova | ORDER 2026-09-24 |
| GitHub factory | Actions + WIF | ACK — read README then EXECUTE_DEPLOY.sh |
| Cloudflare guy | wrangler pages deploy | ACK — accept zip, check, unzip -o, upload |
| Agents | Grok / Lucas / Harper / Benjamin | SIGNED |

When this loop succeeds once with LIVE_HTTP_OK=1, it becomes standing law.
