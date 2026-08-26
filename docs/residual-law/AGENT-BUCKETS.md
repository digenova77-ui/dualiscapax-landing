# Agent Buckets A · B · C

**Status:** Locked 26 Aug 2026 · 12h sprint  
**Rule:** Each agent owns only paths inside their bucket. No writes outside the bucket without Grok reassignment.

Cross-reference: Project Scope · DCLM · Fuel unified · Bond · Domain constraints · Study message (no nameplate) · Mission Statement · SPRINT-12H · ENCYCLOPEDIA-CATALOG

---

## Agent A — Medical Encyclopedia Depth

| Field | Value |
|-------|--------|
| **ID** | `AGENT-A` |
| **Name** | Harper |
| **Mission** | Make medical residual journals **feel deep and real** |
| **Owns** | Neurological + Oncology leaves and stack indexes |

### Identifiers (catalog)
- `ED-RES-NEURO-*` (all neurological IDs)
- `ED-RES-ONC-*` (all oncology IDs)

### Paths owned (write only here)
```
research/healthcare/medical/neurological/**
research/healthcare/medical/oncology/**
research/healthcare/library/oncology/**
research/healthcare/medical/index.html
research/healthcare/medical/PROTOTYPE.md
```

### Tasks (ordered)
1. Densify `neurological/index.html` with full 20-ID catalog table + links to live leaves
2. Ship depth leaves: `ms.html`, expand PD/AD honesty blocks if thin
3. Densify `oncology/index.html` with full 22-ID catalog table
4. Ship depth leaves: `nsclc.html`, `breast.html` (then CRC / melanoma if time)
5. Keep ALS benchmark as density template; never cure claim; Bond voice; study message only

### Done when
- Neuro + Onc stack indexes show full catalog
- ≥3 new depth leaves beyond ALS/PD/AD/OST/GBM
- Every leaf: P1/P2, residual unit, what this does for you, not advice

---

## Agent B — Bond · Nav · Money Spine

| Field | Value |
|-------|--------|
| **ID** | `AGENT-B` |
| **Name** | Benjamin |
| **Mission** | Maximum **Bond** + menus that **work** the same everywhere |
| **Owns** | Onboarder-facing spine + unified nav |

### Identifiers
- Nav spine labels: DualisCapax · Financial · Tech · Research · Jump-start · Onboarding · Founding
- Bond test: *What does this do for them?*

### Paths owned (write only here)
```
onboard.html
payments.html
corporate.html
founding.html
financial-principles.html
financial-structure.html
financial-engagement.html
assets/cta.css
research/index.html
research/medical.html
research/industrial.html
research/math-science.html
research/access.html
ai/index.html
ai/adaptive.html
ai/access.html
```

### Tasks (ordered)
1. Apply **identical** `.top` + `.top-links` nav to every owned HTML page
2. Rewrite onboard + payments in Bond voice (their capacity, their residual, their free will)
3. Strip institution nameplates; study message only
4. Align research hub openers to Bond + residual-law (Open free · Depth Fuel)
5. Do **not** touch `index.html` lander surface after intro (WORKING_VERSION freeze)

### Done when
- Every owned page has the same menu titles and targets
- Onboard/payments read as bond with the onboarder, not product brochure
- No HP EDSB / elite hospital name-checks

---

## Agent C — Encyclopedia Stacks + Catalog + Law Cross-Refs

| Field | Value |
|-------|--------|
| **ID** | `AGENT-C` |
| **Name** | Lucas |
| **Mission** | Full specialty stacks + catalog integrity + cross-references |
| **Owns** | Non-neuro/onc library stacks + residual-law docs |

### Identifiers (catalog)
- `ED-RES-CARD-*` · `ED-RES-ID-*` · `ED-RES-IMM-*` · `ED-RES-MET-*`
- `ED-RES-HEM-*` · `ED-RES-PULM-*` · `ED-RES-PSY-*` · `ED-RES-RARE-*`

### Paths owned (write only here)
```
research/healthcare/library/index.html
research/healthcare/library/ENCYCLOPEDIA-CATALOG.md
research/healthcare/library/cardiology/**
research/healthcare/library/infectious/**
research/healthcare/library/immunology/**
research/healthcare/library/metabolic/**
research/healthcare/library/hematology/**
research/healthcare/library/pulmonary/**
research/healthcare/library/psychiatry/**
research/healthcare/library/rare/**
research/healthcare/index.html
docs/residual-law/**
```

### Tasks (ordered)
1. Expand Journal Library hub to all 10 stacks (link every stack index)
2. Full catalog tables on cardiology, infectious, immunology, metabolic indexes
3. Create hematology, pulmonary, psychiatry, rare stack indexes with full ID tables
4. Update ENCYCLOPEDIA-CATALOG.md statuses as A ships depth leaves
5. Cross-ref docs: README, SPRINT-12H status log, AGENT-SKILLS (point at buckets)
6. One priority depth leaf if time: e.g. `library` path or medical leaf under MET/CARD only if not colliding with A

### Done when
- Library hub lists all 10 stacks
- Every non-neuro/onc stack has a real index with full catalog table
- Catalog + residual-law docs cross-reference Agent A/B/C buckets

---

## Grok (Team Lead) — Outside buckets

| Field | Value |
|-------|--------|
| **ID** | `GROK-LEAD` |
| **Owns** | Coherence, final report, intro-sequence only if timing fix, conflict resolution |
| **Paths** | `assets/intro-sequence.js` (intro only) · `index.html` **only** if user orders lander change · bucket reassignment |

Does not densify medical leaves or rewrite onboard while A/B/C are active.

---

## Contention rule

If two agents need the same file: **Grok assigns one owner.**  
No parallel `create_or_update_file` on the same path.

---

## Cross-reference map

| Concern | Bucket |
|---------|--------|
| MS / NSCLC / ALS density | **A** |
| Nav sameness / Bond copy | **B** |
| Catalog IDs / stack indexes / law docs | **C** |
| Intro timing / lander freeze | **Grok** |
| Fuel / DCLM / seats closed | All (read-only; C updates docs) |

**Last update:** 26 Aug 2026 — Agent A/B/C buckets locked with identifiers and tasks.
