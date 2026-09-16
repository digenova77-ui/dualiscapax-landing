# FACTORY_PIPELINE_v1

David: close the window toward real-time without tripping Cloudflare or GitHub.
Measure limits. Sit one notch under. If a limit moves, Dualis moves.

## Exact numbers (Free / this account shape, 2026-09-16)

| Gate | Number | Source |
|---|---|---|
| GitHub Actions schedule floor | **5 minutes** (`*/5 * * * *`) | GH schedule event |
| GITHUB_TOKEN API | 1,000 req / hour / repo | GH REST |
| GH Actions concurrent jobs (Free) | 20 | GH plan |
| GH Actions minutes (private Free) | 2,000 / month | GH billing |
| Cloudflare API | **1,200 / 5 min** / token | CF Fundamentals |
| Pages builds (Free) | **500 / month**, **1 at a time**, 20 min timeout | CF Pages limits |
| Pages file cap | 20,000 files / 25 MiB each | CF Pages |

Binding constraint is **Pages 500 builds/month**, not the 5-minute cron.

500 / 30 d ≈ **16 prod swallows / day** if Dualis burned the whole quota.
Git Connect builds on **every push to the connected branch**. Factory receipt commits on `main` **are** builds.

## Cadence Dualis runs now

| Layer | Interval | Touches Pages? |
|---|---|---|
| L0 kennel work (git files, no live HTML) | continuous | no |
| L1 verify (HEAD live + HTML lint) | **15 min** | no (artifact only, no main push) |
| L2 second sandbox (`/sandbox` + preview) | after L1 green | no |
| L3 production atom (`_redirects` + one file) | **≥ 90 min** between Pages-touching commits | yes |
| Grok pulse | hourly 07–23 America/New_York | no |
| Grok scoreboard | daily 08:30 | no |

90 min ≈ 16/day ceiling with headroom for human pushes and failed builds.
If Dualis upgrades CF Pages plan, raise L3 toward 30 min. Recheck 500/month quarterly.

Do **not** run verify-at-5-min **and** push receipts to `main`. That is how Dualis eats the month.

## Three gates (every module, including ones not born yet)

1. **Kennel** — factory/sandbox or branch. Cite-or-hole. Rename-around if the public stem is 308-self.
2. **Second sandbox** — different measurer: `/sandbox` live 200, or a GH Actions HEAD job that was not the author. Must agree.
3. **Production** — additive file + `_redirects` **200 to the FILE**. Never 308 to a cursed stem. Never replace `index.html`. Never `wrangler pages deploy cf-pages`.

Roll only the module that changed. Future modules use this same pipe.

## Validation stack

- Secret scan before push.
- HEAD scoreboard: 200=1, 308-self=cursed, 308-to-working-slash=OK (SIMA), 404 on booked alias=not swallowed yet.
- No `$` on glass. checkout=false. phi=veto.
- If L1 and L2 disagree: hole. Do not roll.

## Veto

- Real-time HTML deploys (sub-5-min) — GitHub will not schedule it; Pages will 429 the month.
- Cache Everything on HTML.
- Custom Domain Worker on apex.
