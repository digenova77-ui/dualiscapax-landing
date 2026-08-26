# Fuel — Unified Residual Capacity

**Status:** Locked · Unified 26 Aug 2026  
**Under:** Project Scope · DualisCapax Logic Model (DCLM) · Residual Cost Peg · Mission Statement

> Every decision leaves a residual.  
> Capacity is measured. Residual is priced.  
> One law for all. Free will.  
> Truth prevails.

## 1. Single Model (Nothing Left Over)

**Fuel is the sole atomic unit of residual capacity.**

| Concept | Unified meaning |
|---------|-----------------|
| **Fuel** | Prepaid residual capacity unit |
| **Residual Seat** | Container that holds Fuel under the Residual Cost Peg |
| **Residual Cost Peg** | `Capacity_Remaining = Prepaid_Fuel − Measured_Residual_Burn` |
| **Burn** | Measured residual work (compute / structure / irreversible) recorded against the seat |
| **Open (L1)** | Free research / published surface — **zero Fuel required** |
| **Prove** | Money + identity boundary before any Fuel-consuming Adaptive Depth |
| **Depth (L3)** | Adaptive AI / sandbox / research packs — **burns Fuel** |
| **Seal (L4)** | Production / IP — higher residual density, still measured in Fuel |

There is no parallel capacity system. No separate “credit” product. No open-ended subscription. No tip jar. No equity-by-default.

## 2. Published Fuel Tiers (Canonical)

| Tier | CAD | Fuel Units | Effective rate | Use |
|------|-----|------------|----------------|-----|
| Starter | $20 | 40 | $0.50 / Fuel | Light adaptive sessions |
| Standard | $50 | 120 | ≈ $0.4167 | Regular depth use |
| Pro | $120 | 320 | $0.375 | Heavier adaptive / research work |

These tiers supersede any earlier draft pack sizes (50 / 200 / custom).  
Leaf / Branch / Library SKUs, when opened, are expressed as Fuel packages or time-bounded Fuel grants under the same peg — not a second currency.

## 3. Residual Cost Peg (Mechanical Heart)

```
Capacity_Remaining = Prepaid_Fuel − Measured_Residual_Burn
```

- Burn is recorded until spent or released under seat terms.
- Irreversible residual is floor-bounded by the Landauer limit under DCLM.
- Unused Fuel stays on the book; it does not evaporate or convert to equity.
- One peg for every entity type (corporation, lab, school, individual).

## 4. Lifecycle (Unified)

1. **Open** — free research, no Fuel.
2. **Prove** — Mirror (identity) + Jump-start / Fuel settlement.
3. **Residual Seat created** — prepaid Fuel locked and credited.
4. **Depth** — adaptive work burns Fuel via Metering API.
5. **Release / Exit** — free-will release of remaining Fuel + deterministic cleanup under DCLM.

While seats are closed (`access.dual.v2 = false`), residual orders are remembered and matched under the Residual-Order Matching Algorithm when access opens.

## 5. Metering (Fuel Native)

All metering is expressed in Fuel units:

- `GET /v1/seat/{seat_id}/capacity` → prepaid / burned / remaining (Fuel)
- `POST /v1/seat/{seat_id}/burn` → residual_class + quantity (Fuel)
- Residual classes: `compute` | `structure` | `irreversible`
- Residual commitment chain remains mandatory under DCLM

Backend path (operational, unchanged in principle):

```
Client → DualisCapax edge (auth + Fuel balance check)
      → xAI / Grok API (server-side key only)
      → response
      → debit Fuel via Metering API
```

Never put API secrets in frontend. Never run unbounded free depth.

## 6. What Is Eliminated (Leftovers Removed)

| Leftover | Disposition |
|----------|-------------|
| Separate “Fuel credit” product language | Absorbed into Residual Seat + Fuel |
| Draft pack sizes 50 / 200 | Superseded by Starter 40 / Standard 120 / Pro 320 |
| Parallel SKU currency | SKUs become Fuel packages / time-bounded Fuel grants |
| Open-ended subscription / tip-jar language | Eliminated |
| Equity / yield / preferred-claim language | Explicitly forbidden |
| 2P5L terminology | Permanently retired — use **DCLM** only |
| Matrix rain / full-sentence fade-in | Forbidden — granular sprite assembly only |
| Personal consumer Grok login as multi-user backend | Forbidden |
| Dual capacity systems | Eliminated — Fuel is the only unit |

## 7. Treasury Residual (Still in Fuel Terms)

1. Operating residual first  
2. Majority surplus (~60–70 %) deferred to long-horizon structure  
3. Founder residual stipend-capped after operating need  

All measured and reported against Fuel / residual capacity. Not a return guarantee. Not equity.

## 8. One Law

The same Fuel tiers, Residual Cost Peg, Metering API, DCLM rules, free-will exit, and residual honesty apply to every participant. No preferred tribe.

## 9. Agent Rule

- Fuel is the sole residual capacity unit.  
- Do not reintroduce parallel credit systems, old pack sizes, 2P5L, Matrix rain, equity language, or open-ended subscriptions.  
- All future residual-law specs must speak in Fuel under the Residual Cost Peg and DCLM.  
- Update living Skills & Rules after any change to this unified model.

---

*Unified and locked by residual-law agent team · 26 Aug 2026*
