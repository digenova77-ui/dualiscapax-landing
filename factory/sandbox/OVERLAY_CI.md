# OVERLAY_CI

CI implements FACTORY_OVERLAY as cheap gates.
Deploy to Pages is a different organ. Do not couple them to a dead token.

## Two pipelines

| Pipe | Job | Needs CF token? |
|---|---|---|
| **Overlay** | Path allow, Home/ice forbidden writes, no phrase dump, ticket path present | No |
| **Swallow watch** | curl live paths from NEXT10 after merge | No (public HTTPS) |
| **Pages deploy** | Git Connect or wrangler | Yes if direct upload — hole `awaiting_token` |

If token is missing, overlay + curl still run. That is the short arrow.
Do not invent AWS/OIDC scenery until those two are green.

## Overlay job (proposed)

On pull_request + push to main:

1. Fail if diff touches `cf-pages/index.html` or a full replace of `ice.html`.
2. Fail if diff adds a file that looks like an 8-word phrase list or a class roster of real names.
3. Warn (do not fail) if a new plate file is only under `cf-pages/` and not also on live tree `js/` or `rte/`.
4. Comment the current NEXT10 live codes if curl step is present.

## Swallow watch

Cron or post-push:
`curl -sI` the ten paths. Write `factory/sandbox/receipts/curl_*.txt` or an Actions summary.
404 after a claimed seat = ticket not closed. Do not mint a claim.

## What CI must not do

- Wrangler upload as the only proof of work
- Iris calling children from a recording
- Coin mint
- Auto-merge because the essay is long

GitHub Actions is the supervisor's cheap hands. Executors still write the atom.
