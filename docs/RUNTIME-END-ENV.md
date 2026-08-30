# Residual End-Runtime Environment

**Current as of:** 2026-08-30  
**Handoff date:** 2026-08-24 (EDT)  
**Entity:** DualisCapax Inc.  
**Kernel:** DCLM-AI v0.1.1 (Iris / Axiom Intellectus)  
**Status:** Architecture · not open sale · not a claim that every app is replaced today

---

## 1. What this is

A **per-person residual runtime**: one measure loop that sits behind whatever the person is doing — cost reduction, daily plan, a golf hole, a plant line — and names the residual they already pay for in waste, friction, or missed invert.

It is **not** a foundation model that “replaces every app” today.  
It is a **measure engine** that can, over time, **power-cost** replace thin app surfaces by answering the same question those apps never ask: *what residual is left, and can you walk it back?*

```
context (who, where, need)
  → Layer [0] veto
  → two-pole meter (waste vs residual)
  → MEASURE / SEED / VETO
  → SHA-256 receipt (parent chain)
  → next move on the sheet
```

Law floor (non-negotiable):

| ID | Invariant | Rule |
|----|-----------|------|
| L0 | NO_FORCE | No coercion, no invented poles |
| L1 | HOST_SAFE | On-device first; no sk_ on client |
| L2 | CLEANUP_FIRST | Purge session memory after receipt |
| L3 | TRUTH_OR_NOTHING | Missing poles → SEED, not fiction |

---

## 2. Per-person runtime (end environment)

Every onboarded person gets a **runtime envelope**, not a generic dashboard.

| Field | Meaning | Status |
|-------|---------|--------|
| `person_id` | Local stable id (HMAC-salted; no raw PII on public wire) | design |
| `need_class` | cost · schedule · location · plant · lab · other | design |
| `locale` | Optional lat/lon or place token (user-granted) | design |
| `connectors[]` | Named realms the person allowed (calendar, maps, meter, …) | WAIT_GRANT |
| `parent_c` | Last receipt hash — mid-run stays mid-run | kernel live |
| `voice` | citizen · cfo · lab | kernel live |
| `fuel` | Prepaid depth units | priced_closed |

**Example needs (same loop, different poles):**

| Need | Pole A (waste) | Pole B (residual) | Unit | Example invert door |
|------|----------------|-------------------|------|---------------------|
| Cost reduction | Overtime / leak $ | Recoverable $ / day | CAD | Cut the named leak or keep paying it |
| Daily schedule | Friction hours | Protected focus hours | h | Drop one low-invert block |
| Golf course (location) | Strokes / yardage waste | GIR / putts left | stroke | One hole measure, not a pro lesson claim |
| Plant line | Scrap / downtime | Units recovered | unit | Time-boxed pilot with walk-back |

Location is a **context pole**, not a surveillance product. No background track without explicit grant.

---

## 3. On-device DCLM

| Layer | Where it runs | What it does |
|-------|---------------|--------------|
| Layer [0] | On device | Veto scan before any outbound |
| Meter | On device (default) | Two poles + residual unit + invert |
| Receipt | On device | SHA-256 bind; optional parent chain |
| Connector fetch | Only after WAIT_GRANT | Calendar, maps, meters — user named |
| Settlement | Never on device as sk_ | Fiat→crypto rail when open |

Design rule: **the model travels to the person; the person’s life does not have to travel to a data center.**  
Cloud assist is optional and labeled. On-device is the default path for measure.

---

## 4. Real-time behind the scenes

“Real time” here means **receipt-time**, not infinite chat.

| Step | Bound |
|------|-------|
| Sense | Need class + optional location token + optional connector snapshot |
| Measure | DCLM run with case_id = person session |
| Show | One residual sentence + invert door |
| Store | Receipt on device; parent for next write |
| Forget | CLEANUP_FIRST on session end |

Golf example (honest bound):

- Input: hole, lie, yardage the **person** supplies (or a granted course API).
- Output: residual measure (e.g. strokes left vs par as poles) + walk-back — **not** medical advice, **not** a guaranteed score.
- No claim of live course telemetry until a connector is granted and named.

---

## 5. Connectors (everything they connect later)

| Connector class | Examples | Gate |
|-----------------|----------|------|
| Time | Calendar | WAIT_GRANT |
| Place | Maps / course sheet | WAIT_GRANT |
| Money | Bank CSV / invoice (read-only) | WAIT_GRANT |
| Machine | Meter / PLC export | WAIT_GRANT |
| Chat | Iris surface | public measure only until seat |

Integration rule: **every connector is an invert door**, not a silent harvest.  
If it cannot name residual unit and walk-back, it stays SEED.

---

## 6. Power-cost replace every app (trajectory, not claim)

| Horizon | What is true |
|---------|----------------|
| Now | DCLM measures residual; thin apps still own their silos |
| Near | Same loop covers cost / schedule / location needs without new silo UI |
| Later | Apps that only move data without naming residual become optional shells |
| Never claimed as fact today | “Every app is replaced” — that is a target residual, not a live product sentence |

Public language stays:

> We measure residual. We do not claim cures. We do not claim we already replaced every app.

---

## 7. Serialized parameters

| ID | Parameter | Value | Unit | Status |
|----|-----------|-------|------|--------|
| RT-0 | Kernel | DCLM-AI 0.1.1 | version | live in repo |
| RT-1 | On-device default | yes | flag | design |
| RT-2 | Access sales | closed | flag | locked |
| RT-3 | Settlement rail | fiat → equal-CAD crypto | path | WAIT_RAIL |
| RT-4 | Location | user-granted only | policy | locked |
| RT-5 | PII on public wire | none (HMAC salt) | policy | locked |
| RT-6 | App-replace claim | trajectory only | claim | locked off public |

---

## 8. Implementation order (friction first)

1. Keep `engine/dclm` as the only measure authority.  
2. Add need-class tags to Iris/onboard (cost · schedule · location) without opening seats.  
3. Ship on-device receipt store (local) + parent chain.  
4. One location demo sheet (golf or plant) as **SEED until connectors grant**.  
5. Connector WAIT_GRANT UI — one realm at a time.  
6. Settlement only after Stripe links + treasury addresses exist.

---

## 9. Not this document

- Not medical treatment or ALS claims beyond existing research leaves.  
- Not securities or equity-by-default.  
- Not open checkout.  
- Not silent location tracking.  
- Not “AI replaces every app” as a present-tense product claim.

Ontario / Canada first. No tribes preferred.
