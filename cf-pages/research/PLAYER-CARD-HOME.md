# Player card = home (closed product)

**DualisCapax** · ED-COM-20260912-PLAYER-CARD-V1  
**Status:** food-for-thought / law lock for closed ice — not demo-blocking.

## Problem
Claim / onboard loops recreate “who are you” every time someone opens ice. After identity is bound, that loop must stop.

## Law
Once `unity_id` → `roster_seat_id` is **SETTLED** (Spordle/HCR and/or TeamSnap OAuth + passkey handshake):

1. **Default stage = Me / Card** (not Seat claim).  
2. Seat chrome stays (team · #jersey · privacy name) — constant rink marking.  
3. Main stage shows a **player card**, not another onboard wizard.

## Card face (hockey-card grain)
Echo only measured / partner sources — never invent:

| Face | Source |
|---|---|
| Photo / silhouette | TeamSnap / IG reveal / guardian upload (consent) |
| Name alias + # + pos | Roster pack + preferred_alias |
| Team / age / season | Claimed pack |
| GP · G · A · P | GameSheet pull (never paste) |
| ± · PIM | GameSheet when present |
| TOI | GameSheet or measured tape clocks when present |
| Shift / PCr clocks | Dualis Me (prior until tape) |

Back of card (progressive): last 5 games, season sparkline, school echo (NCAA floor labels only), Apps bound chips.

## Anti-patterns
- Do not reopen full claim dropdown for a settled seat (offer Switch seat behind a deliberate control).  
- Do not show another player’s card from browse.  
- No public free dump of named-minor cards.

## Demo vs closed
- **Demo / testing:** claim path stays open for Dom-style seat tests.  
- **Closed:** settled → card home; TeamSnap schedule + GameSheet stats feed the face.

Related: `ONTARIO-AAA-IDENTITY.md` · `UNIFIED-LOGIN-PASSKEY.md` · `ICE-PORTAL.md`
