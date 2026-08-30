# DualisCapax Stripe fulfill worker

Current as of: 2026-08-30 11:57 EDT

Worker name in Cloudflare dashboard: **stripe-fulfill-v2**  
`wrangler.toml` name: **stripe-fulfill-v2**  
Repo path: `workers/stripe-fulfill`

Server endpoint for `checkout.session.completed` (and async success). Grants Leaf / Branch / Library / Fuel from `metadata.sku`.

## Why the red banner happened

```
API Request Failed: GET …/stripe-fulfill-v2/script-settings (undefined)
```

Two facts, both true at once:

1. Cloudflare Builds requires the `name` in `wrangler.toml` to match the Worker the Git repo is connected to.
2. `script-settings` is undefined until the Worker has a first successful `wrangler deploy`. An empty Builds-connected Worker has no script yet, so the dashboard GET returns nothing.

Do **not** use `npx wrangler versions upload` as the first production command. First ship must be `npx wrangler deploy`.

## Builds settings to save (exactly)

| Field | Value |
|-------|-------|
| Git repository | `digenova77-ui/dualiscapax-landing` |
| Build command | *(None / empty)* |
| Deploy command | `npx wrangler deploy` |
| Version command | `npx wrangler versions upload` |
| Root directory | `workers/stripe-fulfill` |
| Production branch | `main` |
| Builds for non-production branches | on |

If the red banner is still up after save: ignore it once, push or **Retry build**. After the first green deploy, script-settings exist and the banner dies.

If save still fails: **Settings → Builds → API token** — create a fresh user token (Workers Scripts Edit). Stale tokens also 404 this endpoint.

## Deploy (operator, after Builds is green or from a laptop)

```bash
cd workers/stripe-fulfill
npm install
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# paste whsec_… from Dashboard → Developers → Webhooks
npx wrangler deploy
```

Health check: `GET https://stripe-fulfill-v2.<account>.workers.dev/` must return JSON `status: up`.

## Dashboard webhook

1. Developers → Webhooks → Add endpoint
2. URL: `https://stripe-fulfill-v2.<account>.workers.dev/`
3. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## SKU map

| metadata.sku | Grant |
|--------------|--------|
| leaf | seat 12 mo one room |
| branch | seat 12 mo one field |
| library | seat 12 mo one domain class |
| depth_s | +40 Fuel |
| depth_m | +120 Fuel |
| depth_l | +320 Fuel |

## Law

- No secret keys on dualiscapax.ai
- Idempotent on `session.id`
- IP gate still applies after pay (medical / engineering docs)
- Do not set `open: true` until **live** Payment Links exist and operator orders open
- Drive packs that stamp `open: true` with placeholder `buy.stripe.com/LIVE_*` URLs are not live. Jacket stays closed.
