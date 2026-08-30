# DualisCapax Stripe fulfill worker

Current as of: 2026-08-30

Server endpoint for **checkout.session.completed** (and async success). Grants Leaf / Branch / Library / Fuel from `metadata.sku`.

## Why

Static GitHub Pages cannot hold `sk_` or verify webhooks. Fulfillment must be a separate HTTPS service.

## Deploy (Cloudflare Workers)

```bash
cd workers/stripe-fulfill
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# paste whsec_… from Dashboard → Developers → Webhooks

npx wrangler deploy
```

Optional KV for idempotency: create a namespace, bind as `FULFILL_KV` in `wrangler.toml`.

## Dashboard

1. Developers → Webhooks → Add endpoint  
2. URL: `https://<your-worker>/`  
3. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`  
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## Local test

```bash
stripe listen --events checkout.session.completed \
  --forward-to localhost:8787/
stripe trigger checkout.session.completed
```

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
