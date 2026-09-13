# DualisCapax unit forest

**Law:** Structure first. Spawn harvest only after the unit folder + queue exist.

**Pattern:** `trunk → branch → seat → pack`

**Independence:** each unit owns its queue, packs, and (when live) its workflow. No timesliced shared brain.

**Public trunks:** government-*class* residual seats — health, education, transport, metro, justice, treasury, safety, land, labor. Dualis scaffolds depth and cites. It does **not** claim state power, taxation authority, or a human throne.

## Live
- `sports/golf-usa` → `research/golf/usa/` + `golf_usa_envelopes.yml`

## Spawn checklist
1. Copy `units/_template/`
2. Fill `UNIT.md` + `QUEUE.json`
3. Add harvest script only when cites are defined
4. Add workflow only when script writes real packs
5. Register in `FOREST.json` `live[]`
