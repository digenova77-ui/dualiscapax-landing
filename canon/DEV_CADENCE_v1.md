# DEV_CADENCE_v1

David: while Dualis is developing, plate atoms may push as they land.
Later the 500/month Pages cap is critical. Sit under it then.

Does not smash Home. Look $0. checkout=false. Never wrangler pages deploy.

Parent: FACTORY_PIPELINE_v1 / FPVVW_STANDARD_v1 / TONIGHT_LAW_v1.

## Two modes

| Mode | When | Plate push | Kennel / harvest |
|---|---|---|---|
| **develop** | now, until David says the limit is critical | on the atom, no 90-min wait | `[CF-Pages-Skip]` PREFIX so Pages does not build |
| **quota** | later / default law | Clock B ≥90 min between Pages-touching commits | same skip prefix |

500 builds / month Free. Git Connect builds on **every** production-branch push that is not skip-prefixed.

## Skip string (Pages, official)

Must be a **prefix** of the commit message:

`[CF-Pages-Skip]` or `[CI Skip]` or `[Skip CI]`

Suffix `[skip ci]` skips GitHub Actions. It does **not** skip Cloudflare Pages.
Harvests that end with `[skip ci]` still burn a Pages build if Git Connect is on.

## What Dualis pushes in develop

- Additive plate file + `_redirects` 200-to-file
- SIMA / gates / ice-named files Dualis already booked
- Not `index.html`
- Not Residual deploy
- Not `$` / checkout

## What Dualis never real-times

- Harvest packs (`units/**`)
- factory mill receipts
- Watchdog artifacts
- Drive zip dumps

Those commits: `[CF-Pages-Skip] chore(...)`

## Recalibrate

When David says the limit is critical, mode = **quota**. 90 min returns.
If Pages plan upgrades, raise toward 30 min. Recheck 500/month.

Look $0.
Develop is permission to spend builds on the plate. It is not permission to smash Home.
