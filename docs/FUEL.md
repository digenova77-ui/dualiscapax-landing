# #FUEL — DualisCapax capacity credit (restored)

**Status:** Product law restored 2026-08-24  
**Purpose:** Users pay **Fuel** so the AI backend is not run at a loss.

---

## What Fuel is

| Term | Meaning |
|------|--------|
| **Fuel** | Prepaid credit for Adaptive Intelligence depth (chat / sessions) |
| **Open** | Free research / published surface — no Fuel required |
| **Depth** | Metered Grok-backed dialogue and adaptive work — **burns Fuel** |

Fuel is **closed prepaid capacity** for use on the plane — aligned with Fusion Meter language. Not a meme coin for speculation.

---

## Backend (critical)

### Correct path

```text
User (mobile chat)
  → DualisCapax edge (auth + Fuel balance check)
  → xAI Grok API (API key on DualisCapax server)
  → response
  → debit Fuel
```

- Backend model family: **Grok via xAI developer API**  
- Billing to DualisCapax: **xAI API usage (per token)**  
- Billing to user: **Fuel packs** (prepaid CAD/crypto as you choose)

### What does *not* work as multi-user backend

| Approach | Why not |
|----------|--------|
| Shared **SuperGrok / consumer** login (`digenova77@gmail.com`) | Personal subscription ≠ public multi-tenant API; ToS / security / no stable server key |
| Putting your Grok password in the website | Never |
| Unlimited free chat for all visitors | Backend runs out of money |

Your Grok **account** is for **you** (builder).  
Your **xAI API key** (console.x.ai / xAI cloud) is for **the product**.

---

## Fuel ledger (minimal)

```text
UserAccount
  fuel_balance   (integer units)
  currency_paid  (audit)

FuelPack (SKU)
  units, price, active

LedgerEntry
  user_id, delta, reason (purchase | burn_chat | burn_session | grant)
  ref (payment id or request id)
```

**Burn rule (example):** each depth message burns `max(1, ceil(tokens/1k))` Fuel units — tune after measuring real xAI cost + margin.

**Gate rule:**

- `fuel_balance > 0` → allow depth completion  
- else → offer Fuel pack / onboard  
- Open research routes never require Fuel  

---

## Best rebuild order

1. **Law** (this file) — done  
2. **UI** — chat shows Fuel balance + “Add Fuel”  
3. **Edge stub** — refuse depth when balance 0 (local demo OK)  
4. **Payments** — CIBC / gateway / crypto packs (your existing gateway plans)  
5. **xAI API** — server-side key, never in the browser  
6. **Live debit** — after each successful completion  

---

## Relation to Fusion Meter

Same idea, product names:

- **Fusion Meter** — capacity / prepaid metaphor in narrative  
- **Fuel** — user-facing credit name for burn on chat/depth  

Keep both consistent: closed prepaid, not open-market toy coin.

---

## Agent rule

Do not delete this file without explicit owner order.  
Do not implement “free unlimited Grok for everyone.”  
Do not put API keys in GitHub frontend.
