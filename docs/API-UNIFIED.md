# DualisCapax Unified API Interface

**Current as of:** 2026-08-30  
**Control ID:** ED-API-UNIFIED-20260830-V1  
**Repo SHA at bind start:** bb7bcf48c6ad98b3c68b9b852642012172452a3a  
**SoR (Drive folder):** planned rollout front end `1t_Vx6C-rOLpBAqt3E54FeqbMihRt2NIk`  
**Live surface:** https://dualiscapax.ai/  
**Status:** INTERFACE LIVE · ACCESS CLOSED · NO sk_ · NO open sales

Drive frontend rollout ideas are bound to the existing backend planes below. This document itemizes the bind. It does not reopen seats.

## Locked public state (do not regress)

| ID | name | value | unit | status | notes |
|----|------|-------|------|--------|-------|
| ACCESS | Document packs | closed | flag | locked | open:false until pricing + IP |
| LEDGER-EARNED | Total earned | 0 | CAD | closed | honest while closed |
| LEDGER-PLEDGED | Total pledged | 0 | CAD | closed | honest while closed |
| T-LAUNCH | Public surface start | 2026-08-24 00:00 UTC | datetime | locked | |
| T-SING-BASE | Singularity if pledged = 0 | 2036-08-24 00:00 UTC | datetime | model M | |
| R-CAD-DAY | Pledge advance rate | 1000 | CAD / day | model M | not an exchange |
| CIRCUIT-MS | Invariant M-S | 4.20 | ms | model M | fail-closed on trip |
| R-EFF | Residual drag floor | 4.18e-13 | dimensionless | model M | jacket claim, not a live TEE quote |
| CORP-FLOAT | Corporate token float | 0.00 | % | locked | |
| MODE | Jacket mode | SANDBOX | enum | live | real TEE / Stripe = WAIT_GRANT |

## Planes that already existed (backend)

| Plane | Path | Role |
|-------|------|------|
| Depth chat | `server/worker.js` `POST /v2/chat` | Fuel-gated completion |
| Chat helper A | `js/api-config.js` `dcChatV2` | `/v2/chat` |
| Chat helper B | `js/api-v2.js` `dcApiV2Chat` | `/api/v2/chat` leftover |
| Law runtime | `ops/apiv2/runtime.py` | Dualis verbs, not HTTP public |
| DCLM kernel | `engine/dclm/` | Layer [0] + meter + Iris voice |
| Drive jacket spec | `ED-API-20260830-DCLM-V2` | attest / wrap / sandbox / telemetry / purge |

Leftover: two JS clients, two chat paths, Drive jacket not wired to worker.

## Frontend rollout ideas → bound verbs

| FE idea | Drive ID | Bound route | Backend |
|---------|----------|-------------|---------| 
| Capacity + fiat ingress | ED-GATE-FE-01-FIAT | `gate.evaluate` + PAY-1 closed | runtime + payments.html closed |
| Multichain crypto | ED-GATE-FE-02-CRYPTO | PAY-1 Path B closed | equal-CAD only when open |
| Settlement slip + QR | ED-GATE-FE-03-QR-SLIP | not public until ACCESS open | spec only |
| Telemetry HUD + breaker | ED-GATE-FE-04-TELEMETRY | `GET /v2/dclm/telemetry/circuit-breaker` | worker envelope |
| Parallel combos | ED-GATE-FE-05-COMBOS | tables below | no invented prices |
| Zero exposure | ED-GATE-FE-06-SECURITY | no sk_ on site or in chat | locked |
| Onboarding V5-2P5L | ED-FE-20260830-ONB-DCLM-V5-2P5L | `/onboard.html` public door only | enterprise FE stays Drive SoR |

## Unified HTTP surface (worker)

| Method | Path | Maps from | Live now |
|--------|------|-----------|----------|
| GET | `/health` | existing | yes |
| GET | `/v2/capabilities` | existing + dclm flags | yes |
| POST | `/v2/chat` | api-config + jacket wrap | yes |
| POST | `/api/v2/chat` | api-v2.js leftover | alias of `/v2/chat` |
| POST | `/api/chat` | legacy | alias of `/v2/chat` |
| POST | `/v2/dclm/attest/bind` | jacket §4.1 | sandbox token |
| POST | `/v2/dclm/inference/wrap` | jacket wrap | same fuel gate as chat |
| POST | `/v2/dclm/sandbox/execute` | jacket sandbox | local measure envelope |
| GET | `/v2/dclm/telemetry/circuit-breaker` | FE-04 | yes |
| POST | `/v2/dclm/session/purge` | CLEANUP_FIRST | yes |

## Parallel monetization (always both rails; still closed)

| Combo ID | Path A | Path B | Rule |
|----------|--------|--------|------|
| PAY-1 | Fiat CAD (Stripe Payment Link) | Equal crypto (CAD-matched) | No exchange product |
| SEAT-1 | Corporate residual seat | Grassroots residual seat | Same peg |
| ORDER-1 | Early residual (founding window) | Later residual | Same product quality |
| ACCESS-1 | Closed packs | Sealed attestation | open:false |
| EVAL-1 | Tier 0 sandbox | Public verification | sandbox is the live interface |

## Client

Canonical browser helper: `js/api-unified.js` (`dcApi`).

Old helpers remain as thin wrappers so existing pages do not break.

## What is not live

- Real SGX/SEV quote verification (Drive jacket simulates; worker labels SANDBOX)
- Stripe Payment Links wired to open sales
- Drive file-body write from this Grok grant (WAIT_GRANT)
- Lander drop edits
- Public L2 / playground product language on the drop
