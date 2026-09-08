# IP access gate — DualisCapax

**SUPERSEDED price table:** the CAD ladder below this banner is V8 (2026-09-08).  
Do not use the 2026-08-30 v2 numbers (Branch $149 / Library $499).  
Jacket lock: `research/PRICING-NOT-THE-VAULT.md` + `research/payment-links.json` (`access.dual.v8`).

**Checkout:** `open: false`  
**Rule:** Public residual prose ≠ residual IP depth. If a page shows a price, it must match V8. Closed SKUs say CLOSED — not Buy now.

---

## 1. Pricing consistency (V8 source of truth)

| ID | SKU | CAD | Unit | What it is | What it is **not** | Status |
|----|-----|-----|------|------------|---------------------|--------|
| L0 | Look | 0 | — | Public residual prose | Depth packs | **open** |
| L1 | Measure / Audit | 0 | — | Peg language, crypto receipt audit | Full leaf JSON | **open** |
| L2 | Leaf SKU-017 | 49 | 12 mo | One indication **seat format** | ALS program, any sealed engine | priced_closed |
| L3 | Branch SKU-018 | 299 | 12 mo | One clade of names (10–20) | Cross-clade vault | priced_closed |
| L4 | Trunk SKU-019 | 499 | 12 mo | One named super-trunk class pack | Transfer of ALS / PD / AD engines | priced_closed |
| L4 | Atlas SKU-029 | 1499 | perpetual | Taxonomic atlas / index | ALS, MS, medical vault, eng vault, “the whole thing” | priced_closed |
| F1–F5 | Fuel | 5/20/50/120/350 | prepaid | Depth run time | Permanent IP license | priced_closed |
| CROWN | Wet-ink | null | — | Cross-class vault / CRA / government | Agent-sold | **never_agent** |

**Scarcity law:** CAD $1,499 is an index seat. It does not assign ALS, MS, or either vault. Cross-class = Crown.

**Consistency law:** IP-GATE no longer paints Branch $149 or Library $499.

---

## 2. How IP is gated (layers)

```
L0 Look     → public HTML (anyone)
L1 Measure  → audit / Iris measure (anyone; receipt on device)
L2 Leaf     → one gated pack (paid when open + grant)
L3 Branch   → one field set (paid when open + grant)
L4 Trunk    → one domain class pack (paid when open + grant)
L4 Atlas    → index seat only (paid when open + grant) — not the vault
DEPTH       → medical-depth / eng-depth (identity gate OR paid seat)
CROWN       → owner only
```

| Control | Mechanism | Status |
|---------|-----------|--------|
| Public floor | Static HTML under `/research/` | live |
| Medical depth door | `js/medical-gate.js` + `data-medical-depth="1"` | live (identity) |
| Engineering depth door | `js/engineering-gate.js` | live (identity) |
| Paid seat | Stripe Payment Link → grant cookie/session | WAIT_RAIL |
| Crypto audit | SHA-256 chain on device (`audit.html`) | live (receipt, not IP unlock) |
| Crown | never on FE catalog | locked |

A **crypto audit receipt does not unlock IP depth**.

---

## 3. Example A — Medical

| Floor | What visitor gets | Gate |
|-------|-------------------|------|
| **Look** | Title, control ID, “simulation ≠ treatment” | Open |
| **Measure** | Name residual in protocol friction — no treatment claim | Open |
| **Depth** | Pack JSON, simulation sheets | `.org` / `.gov` / `.gc.ca` **or** SEAL-1 **or** (when open) class grant |
| **Not sold** | Cure, diagnosis, clinic credential, securities, ALS-for-$49 | Hard speech |

---

## 4. Example B — Engineering

| Floor | What visitor gets | Gate |
|-------|-------------------|------|
| **Look** | Title, control ID, “not a P.Eng. stamp” | Open |
| **Measure** | Plant/energy residual measure (CAD, kWh, scrap) | Open |
| **Depth** | Residual workbooks, invert sheets | `.edu` / `.gov` / `.gc.ca` / plant allow-list **or** SEAL-1 **or** (when open) eng grant |
| **Not sold** | Safety certification, stamped engineering seal, securities | Hard speech |

Buying atlas-medical does **not** open eng-depth. Cross-class = Crown / wet-ink.

---

## 5. Open vs closed

Before `open: true`:

1. Stripe links exist for Branch $299 and Atlas $1,499 (missing today)
2. IP gate scripts on every depth page
3. Copy never says “all Dualis IP” or “117-indication master” for $1,499
4. Medical and engineering hard speech stay on depth

---

## 6. Not this document

- Not medical advice or treatment
- Not a professional engineering stamp
- Not securities
- Not an open checkout order

Ontario / Canada first. No tribes preferred.
