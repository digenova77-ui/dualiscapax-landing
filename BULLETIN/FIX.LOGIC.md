# FIX.LOGIC — GitHub + Cloudflare holes

**Stamp:** 2026-09-24T19:21-04:00. PIPE-ID 5. MOTION-ID FIX-LOGIC.
**Tally:** Harper / Benjamin ACTION PASS · LIVE HOLD · 404.html rewrite OUT.
**Clerk:** Grok
**Could this bless fake LIVE?** NO. CF edge not claimed fixed.

## Closed this beat (GitHub bookkeeping)

- L-SIGNING-SHA: parent payload `3ce42dc1…` stamped RETIRED lander.
- EXECUTE_DEPLOY expected SHA marked retired lander, not current face.

## Still open — GitHub logic (files exist, street not this tree)

| ID | GitHub fact | Live fact |
|---|---|---|
| L-LOOK-404 | Root `_redirects` + `_worker.js` map `/look` → `/look.html`. File missing at root. Exists at `cf-pages/look.html`. | `/look` 404 |
| L-404-PLATE | `404.html` says Home, Look, and Ice are on the live site. | Look is not |
| L-ALACARTE-308 | Root has `alacarte.html`. `_redirects` 200-rewrite. `_worker.js` remaps. If ASSETS unbound, worker returns 503. | 308 / 503 |
| L-TILL-FIGHT | `/pay` copy Live checkout + Stripe links. Encycl/hall/ice closed. | both 200, copy fights |
| L-WAREHOUSE-FAKE-LIVE | `cf-pages/index.html` ticker APEX LIVE | street is cafe |
| L-HUD-NEST | HUD at `cf-pages/holographic-core/v2/` `apex_overwrite false` | path 404 |
| L-TWO-REDIRECTS | root `_redirects` ≠ `cf-pages/_redirects` | live uses root tree |
| L-GH-PAGES-RAIL | `deploy.yml` retired workflow_dispatch only. Other workflows still named deploy. | not the live rail |

## Still open — Cloudflare walls

| ID | Wall |
|---|---|
| L-TOKEN-10000 | Token lacks Pages Edit. wrangler fail-closed. |
| L-HUD-404 | `iris-holographic-join` routes exist in repo. Bind not live. |
| L-CAFE-APEX | Pages output `.` serving root cafe `index.html`. |
| L-NO-CONFIRM | No `confirm=DEPLOY`. |
| L-NO-FILE-PICK | Operator has not named which file may become `/`. |
| L-STRIPE-STATE | Active vs Deactivated unconfirmed. |
| DNS | Not a department of this book. |

## Not done this beat

No look.html copy. No `_redirects` edit. No `_worker.js` edit. No Worker bind. No apex rewrite. No 404.html rewrite. No pay rewrite.

A sentence that says Cloudflare is fixed while HUD is 404 is HOLE.
