# GATEWAY-DRY-RUN — closed-rail stress protocol

Stamp: 2026-09-21
Repo: digenova77-ui/dualiscapax-landing
Law: CHECKOUT_OPEN stays false. Stripe identity is unvalidated.
This document is PAPER until Seat packs Cloudflare. It never flips the vault.

## What "stress test" means here

User allowed path-contract probes because even an opened Stripe Payment Link cannot settle while identity is unvalidated. Allowed:

- GET/HEAD of jacket, health, quote, dry-run, fulfill health, known `buy.stripe.com` URLs
- POST `/pay/intent` expecting closed (`403 reason=closed` on the worker; live apex GET is `404 no-route`)
- POST `/hooks/stripe` with no signature expecting `400`

Forbidden:

- Setting `CHECKOUT_OPEN=true` or `open: true` or `jacket_open: true`
- Submitting a card, Payment Element, Apple Pay, or crypto transfer
- Binding dualis-gate to `/*`
- Redesigning `/hall/`
- Claiming a Payment Link is "deactivated" from git — only Stripe Dashboard can expire them

## Rails map (2026-09-21 probe)

| Surface | Live fact | Git jacket |
|---|---|---|
| `GET /u/health` | `{"ok":true,"phase":"B+C","checkout":false}` | wrangler `CHECKOUT_OPEN="false"` |
| `GET /pay/quote` | `{"open":false,"residual":"unpublished","rails":"/hall/rails.html"}` | same |
| `GET /pay/intent` | `404 {"ok":false,"reason":"no-route"}` | worker only accepts POST |
| `POST /pay/intent` | worker contract `403 {"reason":"closed"}` | must stay 403 while flag false |
| `GET /pay/` (apex) | copy: Checkout closed, no stripe hrefs | `cf-pages/pay.html` on main still said Live checkout — pack must not regress |
| `GET stripe-fulfill-v2.../` | `checkout_open:false`, `grant_path_gated_by_checkout_open:true`, `has_d1:false`, `PARKED_UNTIL_BIND_CONTINUE` | git worker GET envelope may lag live |
| `research/payment-links.production.json` | `open: false` | live_url still set for SKU-002/003/004/017/019 |
| Extra Payment Link not in jacket | `https://buy.stripe.com/00w5kF41NbU55ahaslffy03` ($149 field) | DARK; deactivate in Dashboard |

## Known Payment Links (DARK / PAPER — do not advertise)

- SKU-002 Fuel 40 $20 — `https://buy.stripe.com/fZu3cxcyj2jvfOV0RLffy05`
- SKU-003 Fuel 120 $50 — `https://buy.stripe.com/7sY28t1TF2jvdGNbwpffy02`
- SKU-004 Fuel 320 $120 — `https://buy.stripe.com/14A6oJ2XJ0bngSZ581ffy01`
- SKU-017 Indication leaf $49 — `https://buy.stripe.com/8x2eVfbufe2d7ip9ohffy04`
- field $149 (not in jacket) — `https://buy.stripe.com/00w5kF41NbU55ahaslffy03`
- SKU-019 Super-Trunk $499 — `https://buy.stripe.com/7sY14p69VcY9cCJcAtffy00`

HEAD/GET documents HTTP status only. A 200 checkout page does **not** mean Dualis checkout is open. Identity unvalidated means settle fails. Seat click: deactivate in Stripe Dashboard.

## Offline contract (CI always)

1. `workers/dualis-gate/wrangler.toml` contains `CHECKOUT_OPEN = "false"`
2. No `routes = ["/*"]` under `workers/dualis-gate`
3. No `sk_live_`, `whsec_`, PEM private keys in dualis-gate source
4. `research/payment-links.production.json` `meta.open === false`
5. `node workers/dualis-gate/replay-test.mjs` all greens
6. `GET /pay/dry-run` (worker) returns `open:false` and `identity:"unvalidated"`

## Live probe (workflow_dispatch only)

Run `node research/ops/gateway-live-probe.mjs --live`.

Accept closed if:

- health `checkout !== true`
- quote `open !== true`
- intent status in `{403,404}` and body.reason in `{closed, no-route, checkout_closed, session_mint_closed}`
- unsigned `/hooks/stripe` is 400 or 404 (not 200 applied:true)

Never POST a payment method. Never flip a flag.

## D1

Read-only SQL: `workers/dualis-gate/projections-closed-rail.sql`.
`dualis-unity` is identity + webhook log. It is not a fuel ledger and not `dualiscapax-fulfillments`.

## Seat clicks this pack cannot perform

1. Pack cf-pages zip so apex serves parked pay.html + security.txt + headers from PR #40.
2. Deactivate the six Stripe Payment Links in Dashboard.
3. Zone HSTS + drop HTML ACAO `*`.
4. Fix `www.dualiscapax.ai` DNS if still NXDOMAIN.
5. Validate Stripe identity when the house is ready — then, and only then, Bind-continue.
