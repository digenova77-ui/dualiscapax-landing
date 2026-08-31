# Fulfill matrix — every gated object must deliver

**Current as of:** 2026-08-31  
**Webhook:** `https://dualiscapax-stripe-fulfill-v2.digenova77.workers.dev/`  
**Events:** `checkout.session.completed`, `checkout.session.async_payment_succeeded`

## Rule

If someone pays for X, the webhook must grant **X** — not a generic receipt.

| Stripe face (live link key) | metadata.sku | CAD | Delivers |
|-----------------------------|--------------|-----|----------|
| depth_s | `depth_s` | 20 | **+40 Fuel** |
| depth_m | `depth_m` | 50 | **+120 Fuel** |
| depth_l | `depth_l` | 120 | **+320 Fuel** |
| leaf | `leaf` | 49 | **Seat 12 mo · one room** |
| branch | `branch` | 149 | **Seat 12 mo · one field** |
| library | `library` | 499 | **Seat 12 mo · one domain class toolkit** (not full vault) |

## Operator checklist (Stripe Dashboard)

For **each** live Payment Link above:

1. Open the Payment Link → metadata  
2. Add key `sku` = exact value in table (`depth_s`, `leaf`, …)  
3. Confirm amount matches CAD column  
4. Success URL (optional): `https://dualiscapax.ai/bind-success.html?sku={sku}`  

If metadata is missing, the worker still tries **amount_total** fallback (CAD cents). Prefer metadata.

## Webhook

1. Stripe → Developers → Webhooks → endpoint = fulfill worker URL  
2. Events listed above  
3. `wrangler secret put STRIPE_WEBHOOK_SECRET` with `whsec_...`  
4. Optional KV binding `FULFILL_KV` for idempotent session + email fuel balances  

## Identity gate

Seat purchases open **settlement**. Medical / engineering **depth rooms** still require IP-GATE identity where documented. Pay ≠ automatic sealed IP unlock.

## Verify

```bash
curl -s https://dualiscapax-stripe-fulfill-v2.digenova77.workers.dev/
curl -s https://dualiscapax-stripe-fulfill-v2.digenova77.workers.dev/skus
```

After a test checkout, Stripe event log should show `fulfill.ok: true` and `grant.units` or `grant.ip`.
