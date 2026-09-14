# NHL → DCLM identity prove (offline see→log) — 2026-09-14

**Lane:** Dualis **own** offline/historical DCLM eyes. Post-game see→log.  
**Not:** Sportlogiq clone, LiveBarn real-time CV, public website deploy, Dom #29 yet.  
**Peer logic:** others sell real-time AI on video — Dualis offline should be *easier*; prove classes first.  
**LB:** echo-only if later proven; no rebuild/resell.

## Source (cite only)

| Field | Value |
|---|---|
| URL | https://www.youtube.com/watch?v=qQ4rCm-VxqM |
| Title | NHL Playoff Highlights \| Capitals vs. Hurricanes \| Gm 4 \| May 12, 2025 |
| Channel | NHL |
| Windows read | 0:00–1:30 · 2:00–5:00 · 7:00–9:00 (+ dense 5 fps around ~2:25–2:37) |

Artifacts: `SEE-LOG-NHL-PROVE-2026-09-14.json` · frames under `frames*` (local scratch; **do not ship video to public Pages**).

Ontology: `/tmp/dualis-landing/research/ops/dclm-see-log/DCLM-HOCKEY-ID-ONTOLOGY-V0.md`

## Per-class verdict (no fake PASS)

| Class | Result | Notes |
|---|---|---|
| **scorebug** | **PASS** | Teams, score, clock, period, SOG, series status repeatedly readable. |
| **goalie / pos.G** | **PASS** | Pads + crease + stance clear on multiple frames; jersey/nameplate sometimes (THOMPSON #48). |
| **jersey_read** | **PARTIAL** | Works when close/back-facing; fails on wide/blur/occlude. |
| **pos F vs D** | **PARTIAL** | Formation hints + broadcast FORWARDS/DEFENSE tickers; not reliable from body alone. |
| **pos LW/C/RW** | **FAIL** | Empty this spike — needs sequence + attack direction + seat DB cross-ref. |
| **goal (puck-in-net)** | **PARTIAL** | `gd_017`: puck in mesh + board GOAL! while scorebug still 0–0 — med confidence visual. |
| **goal (broadcast indicator)** | **PASS** | GOAL banner + celebration; then scorebug CAR 1 (`g_0034`). |
| **hit** | **FAIL** | No discrete hit attested (battles ≠ hits). |
| **blocked_shot** | **FAIL** | No multi-frame puck-path block attested. |

## What DCLM can form today vs needs more

**Can form now (offline):** game-state from scorebug; goalie identity; team color split; some jersey numbers; goal-as-broadcast-event; provisional puck-in-net when camera is tight on crease.

**Needs more definition / denser tape:** LW/C/RW; true hit physics; blocked-shot chain; continuous puck track; linking jersey→roster seat without inventing.

**Not claimed:** “video→DCLM works” as a product. Claim is **partial class coverage** on one NHL highlight cite.

## Conflict map (LiveBarn)

| Pipe | Status |
|---|---|
| `tape_pipe=livebarn` paired session | Untouched |
| This spike `source.kind=nhl_historical_broadcast_cite` | Separate offline research path |
| Sportlogiq / LB PA 500-metric | Out of scope |

## Next concrete step

1. One more NHL full-period (or longer non-highlight) cite to hunt **hit** + **block** with multi-frame stamps.  
2. Or Dom-gated **manual** see→log stub on Ice (feature flag) once user wants UI — still no auto CV.  
3. Dom #29 only after pipe + ontology stable.

## CF / website

**No CF upload.** Research only. Public status quo.
