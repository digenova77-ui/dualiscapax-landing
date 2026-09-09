# DEC-M weekly grant instrument

**Status:** instrument only. DEC-M is a V9 proposal SKU, not live.
**Checkout:** `open: false`.
**Not this file:** lander tile, Payment Link, sealed bodies, a fitted ε.
**Date:** 2026-09-08

Companion: `research/PRICING-V9-PROPOSAL.md`, `workers/stripe-fulfill/schema.sql`, `workers/stripe-fulfill/weekly-dec-m.sql`.

---

## Purpose

When (if) DEC-M grants exist, measure own-price and cross-price vs SuperGrok Heavy from **the same weekly grain**:

- \(N\) = new DEC-M entitlements that week (write-once `session_id`)
- \(u\) = Fuel `SUM(units)` on those emails that week
- \(P_H\) = Heavy list USD, annotated off-ledger

Until grants exist, every rollup is a zero row. That is correct. Do not invent \(N\).

---

## SKU filter (do not widen)

Count as DEC-M only when `entitlements.sku` is one of:

- `DEC-M`
- `dec-m`
- `sku.decision.month`
- `sku.decision.month.<class>`

Do **not** include Leaf / Branch / Trunk / Atlas / F1–F5 / Crown.
Do **not** treat Iris Look sessions as grants.

Class: parse from `sku.decision.month.<class>` when present. Else `UNRESOLVED`.
Do not infer class from email domain. Do not pool medical with engineering.

---

## Weekly grain

Week = Monday 00:00 UTC → next Monday, from `created_at` (unix seconds).

```sql
strftime('%Y-%W', created_at, 'unixepoch')
```

Use ISO week in the view (`weekly-dec-m.sql`). One row per `(week, class)`.

---

## Columns to store / print

| Column | Source | Rule |
|---|---|---|
| `week` | `created_at` | UTC ISO week |
| `sku` | `entitlements.sku` | DEC-M family only |
| `class` | sku suffix or `UNRESOLVED` | never pooled |
| `n_grants` | `COUNT(*)` entitlements | write-once; replays are not new |
| `n_emails` | `COUNT(DISTINCT email)` | intensity vs headcount |
| `cad_list_cents` | locked jacket when V9 seals | not scraped from chat |
| `cad_paid_cents` | `SUM(amount_cad_cents)` | actual paid |
| `fuel_units` | `SUM(fuel_credits.units)` for those emails that week | complements, not the grant |
| `n_cancel` | 0 until a cancel table exists | do not fake churn |
| `heavy_usd` | operator annotation | not in D1 |
| `ticket_mix` | operator annotation | `bucket` \| `door` \| `desk` \| `vault` |

`heavy_usd` and `ticket_mix` stay **off D1**. Write them in the weekly operator note, not in `entitlements`.

---

## How to read a week

- \(N=0\) → no ε. Stop.
- Heavy promo week ∧ DEC-M \(N\) up ∧ tickets=`bucket` → treat as \(\varepsilon_{DEC,H}>0\) (speech failed).
- Fuel units up, DEC-M \(N\) flat → overflow compute, not a desk.
- Medical week and engineering week moving together on a Heavy promo → gate leak.

Do not compute ε_arc while either adjacent week has \(N=0\).

---

## What this instrument will not do

- Flip checkout.
- Insert demo grants.
- Paint DEC-M on the five cards.
- Store Heavy's price in D1 as if it were a Dualis SKU.
- ALTER `entitlements` in a way that breaks `claimGrantD1`.

House reading: weekly DEC-M is a view over write-once grants plus Fuel SUM. Empty is the current true row. V8 stays painted. V9 stays a proposal until operator lock.
