# Stripe Payment Links — DualisCapax access.dual.v2

**Never put `sk_test_` / `sk_live_` in this repo or on the site.**

## Create links (Dashboard · ~5 min)

1. Open [Stripe Dashboard → Payment Links](https://dashboard.stripe.com/test/payment-links) (use **Test mode** first).
2. **Create payment link** for each SKU:

| SKU | Product name | Price |
|-----|----------------|-------|
| `leaf` | DualisCapax · Single leaf pack | **CAD $49** one-time |
| `branch` | DualisCapax · Branch access 12 mo | **CAD $149** one-time |
| `library` | DualisCapax · Full residual library 12 mo | **CAD $499** one-time |

3. Copy each link (`https://buy.stripe.com/...`).
4. Paste into `research/payment-links.json`:

```json
"stripe_payment_link": "https://buy.stripe.com/test_xxxxx"
```

5. Hard-refresh https://dualiscapax.ai/research/access.html — status should read live.
6. When ready for real money: repeat in **Live mode**, set `"mode": "live"`, paste live URLs.

## Security

- Only `buy.stripe.com` URLs are public.
- Card data never hits dualiscapax.ai.
- Crypto remains equal-CAD outside Stripe.
