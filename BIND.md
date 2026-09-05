# Bind live — operator only

Grok cannot log into Cloudflare. You do these once.

## FULFILL_KV (Fuel + no double credit)
1. dash.cloudflare.com → Storage → KV → Create namespace `dualis-fulfill`
2. Workers → `dualiscapax-stripe-fulfill-v2` → Settings → Variables → KV bindings
3. Variable name exactly `FULFILL_KV` → that namespace → Save
4. GET https://dualiscapax-stripe-fulfill-v2.digenova77.workers.dev/ must show `"has_kv":true`

## Stripe webhook (if not already)
Developers → Webhooks → URL = that fulfill host → events `checkout.session.completed` and `checkout.session.async_payment_succeeded`
Signing secret stays Worker secret `STRIPE_WEBHOOK_SECRET` (already true on last GET).

## Iris gateway CORS
After deploy of workers/iris-gateway, origins include github.io (now in wrangler.toml). Deploy from the agency machine:
`npx wrangler deploy --config workers/iris-gateway/wrangler.toml`
Do not put API keys in git. Secrets: dashboard only.

## Depth
Leave Access on or unused. Lander must not hang on it.

## Done when
- story.html opens on github.io
- pay links open Stripe
- fulfill GET has_webhook_secret true and has_kv true
- Iris look still answers if depth is locked
