# Stripe webhook test — DualisCapax

Live fulfill worker is already up. GitHub Actions cannot redeploy it until `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist. That does not block testing.

## Endpoint

```
POST https://dualiscapax-stripe-fulfill-v2.digenova77.workers.dev/
```

GET that same URL returns `{ status: "up", has_webhook_secret: true, has_kv: true }`.
Unsigned POST returns `invalid signature`. That is correct.

## Send a test event (Dashboard, ~1 minute)

1. Open [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks) in **Test mode**.
2. Add endpoint if missing:
   - URL: `https://dualiscapax-stripe-fulfill-v2.digenova77.workers.dev/`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
3. Open the endpoint → **Send test event** → pick `checkout.session.completed`.
4. Expect HTTP 200 from the worker.

## Pay a real test card

Use a Test Payment Link from `research/payment-links.json`:

- leaf `https://buy.stripe.com/test_aFaeVdcQm5pJ8IJ1oN3ZK00`
- depth_s `https://buy.stripe.com/test_7sY00j9Ea05p2klebz3ZK03`

Card: `4242 4242 4242 4242` · any future date · any CVC · any postal.

Success return page on this site: `/pay/thanks.html`.

## Live money links (already 200)

Fuel and seats on `/payments.html` use live `buy.stripe.com` URLs. Do not send test cards there.

## What GitHub Actions secrets still cannot do

Redeploy worker *source*. Current live source already verifies Stripe signatures and grants Fuel / seats into KV. Leave it.
