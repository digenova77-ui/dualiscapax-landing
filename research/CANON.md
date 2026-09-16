# CANON — one house

Too many pieces. This is the machine.

```
phone / factory
       ↓
   git main
   cf-pages/     ← only place live HTML is born
       ↓
   Cloudflare Pages project dualiscapax-landing
       ↓
   dualiscapax.ai
```

Drive = archive shelf. Piñata = pin after a 200. Neither is System of Record.
Bots read git. Not IPFS_LATEST. Not 09 ARCHIVE.

## Deploy (pick one kitchen, delete the other later)

A. Dashboard: connect this GitHub repo to project dualiscapax-landing.
   Push to main is the site. No token in Actions.

B. One token: Account → Cloudflare Pages → Edit. Overwrite CLOUDFLARE_API_TOKEN.
   pages-direct-upload once. Same folder, same project.

Do not run A and B at the same time on purpose. Do not add S3.

## Names that die

- wrangler.toml `name = dualiscapax-web` + `pages_build_output_dir = "."`
  Live name is dualiscapax-landing. Live dir is cf-pages/.
- public/ as a second site tree. Ice/gameday live in cf-pages only.
- Agent text that says Piñata is primary memory.

## After apex matches git

Pinata pin is a mirror job, not a source.
live-clock is the only probe.
Product order: gameday PA → ice portal → SIMA → Stripe when it is a real clock.

If a bot cannot see it in cf-pages/ on main, it is not on the website.
