# Live status — 2026-09-01T12:20Z

HASH-20260901-1208-GROK-WIN · COMPLETE

## What is already live

| Rail | URL | Probe |
|---|---|---|
| Site | https://dualiscapax.ai/ | HTTP 200 |
| Look | https://dualiscapax.ai/look.html | HTTP 200 |
| Iris app | https://dualiscapax.ai/ai/app | HTTP 200 |
| Payments | https://dualiscapax.ai/payments.html | live buy.stripe.com links |
| Thanks | https://dualiscapax.ai/pay/thanks.html | HTTP 200 |
| Depth worker | https://dualiscapax-depth.digenova77.workers.dev/ | up, has_key true |
| Stripe fulfill | https://dualiscapax-stripe-fulfill-v2.digenova77.workers.dev/ | up, has_webhook_secret true, has_kv true |

## What is blocked without owner action

1. **GitHub Actions cannot redeploy Workers.** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are empty. Existing workers stay as they are. New source in `workers/iris-gateway/` is not on the edge.
2. **House xAI tank is empty.** POST `/v2/chat` on the depth worker returns 403: team `5682c` used all credits. Browser BYOK is the workaround: visitor sends their own `xai-` key.
3. **Stripe MCP session has no bound account.** Connector returned a reconsent URL. Test webhooks still work from the Stripe Dashboard against the live fulfill worker.

## Webhook test (no new secrets)

Destination already live:

```
POST https://dualiscapax-stripe-fulfill-v2.digenova77.workers.dev/
```

Unsigned POST returns `invalid signature` / 400. That is the correct lock.

Dashboard test:
1. Stripe Test mode → Webhooks → that URL
2. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
3. Send test event
4. Expect 200

Test pay: `4242 4242 4242 4242` on a `test_` Payment Link, then `/pay/thanks.html`.

## Do not do

- Do not paste tokens into chat.
- Do not point live Payment Links at test cards.
- Do not turn `IRIS_ALLOW_HOUSE_KEY` on while the house tank is empty.
