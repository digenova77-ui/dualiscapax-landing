# Stripe Payment Links — DualisCapax access.dual.v8

Current as of: 2026-09-01
Source: ED-PRC-20260901-120-TIER-MASTER-V8
Access: CLOSED (`open: false`)

**Never put `sk_test_` / `sk_live_` in this repo or on the site.**

## Public SKUs (itemize)

| ID | SKU | Name | CAD | Equal-crypto | Status | Live Payment Link |
|----|-----|------|-----|--------------|--------|-------------------|
| SKU-001 | fuel_10 | Fuel 10 | 5 | 5.00 CAD-eq | closed | none yet |
| SKU-002 | depth_s | Fuel 40 | 20 | 20.00 CAD-eq | closed | amount-matched URL reserved |
| SKU-003 | depth_m | Fuel 120 | 50 | 50.00 CAD-eq | closed | amount-matched URL reserved |
| SKU-004 | depth_l | Fuel 320 | 120 | 120.00 CAD-eq | closed | amount-matched URL reserved |
| SKU-005 | fuel_1000 | Fuel 1,000 | 350 | 350.00 CAD-eq | closed | none yet |
| SKU-016 | edu_leaf | Educational leaf | 19 | 19.00 CAD-eq | closed | none yet |
| SKU-017 | leaf | Indication leaf 12 mo | 49 | 49.00 CAD-eq | closed | amount-matched URL reserved |
| SKU-018 | branch | Clade branch 12 mo | 299 | 299.00 CAD-eq | closed | none — v2 $149 URL retired |
| SKU-019 | trunk | Super-Trunk 12 mo | 499 | 499.00 CAD-eq | closed | v2 $499 library URL remapped |
| SKU-029 | library | Master library perpetual | 1499 | 1,499.00 CAD-eq | closed | none yet |

## Dual-rail

| Combo | Path A | Path B | Rule |
|-------|--------|--------|------|
| PAY-1 | Stripe Payment Link (when open) | Equal-CAD BTC / ETH / SOL / USDC | No exchange product |

## Create missing links (Dashboard · operator only)

1. Open Stripe Dashboard → Payment Links. Test mode first.
2. Create one-time CAD prices for the rows with `none yet`.
3. Paste only `https://buy.stripe.com/...` URLs into `research/payment-links.json`.
4. Do not set `open: true` from this file. That is an operator order after IP lock.

## Security

- Only `buy.stripe.com` URLs are public.
- Card data never hits dualiscapax.ai.
- Crypto remains equal-CAD outside Stripe.
- Do not invent Payment Link URLs.
