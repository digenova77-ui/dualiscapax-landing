# DEC-M weekly grant instrumentation

**Status:** spec. DEC-M is a V9 proposal jacket, not a live SKU.
**Checkout:** `open: false`. This file does not paint DEC-M on the lander and does not add Payment Links.
**Date:** 2026-09-08
**Companions:** `research/PRICING-V9-PROPOSAL.md`, `workers/stripe-fulfill/schema.sql`, `workers/stripe-fulfill/grant-week.sql`

Purpose: when (and only when) a Decision-month grant exists, log a weekly row so own-price and Heavy cross-price can be computed later without pooling Leaf into DEC-M.

---

## What is a DEC-M grant

A row in `entitlements` whose `sku` is the Decision-month jacket (`SKU-DEC-M` when sealed; do not mint the code in `payment-links.json` from this file).

Required grant key: `(email, sku, class)` write-once. Medical cannot count as engineering. Fuel is a separate `fuel_credits` row. Ticket mix is not stored on the grant; it is operator-coded on the week row.

Until `open: true` and a DEC-M Stripe amount exists, every weekly query returns zeros. That is correct. Do not seed fake grants.

---

## Week grain

- Week starts Monday 00:00 UTC.
- `week_start` = unix seconds of that midnight.
- One row per `(week_start, sku, class)`.
- Never pool classes. Never pool DEC-M with SKU-017.

---

## Columns on `grant_week`

| Column | Source | Why |
|---|---|---|
| `week_start` | calendar | arc / log-log needs time |
| `sku` | entitlements.sku | own-price is per jacket |
| `class` | entitlements.class (additive; today missing) | isolation |
| `n_new` | COUNT grants created in week | headcount N |
| `n_alive` | COUNT grants not canceled and not expired at week end | survival |
| `n_canceled` | COUNT canceled_at in week | hazard |
| `fuel_units` | SUM(fuel_credits.units) for those emails in week | intensity u |
| `cad_list_cents` | locked list that week | P_i |
| `cad_paid_cents` | SUM amount actually captured | discounts |
| `heavy_usd_cents` | operator stamp, not scraped by the worker | P_H |
| `heavy_pool_tight` | 0/1 operator stamp | effective Heavy price |
| `tickets_bucket` | operator count | speech-failure tag |
| `tickets_door` | operator count | format tag |
| `tickets_desk` | operator count | refusal tag |
| `tickets_vault` | operator count | ALS/vault-seeking |

`heavy_*` and `tickets_*` are **not** Stripe fields. A Worker must not invent them. Operator pastes them when reviewing the week.

---

## Queries (live tables today)

Today `entitlements` has email, sku, tier, amount, status — **no `class`, no `canceled_at`**. Additive columns are in `grant-week.sql`. Until those exist, N can still be sketched:

```sql
-- New grants this week by sku (class missing → do not call this DEC-M isolation)
SELECT sku,
       COUNT(*) AS n_new
FROM entitlements
WHERE sku IN ('SKU-DEC-M', 'dec_m', 'decision_month')
  AND created_at >= ? AND created_at < ?
GROUP BY sku;
```

Fuel intensity for the same emails:

```sql
SELECT e.sku,
       SUM(f.units) AS fuel_units
FROM entitlements e
JOIN fuel_credits f ON f.email = e.email
WHERE e.sku IN ('SKU-DEC-M', 'dec_m', 'decision_month')
  AND f.created_at >= ? AND f.created_at < ?
GROUP BY e.sku;
```

Idempotency stays `ON CONFLICT (session_id) DO NOTHING`. A replay must not create a second week increment.

---

## Metrics the week row must support

Own-price arc, only if `cad_list` actually changed:

```
ε_arc = ((Q2-Q1)/(Q1+Q2)) / ((P2-P1)/(P1+P2))
Q = n_new   or   n_alive   — pick one and do not switch mid-series
```

Heavy cross-price, Dualis P frozen:

```
ε_DEC,H = ((Q2-Q1)/(Q1+Q2)) / ((P_H2-P_H1)/(P_H1+P_H2))
```

Flag (not an automatic ε):

- Heavy promo week AND n_new up AND tickets_bucket > tickets_desk → treat as substitute speech failure.

Zeros are legal. Invented grants are not.

---

## What this instrumentation will not do

- Flip `open: true`.
- Add DEC-M to `payment-links.json`.
- Paint a Decision tile on the five cards.
- Let Iris mint a DEC-M grant.
- Store ticket text that names a patient, a student, or a sealed body.
- Pool medical and engineering into one week row.
- Scrape Heavy from inside the fulfill Worker.

House reading: instrument the week so that when DEC-M exists, ε_DEC,H is computable. Until then the rollup is an empty table, which is the true measurement.
