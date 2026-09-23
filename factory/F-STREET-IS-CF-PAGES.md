# F-STREET-IS-CF-PAGES

Apex is the cf-pages zip, not the repo root.
Bug: `_redirects` / `_worker` mapped `/hockey` `/ice` `/rink` to deleted `hockey.html`.
Fix: `cf-pages/hockey/index.html` only. No sibling `.html`. Unmap the dead rewrite. Dispatch `pages-direct-upload` `confirm=DEPLOY`.
Receipt: `/hockey` `/hockey/` 200.
