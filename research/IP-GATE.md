# IP access gate — DualisCapax

**Current as of:** 2026-08-30  
**Jacket:** `access.dual.v2`  
**Checkout:** `open: false`  
**Rule:** Public residual prose ≠ residual IP depth. Prices are consistent across surfaces; sale stays closed until settlement + IP posture you accept.

---

## 1. Pricing consistency (one source of truth)

All public numbers come from `research/payment-links.json`. Do not invent amounts on HTML pages.

| ID | SKU | CAD | Unit | What it is | What it is **not** | Status |
|----|-----|-----|------|------------|---------------------|--------|
| L0 | Look | 0 | — | Public residual prose | Depth packs | **open** |
| L1 | Measure / Audit | 0 | — | Peg language, crypto receipt audit | Full leaf JSON | **open** |
| L2 | Leaf | 49 | 12 mo | **One** gated room (one disease leaf *or* one eng sheet pack) | Whole vault | priced_closed |
| L3 | Branch | 149 | 12 mo | **One** field (e.g. neuro *or* oncology *or* thermo residual) | Cross-field library | priced_closed |
| L4 | Library | 499 | 12 mo | Multi-room toolkit **inside one domain class** (medical *or* engineering class — not both vaults) | “Everything Dualis knows” | priced_closed |
| F1–F3 | Fuel 40/120/320 | 20/50/120 | prepaid | Depth runs (time), not document seat | Permanent IP license | priced_closed |
| CROWN | Wet-ink | null | — | CRA / government / multi-site | Agent-sold | **never_agent** |

**Consistency law:** If a page shows a price, it must match this table. If status is closed, UI says closed — not “buy now” without a Stripe URL.

**Scarcity law:** Library at CAD 499 is **not** a dump of all IP. It is a **domain-class toolkit** for 12 months. Crown and cross-domain vault stay off catalog.

---

## 2. How IP is gated (layers)

```
L0 Look     → public HTML (anyone)
L1 Measure  → audit / Iris measure (anyone; receipt on device)
L2 Leaf     → one gated pack (paid when open + grant)
L3 Branch   → one field set (paid when open + grant)
L4 Library  → multi-room in one domain class (paid when open + grant)
DEPTH       → medical-depth / eng-depth pages (identity gate OR paid seat)
CROWN       → owner only
```

Technical controls already in play or required:

| Control | Mechanism | Status |
|---------|-----------|--------|
| Public floor | Static HTML under `/research/` | live |
| Medical depth door | `js/medical-gate.js` + `data-medical-depth="1"` | live (identity) |
| Engineering depth door | same pattern · `js/engineering-gate.js` | **this commit** |
| Paid seat | Stripe Payment Link → grant cookie/session | WAIT_RAIL |
| Crypto audit | SHA-256 chain on device (`audit.html`) | live (receipt, not IP unlock) |
| Crown | never on FE catalog | locked |

A **crypto audit receipt does not unlock IP depth**. Receipts prove a measure write; they are not a license key to leaf JSON or simulation packs.

---

## 3. Example A — Medical

| Floor | What visitor gets | Gate |
|-------|-------------------|------|
| **Look** | Tribute / path language; links to Nature, ACS, NCI; osteosarcoma public leaves that are prose-only | Open |
| **Measure** | “Name residual in protocol friction” via Iris/audit — no treatment claim | Open |
| **Depth** (`data-medical-depth="1"`) | Prototype density, pack JSON, simulation sheets | `.org` / `.gov` / `.gc.ca` **or** Dualis SEAL-1 mark **or** (when open) Leaf/Branch/Library grant for medical class |
| **Not sold** | Cure, diagnosis, clinic credential, securities | Hard speech |

Identity gate (from `MEDICAL-GATE.md`):

1. Institutional mail on **`.org`**
2. Institutional mail on **`.gov`** (`.gc.ca` counts)
3. Ranking affiliate **SEAL-1** / **SEAL-T1** / **DC-SEAL-1**

Bare `.com` / personal mail → public floor only until a paid seat exists and is open.

---

## 4. Example B — Engineering

| Floor | What visitor gets | Gate |
|-------|-------------------|------|
| **Look** | Engineering index, thermodynamic residual **public** residual language, NASA credit where allowed under `/research/engineering/` | Open |
| **Measure** | Plant/energy residual measure (CAD, kWh, scrap) via audit/Iris | Open |
| **Depth** (`data-eng-depth="1"`) | Full residual workbooks, invert sheets, multi-site models | Institutional `.edu` / `.gov` / `.gc.ca` / verified plant domain **or** SEAL-1 **or** (when open) Leaf/Branch/Library grant for **engineering class** |
| **Not sold** | Safety certification, stamped engineering seal of record, securities | Hard speech |

Engineering identity gate parallels medical: institutional class or Dualis ranking mark. Personal consumer mail does not open eng-depth.

---

## 5. Domain class (why Library is not “everything”)

| Class | Leaf example | Branch example | Library scope |
|-------|--------------|----------------|---------------|
| Medical | One disease leaf pack | Neuro **or** Oncology | All medical leaves + life systems in scope — **not** eng vault |
| Engineering | One residual sheet pack | Thermo **or** industrial energy | Eng residual toolkit — **not** medical vault |
| Schools / ops | One board residual room | Facilities **or** overtime field | Ops toolkit — separate class |

Buying Library-medical does **not** auto-open eng-depth. Cross-class = Crown / wet-ink.

---

## 6. Open vs closed (operator checklist)

Before `open: true`:

1. Stripe Payment Links exist per SKU (public URLs only on site)
2. IP gate scripts on every `data-*-depth="1"` page
3. Library copy never says “all Dualis IP”
4. Medical hard speech remains on medical depth
5. Engineering hard speech remains on eng depth

---

## 7. Not this document

- Not medical advice or treatment  
- Not a professional engineering stamp  
- Not securities  
- Not an open checkout order  

Ontario / Canada first. No tribes preferred.
