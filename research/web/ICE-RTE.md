# Ice + RTE

## Why ice does not land

`_redirects` maps `/ice` → `/ice.html`.
The heavy portal lived at repo-root `ice.html`, not in `cf-pages/`.
The pack zip therefore had no ice file.
Live `/ice` and `/ice.html` return 503, not 404, so an edge route is also sitting on that path and dying.
`/hockey` is 503 too.

Thin `cf-pages/ice.html` is now the pack target. Apex will not change until a publish token can write the project.

## RTE menu on disk (not live — live `/rte` is 404)

Live floor: SIMA, connect two systems, upgrade, stand something new, pair, the job.
Sandboxes: factory map, Ice, Look, OHF, schedule, 90-day look, game day.
Footer: RTE / Sandbox / Ice / Home.
Lede already: till closed. No PHI.

Keep Ice and RTE off the home dock until two watchers see 200.

## Checkout

Parked. CHECKOUT_OPEN stays false. `/pay` no longer says Live checkout in this pack.
