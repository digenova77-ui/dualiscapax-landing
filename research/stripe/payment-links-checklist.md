# Payment Links checklist

After the six products exist in Stripe:

| sku | CAD | Price (cents) | Payment Link URL (paste when created) |
|-----|-----|---------------|----------------------------------------|
| leaf | 49.00 | 4900 | |
| branch | 149.00 | 14900 | |
| library | 499.00 | 49900 | |
| depth_s | 20.00 | 2000 | |
| depth_m | 50.00 | 5000 | |
| depth_l | 120.00 | 12000 | |

1. Create link per product (quantity fixed to 1).
2. After payment success URL (optional): `https://dualiscapax.ai/onboard.html` or `/buy.html`.
3. Send the six `buy.stripe.com` URLs to wire `payment-links.json` + `buy.html`.
4. Only then set `open: true` if you accept live checkout.

**Not Stripe SKUs:** Look, Measure, Audit, DC-SRI-1, Founding, Crown.
