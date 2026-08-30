# Stripe webhook fulfill — DualisCapax

Current as of: 2026-08-30

## Status

| ID | Item | Status |
|----|------|--------|
| WH-1 | Worker source | `workers/stripe-fulfill/` |
| WH-2 | Deployed public URL | TBD · operator |
| WH-3 | Dashboard endpoint + whsec | TBD · operator |
| WH-4 | Live Payment Links | blocked — only sandbox account connected |
| WH-5 | Jacket `open` | **false** (locked) |

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

1. Recreate 6 products/prices/Payment Links in **live** mode  
2. Paste live URLs into `research/payment-links.json` → `payment_links.live`  
3. Deploy worker; register webhook on **live** endpoint  
4. Explicit order: set `open: true`  
