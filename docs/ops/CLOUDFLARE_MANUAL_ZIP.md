# Cloudflare manual deploy — hierarchical flat zip

Document control: `ED-OPS-20260911-CF-ZIP-V1`

GitHub does not publish dualiscapax.ai. A seated operator does.

## Pages (static lander)

1. From repo root:

```bash
python3 scripts/pack_hierarchical_flat_zip.py --lander
```

2. Output:

```
dist/cloudflare/lander-<UTC-stamp>.zip
dist/cloudflare/lander-<UTC-stamp>.manifest.json
dist/cloudflare/archive-flat-<UTC-stamp>.zip
```

3. Cloudflare Dashboard → Pages → the DualisCapax Pages project → **Create deployment** → **Upload assets** → drop `lander-*.zip`.

4. Confirm `index.html` is at the zip root before upload (`unzip -l lander-*.zip | head`).

5. Do not connect the GitHub repo as a Pages production source.

## What goes in the lander zip

Included:

- Root lander files: `index.html`, `why.html`, `story.html`, `hub.html`, `curtain.html`, `world.html`, province pages, `encyclopedia.html`, `theme.css`, `styles.css`, `CNAME`, `_headers`, `404.html`, …
- Dirs: `js/`, `css/`, `data/`, `hall/`, `assets/`, `brand/`
- Numbered web flats restored to hierarchy: `05_WEB__research__access.html` → `research/access.html`

Excluded:

- `.git`, `.github`, `workers/`, `node_modules/`, `*.env`, keys, `wrangler.toml`
- Encyclopedia / legal / core Python (those stay in GitHub + optional full Pinata pin)

## Workers (not a zip)

Workers stay in git as source. Deploy them from a seated machine:

```bash
npx wrangler whoami
# iris
( cd workers/iris-gateway && npx wrangler deploy )
# stripe fulfill
( cd workers/stripe-fulfill && npx wrangler deploy )
```

Do not use `.github/workflows/workers-live.yml` as the production rail.

Secrets (`XAI_API_KEY`, `STRIPE_WEBHOOK_SECRET`, Cloudflare token) stay in Cloudflare / local wrangler. Never in the zip. Never in git.

## After upload

- Record stamp + zip sha256 in `data/cf-last-manual.json` (the packer writes a draft).
- Optionally pin the same lander with Pinata.
- Commit docs and receipts to GitHub. Not the live bytes-via-Actions.
