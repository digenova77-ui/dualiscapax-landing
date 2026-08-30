# Stripe import pack — DualisCapax

**Current as of:** 2026-08-30  
**Jacket:** `access.dual.v2` · `open: false` until Payment Links exist  
**Account:** DualisCapax Inc. (livemode)  
**Currency:** CAD  
**Charge type:** one-time (not subscription) for all catalog SKUs below

## Files

| File | Use |
|------|-----|
| `dualiscapax-products.csv` | Spreadsheet + Dashboard create-by-row; amounts in **cents** |
| `dualiscapax-products-api.json` | Script / API create products + prices |
| `payment-links-checklist.md` | After products exist: create one Payment Link per price |

## How to use in Stripe Dashboard (no API write needed)

1. Open [Products](https://dashboard.stripe.com/products).
2. For **each row** in `dualiscapax-products.csv`:
   - **Add product**
   - Name + description from the CSV
   - **One-time** price
   - Amount = `unit_amount` ÷ 100 in CAD (e.g. `4900` → **CAD $49.00**)
   - Save
3. Open [Payment Links](https://dashboard.stripe.com/payment-links) → **New** → select that product → **Create link**.
4. Copy each `https://buy.stripe.com/...` URL.
5. Paste URLs into chat (or into `research/payment-links.json` under each sku as `stripe_url`) so the site can wire **Pay**.

Do **not** put secret keys (`sk_`) on the website.

## Agent / catalog feed (optional)

Stripe Agentic Commerce uses a different product-feed CSV via [Product Catalog Import](https://docs.stripe.com/agentic-commerce/product-feed).  
`dualiscapax-products.csv` is sized for **Payment Links + Products**, not the full agentic feed schema. Expand later if you enable ACS.

## Tax

Confirm tax codes in Dashboard (Stripe Tax). Digital residual access is typically a digital service — verify with your accountant for Ontario/Canada.

## Not included

- Look / Measure / Audit (CAD $0 — no Stripe product)
- DC-SRI-1 (10% residual share — not a fixed SKU)
- Founding (TBD)
- Crown (never on catalog)
