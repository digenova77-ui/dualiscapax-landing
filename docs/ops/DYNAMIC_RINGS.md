# Dynamic Rings — PROPOSED

Principle stated by David Di Genova, 2026-10-17. Status: **PROPOSED** (not yet adopted into code or gates).

## Rule
1. There are exactly three rings: **Philosophy, Physics, Law**. They are the only judges.
2. Each ring gives **one verdict** per claim. There is **no majority vote**: no ring's verdict is outvoted by the other two, and nothing becomes common truth by counting approvals.
3. The rings are **not a static trio**. They are moving parts in flow: the overlap and weighting between them changes with each claim's work.
   - Measurement-heavy claims lean on **Physics**.
   - Consent-, authority- or permission-heavy claims lean on **Law**.
   - Meaning-, purpose- or definition-heavy claims lean on **Philosophy**.
   The shape changes; the three remain. Weighting changes how much evidence each ring must examine, never whether a ring gets a verdict.
4. **Sub-parts** (at most 3 per ring) are **checklist items, not judges**. They feed their ring's single verdict and never vote on their own.

## Placement
No canonical ring document existed on `main` (searched docs/ops, research/, seed docs). This file is placed in `docs/ops/` alongside the Diamond Floor plan until an owner picks a canonical home.

## Known conflicts (not changed here)
- **PR #110** uses older ring names (authority / measurement / execution). Those map loosely to Law / Physics / execution and should be renamed by that PR's owner if this is adopted.
- **`builder.html:160`** "TRINITY GATE … require 2-of-3 distinct authenticated approvals" is a majority vote and conflicts with rule 2. BLOCKED on owner decision.
- Related: PR #112 rebuild-to-verify (PROPOSED) uses the same three rings, one verdict each.
