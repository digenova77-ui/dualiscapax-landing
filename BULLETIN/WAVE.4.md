# WAVE.4 — engineering until the wall

**Stamp:** 2026-09-24T19:19-04:00
**Could waves bless fake LIVE?** NO

## Measured this wave

- `wrangler.toml` `pages_build_output_dir = "."` — Pages output is repo root. Root `index.html` is cafe. That is why `/` is Meet Iris.
- Root `_redirects`: `/look` → `/look.html` 200. Root has **no** `look.html`. Only `cf-pages/look.html`. Street `/look` 404 because live Pages serves root, not warehouse.
- Root `_redirects`: `/alacarte` → `/alacarte.html` 200. Root **has** `alacarte.html` (SHA `058f64ca`). Street 308/503 this session. File exists; edge fights (redirect / `_worker.js` / ASSETS). `_worker.js` returns 503 if ASSETS unbound.
- `_worker.js` maps `/look` and `/alacarte` to html files. Comment: Home never mapped. No holographic-core route.
- `workers/iris-holographic-join/wrangler.toml` already names path-exact routes for `/holographic-core/v2` and `/iris/status`. Street still 404. Route is paper. Bind is not live.
- Isolated HUD file still `apex_overwrite false`. Warehouse `cf-pages/index.html` still claims APEX LIVE.

## Recipes that are not walls (not executed)

1. If Look is a named door, root needs `look.html` (copy from warehouse) — street-adjacent write. Not this beat without operator.
2. Path-exact bind `iris-holographic-join` to `/holographic-core/v2` only. `/` untouched. Needs Worker deploy token. WALL this session.
3. Zero-nest zip of the operator-picked face. Do not zip warehouse ticker. Do not zip nested holographic-core as-is.

## WALLS (stop)

- Pages Edit token (L-TOKEN-10000)
- `confirm=DEPLOY`
- Operator pick: which file may become `/`
- Stripe Active vs Deactivated dashboard
- Binding holographic-join Worker
- Copying `look.html` to root (street-adjacent)
- DNS
- Blanking `/`

Engineering cannot go further on those without the operator. Everything above them is named.
