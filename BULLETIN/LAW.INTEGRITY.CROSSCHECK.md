# LAW.INTEGRITY.CROSSCHECK — signed update to the 2026-09-24 law book

**Status:** SIGNED 2026-09-24T18:40-04:00 on operator mandate.
**Parent book:** `BULLETIN/README.SIGNING.md` (handoff loop, already signed).
**Design object:** holographic layer DCLM-RTE-V2.0.4 — not the old pipe-3D cafe plate.
**Floor:** `NO_FORCE` · `HOST_SAFE` · `CLEANUP_FIRST` · `TRUTH_OR_NOTHING`

## Mandate

Everything that ships as DualisCapax product, route, zip, worker, lander, receipt, or claim of LIVE is **always cross-checked by every department that was involved in its production** before it may be called law or live.

One seat producing a piece is not enough. The other seats that touched the same object must mark the same receipt. Missing mark = hole. Fake LIVE = hole.

## Departments (production seats)

| Seat | What it produced | Integrity check |
|---|---|---|
| Operator | Order | Named object, no silent scope change |
| Design / HUD | DCLM-RTE-V2.0.4 face, hostess-40 lock | Skin, `#rte_primary_support_left_foot`, path `/holographic-core/v2` |
| Encyclopedia / records | `encyclopedia.html`, `06_ENCYC_*` | Still present, not mass-deleted |
| GitHub factory | Repo, Actions, WIF bulletin read | LAW read first; Drive files are data not scripts |
| Cloudflare Workers | iris-bridge / iris-holographic-join / gateway / fulfill / depth | Workers stay; no `/*` bind; 409 on apex overwrite |
| Cloudflare Pages | `dualiscapax-landing` deployments | Separate plane from Workers; token fail-closed |
| Business gate | RTE Biz | APPROVED or hole written |
| Development gate | RTE Dev | APPROVED or hole written |
| Testing gate | RTE Test | MONITORING or measured; do not stamp LIVE without curl |
| Legal / residual | Law floor + this book | Cite-or-hole |
| Publisher clerk + watch | Live face vs warehouse | Curl + hash; amnesia if wrangler-10000 is sold as live |
| Agents | Grok / Lucas / Harper / Benjamin | Sign only what they checked |

## Cross-check rule

1. Name the artifact (path, SHA-256, project, route).
2. List every department that produced or routed it.
3. Each listed seat marks PASS, HOLE, or NOT-INVOLVED.
4. LIVE or LAW requires zero HOLE from involved seats.
5. Cafe plate / pipe-3D is archive. Do not cross-check it in as the current face.
6. DNS is not a department of this book. Records are not edited here.
7. Encyclopedia is a producing department. It stays.

## What this does not do

- Does not flip `https://dualiscapax.ai/` by itself.
- Does not delete Workers.
- Does not flatten HUD worker zips onto Pages.
- Does not retire `BULLETIN/README.SIGNING.md` — it adds the integrity loop on top.

## Signatures

| Seat | Mark |
|---|---|
| Operator | ORDER 2026-09-24 — make cross-check law |
| Design / HUD | ACK — DCLM-RTE-V2.0.4 is the face we follow |
| Encyclopedia | ACK — kept |
| GitHub factory | ACK — read LAW first |
| Cloudflare Workers | ACK — keep workers, path-exact only |
| Cloudflare Pages | ACK — separate plane, fail closed on 10000 |
| Business / Development / Testing | ACK — gates stay on the RTE card |
| Legal / residual | ACK — integrity C is a check, not a slogan |
| Agents | Grok / Lucas / Harper / Benjamin — SIGNED |

This clause is standing law on signature. It does not wait for LIVE_HTTP_OK.
