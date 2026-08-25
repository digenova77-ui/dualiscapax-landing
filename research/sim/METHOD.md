# Dual-path simulation scaffold (public residual)

## Rule
Not every disease, competitor, or record is loaded yet. This is the **machine** that scales them.
Each entry is bottom-up capable: constraints first, then graft against literature.

## Two paths (linear in time)

| Path | Name | What it is |
|------|------|------------|
| **P1** | Literature-forward | Timeline of public programs: approval, phase fails, subset labels, real-world summaries. Competitor = marketed or late-stage public program. |
| **P2** | Constraint-bottom | Declared physical/chemical/clinical constraints under model M only. No Seal. No “we measured quantum supremacy.” Graft points where P1 assumptions sit on irreversible patient time. |

Both paths share:
- dual-column (A = public surface; B = under M)
- citation stubs for every claim that needs a record
- content hash when stored in residual vault

## Levels of debate (per disease)
1. Disease definition / phenotype split
2. Biomarker / target class
3. Molecule / modality
4. Trial design & endpoints (e.g. ALSFRS-R, survival, NfL)
5. Regulatory status (FDA / Health Canada / EMA as public)
6. Access / cost residual (when known publicly)
7. Graft risk (time already elapsed; cohort selection)

## Competitor set (per disease)
Major public programs only — not gossip. Expand row-by-row.

## Storage test
See `storage/RESIDUAL-VAULT.md`. Concise packs, content-addressed, governed by residual credit rules — not an open exchange coin.

---

## Engine v2 (full re-run)

As of **2026-08-24**, packs may carry a **v2** full re-run:

| Field | Meaning |
|-------|---------|
| `engine.version` | `v2` |
| `engine.mode` | `full_rerun` |
| `v2_results.comparison[]` | Dual column with public residual + **model M** residual-compress scores |
| Scores | Relative residual-compression indices **inside the pack only** — not clinical superiority |

Live packs: `als.dual.v2`, `osteo.dual.v2`. Parent v0 retained for audit.
