# GitHub cleanup map — dualiscapax-landing

Stamp: 2026-09-29T17:55-04:00
Rule: archive / label first. Do not mass-delete sealed history this turn.
Housekeeping commits use `[skip ci]`.
GitHub is command desk. Apex publish is named zip + wrangler at the key holder.

## What is current (KEEP at root of agent attention)

| Path | Role |
|---|---|
| `AGENT/WHO-IRIS.md` | Iris identity |
| `AGENT/CURRENT-TRUTH.md` | Company / coins / Unity / till / retired trusts |
| `AGENT/README.md` | Read order |
| `AGENT/IRIS-SIMPLE.md` | Street Iris is / is not |
| `AGENT/IRIS-RING.md` | Talk loop |
| `bulletin/` | Drive mirror. Can be overwritten by board pull |

## What looks like the product but is not (PARK)

| Prefix / path | Why it stays on disk | How a bot should treat it |
|---|---|---|
| `06_ENCYC_*` | Appendix specs dumped at repo root | L4 only. Not the lander. Not current ops. |
| `01_CORE__*` | Kernel / swarm scripts | Lab code. Not live runtime proof. |
| `02_ENG_SPEC__*` | Sector engineering notes | Appendix. |
| `03_LEGAL__*` | Legal front-end experiments | Not counsel sign-off. |
| `04_DISCOVERY__llms.txt` | Old bot briefing | STALE. Points at encyclopedia era. |
| `05_WEB__*` | Old web copies | Not the live Unity / Base 3D zip. |
| `AGENT/IRIS-*.md` dated 2026-09-23 | Street tickets (wav, stream, sky) | Keep as tickets. Do not invent a second Iris. |
| `.github/workflows/*` (~40) | Hockey, golf, ice, pinata, mill, pages | Many are noise. Do not add more until a single-writer list exists. |

## DELETE-CANDIDATE (needs owner yes; not this commit)

- Duplicate greet workflows: `iris-greet-mint.yml` and `iris-mint-greet.yml` — keep one later
- `deploy.yml` GitHub Pages path if CF Git auto-deploy is already off
- Root `00_RESTORE_TO_REPO_STRUCTURE.py` if unused
- Any leftover `ice.html` / `cf-pages/ice.html` twins

## First pass done in this commit

- Added this map + `AGENT/README.md`
- Pointed root README at current cards
- Stamped `04_DISCOVERY__llms.txt` STALE
- Did not move or delete encyclopedia files
- Did not touch live apex
