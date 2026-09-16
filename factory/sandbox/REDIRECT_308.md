# REDIRECT 308

Plate fact, not a missing ice.html.

## What Pages does

Cloudflare Pages **308s** a directory-style path to the trailing-slash form (or the reverse) before `_redirects` 200 rewrites fully win. Community: `/test` → `/test/` 308 is built-in.

If both `ice.html` **and** `ice/index.html` exist, plus:

```
/ice   /ice.html  200
/ice/  /ice.html  200
```

then `/ice` → `/ice/` → `/ice` can become **308 to self**.

## Two trees (this repo)

`wrangler.toml`: `pages_build_output_dir = "."` — **root** `_redirects` is the file Pages eats.
`cf-pages/_redirects` has easthill/sara rules the root file **does not**. Those rules are a book, not the plate, unless output dir is `cf-pages/`.

Root has `ice.html`. `cf-pages/ice/index.html` also exists. Single-path law is already broken in the book.

## Do not

Full-replace `ice.html` to “fix” a 308.
Smash Home.
Add another `/ice` → `/ice` 301.

## Short arrows

1. Host map: Worker route vs Pages on `/ice` (dashboard, not git).
2. Pick one ice file. Never both `ice.html` and `ice/index.html` on the **served** tree.
3. Align one `_redirects` with the output dir.
4. Directory desks (`/rte/easthill/`) stay slash-true; children need files on the served tree + 200 rewrite in the **eaten** `_redirects`.
