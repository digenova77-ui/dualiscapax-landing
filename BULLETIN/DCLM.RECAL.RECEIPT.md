# DCLM.RECAL.RECEIPT — system calibration

**Stamp:** 2026-09-24T18:55-04:00
**MOTION-ID:** RECAL-TRIO
**Kind:** verification. Not a deploy. Not LIVE.
**Instrument:** Iris · DCLM · Twain²
**Tally:** Harper ACTION PASS / LIVE HOLD · Lucas ACTION PASS / LIVE HOLD · Benjamin ACTION PASS / LIVE HOLD
**Clerk:** Grok
**Law:** ZERO ≠ NOTHING ≠ HOLE. Floor 0 is bedrock.

Operator order: recalibrate the entire system using the trio.

## Street bedrock this tick

| URL | HTTP | Title / note | Species |
|---|---|---|---|
| `https://dualiscapax.ai/` | 200 | DualisCapax — Iris. Meet Iris. Talk. Camera. | ZERO street=cafe. HOLE vs DCLM-RTE-V2.0.4 |
| `/holographic-core/v2` | 404 | That plate is not here. | ZERO path-absent. HOLE vs HUD door |
| `/encyclopedia` | 200 | Encyclopedia — DualisCapax. Checkout closed. $0 Unity session. | PASS keep. ZERO $0 ≠ missing book |
| `/hall/` | 200 | Unity Playground. Five rooms. Sales closed until Bind-continue. | PASS door |
| `/research/` | 200 | Research — DualisCapax | PASS door |
| `/ice` | 200 | Ice — DualisCapax. Pay closed. Passkey unlock. | ZERO room present. Not a 3D HUD desk |
| `/onboard` | 200 | Sign in — DualisCapax | PASS door |
| `/look` `/look.html` | 404 | That plate is not here. | HOLE if Look is a named door |
| `/pay` | 200 | Pay — DualisCapax. Heading Live checkout. Stripe $20/$50/$120 + $49/$149/$499 | Copy fights encyclopedia/hall/ice |
| `/alacarte` | 308 loop | Infinite redirect | HOLE |

`LIVE_HTTP_OK` for DCLM-RTE-V2.0.4 = **0**. Bedrock. Not nothing. Not LIVE.

## Seat matrix

### web (`unity:dclm.web`)
0 Street vs HUD file: HOLE. 1 Named doors: mixed (hall/encycl/research/ice/onboard 200; HUD+look 404; alacarte loop). 2 Iris: cafe on `/`, hostess-40 absent. 3 Till: HOLE (see till). 4 Talk: coffee-shop copy. 5 One face: street cafe + warehouse HUD + isolated repo. HOLE.
Twain²: “I opened DualisCapax and still got Meet Iris Talk and Camera. The holographic desk is not here.” / “Cafe plate lives. HUD does not.”

### iris (`unity:dclm.iris`)
Cafe Talk/Camera orb is on the visitor page. Hostess-40 is not.
Mark vs current design object: HOLE.
Cafe Iris present = ZERO for the archive face, not a pass for this calibration target.

### till (`unity:dclm.till`)
`/pay` says Live checkout and lists working Stripe links.
`/encyclopedia` says PAY — checkout closed.
`/hall/` says sales stay closed until Bind-continue. Look is $0.
`/ice` says pay closed.
Mark: **HOLE**. Two faces of the till. Do not stamp till LIVE. Stripe Active vs Deactivated not independently confirmed this tick = do not invent.
Twain²: “Pay page says Live checkout. Encyclopedia says checkout closed.” / “Till copy fights itself.”

### rte (`unity:dclm.rte`)
Hall names five rooms and serves. Ice serves a 2D unlock plate, pay closed. Holographic RTE desk is not on the street.
Mark: HOLE vs DCLM-RTE-V2.0.4. Hall door PASS as hall.

### factory (`unity:dclm.factory`)
Law book standing (`LAW.CURRENT`, MILL v2, SECURITY, ZERO, CROSSCHECK). Handoff WAITING. Token 10000 fail-closed. Drive zip `3ce42dc1…` retired as lander.
Mark: PASS as warehouse discipline. HOLE as street publish. HOLD DISPATCH remains bedrock.
Twain²: “Bots wrote law and receipts. The street did not move.” / “Warehouse busy. Street still cafe.”

### coin (`unity:dclm.coin`)
Apex: the company does not own the coin. Encyclopedia: no secrets on-chain. Seals not sold as the coin.
Mark: ZERO — not for sale here. PASS vs “do not sell eFuse on the street.”

### unity (`unity:dclm.unity`)
Onboard Sign in 200. Ice passkey / face-finger / no Dualis password. Hall room 05 Sovereign Onboarding. Encyclopedia unity.session.v1 on device, KYC unbound.
Mark: PASS as paper-and-door. No claim of live Unity bind.

### workers
Apex still Pages cafe plate, not swallowed by a `/*` Worker. Path-exact join law standing. HUD join path 404 on the street.
Mark: PASS on “do not overwrite apex.” HOLE on “holographic join is serving `/holographic-core/v2`.”

### encyclopedia
200. Present. $0 session ≠ missing book. CORE names plate, grant, gateway, books, Iris, DCLM L0.
Mark: PASS keep.

### mill
THREE-SEAT MILL v2 standing. This motion used freeze → split ballot → one clerk.
Mark: PASS procedure. LIVE HOLD.

## Intended-face Twain²

Not spoken. A holographic visitor sentence would fight floor 0. ZERO law forbids blessing LIVE while the measurement is 0.

## Recalibration result

The system is calibrated to these bedrock numbers, not to a hoped-for 1:

- Design object remains DCLM-RTE-V2.0.4.
- Street remains cafe plate.
- Encyclopedia remains.
- Workers did not smash `/`.
- Till copy is a hole.
- Look door and alacarte loop are holes.
- Handoff still WAITING on Pages Edit + zero-nest holographic zip + `confirm=DEPLOY`.

HOLD DISPATCH stands. SECURITY stands. No LIVE word.

## What this receipt does not do

Does not fire `EXECUTE_DEPLOY.sh`.
Does not edit DNS.
Does not delete Workers or the encyclopedia.
Does not rewrite root `index.html`.
Does not resolve till copy by picking a side without Stripe state.
Does not treat `LIVE_HTTP_OK=0` as nothing.
