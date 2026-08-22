# Simulation registry — expand bottom-up

Status: **scaffold**. One dual-path seed exists (ALS). Others are empty slots.

## Neurological (priority after ALS seed)
| ID | Disease | P1 | P2 | Pack |
|----|---------|----|----|------|
| als | ALS | seeded | seeded | `packs/als-dual-path.json` |
| pd | Parkinson disease | empty | empty | — |
| ad | Alzheimer disease | empty | empty | — |
| ms | Multiple sclerosis | empty | empty | — |
| hd | Huntington disease | empty | empty | — |

## Oncology (example slots)
| ID | Disease | P1 | P2 | Pack |
|----|---------|----|----|------|
| osteo | Osteosarcoma | empty | empty | — |
| hgsoc | High-grade serous ovarian | empty | empty | — |

## Rule for next pack
1. List major public competitors/programs only
2. Linear P1 events with cite_keys
3. P2 constraints + graft notes under M
4. Hash after normalize
5. No cure claim on Open face
