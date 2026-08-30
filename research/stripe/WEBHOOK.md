# Stripe webhook fulfill — DualisCapax

Current as of: 2026-08-30 11:57 EDT

## Status

| ID | Item | Status |
|----|------|--------|
| WH-1 | Worker source | `workers/stripe-fulfill/` |
| WH-1b | Cloudflare Worker name | `stripe-fulfill-v2` (must match wrangler.toml) |
| WH-2 | Deployed public URL | TBD · first `npx wrangler deploy` |
| WH-3 | Dashboard endpoint + whsec | TBD · operator |
| WH-4 | Live Payment Links | blocked — only sandbox account connected |
| WH-5 | Jacket `open` | **false** (locked) |

## Builds error that was on screen

`API Request Failed: GET /api/v4/accounts/…/stripe-fulfill-v2/script-settings (undefined)`

Cause: empty Worker + name mismatch (`dualiscapax-stripe-fulfill` vs `stripe-fulfill-v2`).  
Fix shipped: wrangler `name = "stripe-fulfill-v2"` + `package.json`.  
Next operator click: save Builds settings as-is, then Retry build / wait for this commit to trigger.

## Events

- `checkout.session.completed` — primary fulfill
- `checkout.session.async_payment_succeeded` — delayed methods
- `checkout.session.async_payment_failed` — do not grant

## Flow

```text
buy.stripe.com → paid
  → Stripe POST worker
  → verify signature
  → map metadata.sku
  → grant seat / Fuel (ledger)
  → customer may land onboard.html / fuel.html (UX only)
```

## Operator steps when live account is connected

1. Recreate products/prices/Payment Links in **live** mode
2. Paste live URLs into `research/payment-links.json` → `payment_links.live`
3. Deploy worker; register webhook on **live** endpoint
4. Explicit order: set `open: true`
