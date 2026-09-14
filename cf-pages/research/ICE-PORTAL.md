# Ice portal

One rink. Rink markings stay (seat chip, icon rail, Iris). The ice (`#iceStage`) rewrites in place — hash or `?stage=` — no hard page jumps.

**Entry:** `lander` → `alacarte.html` → `sport.html?pack=hockey` → `ice.html?pack=hockey`  
**Files:** `ice.html` · `js/ice-portal.js` · ice rules in `lander.css`

## Stages (teen-simple rail)

| Rail | Stage | What |
|---|---|---|
| Seat | claim | Team → roster seat (First+initial) → prove TeamSnap |
| Game | schedule | Next-game stub; more behind a tap |
| Go | travel | Home + rink (default Quinte CAA Arena Belleville) → real Google Maps directions |
| Tape | video | LiveBarn empty state; Demo tape panel |
| Me | measure | Simplified hockey bout clocks; link to full `sport.html` measure |
| School | NCAA labels | Paste / upload transcript; echo + published NCAA floors only |
| Apps | binds | TeamSnap · GameSheet (never paste) · LiveBarn · Hudl |

Claim is identity. Other stages stay locked until a seat is claimed. Same flow for every player — including Quinte U16 **#29 D. Di Genova** (USER_VALIDATED pack). Founder/dev does **not** auto-inject that seat.

Seat prove is **TeamSnap only**. Spordle/HCR is not a seating option (no partner verify; it confused Player Bind).

## Maps · echo-only ETA

`https://www.google.com/maps/dir/?api=1&origin=&destination=`  
Live traffic / minutes live in Google Maps. Dualis stores home + rink and opens Maps. No invented drive time unless the user pastes a Maps ETA, which we echo.

## Pay

No paywall. Live ice is freely testable.  
`localStorage dc.founder.dev=1` (auto-set on first ice visit if unset) **skips PAY only**. Pay CTAs read **Coming soon — founder testing**. Quiet `Dev unlock` in the demo banner.

## localStorage

| Key | Role |
|---|---|
| `dc.ice.seat` | Claimed seat (team, jersey, last, via) |
| `dc.ice.home` / `dc.ice.rink` / `dc.ice.eta` | Travel |
| `dc.ice.binds.{id}` | `demo` bind |
| `dc.founder.dev` | Skip pay |

## Data

Tries `research/ontario-aaa/omha-u16.2026-2027.index.json` + `rosters/{slug}.u16.2026-2027.json`.  
`file://` / CORS miss → inline `FALLBACK_PACK` (Quinte U16, including #29 Di Genova). Kingston is in the team list with a light `soft_for_user_check` note.

## Demo

1. Open `ice.html?pack=hockey` (HTTP, not `file://`, if you want live JSON).
2. Team: Quinte Red Devils. Seat: `#29 D. Di Genova`.
3. Prove it’s you → Continue with TeamSnap → Claim this seat.
4. Rail: Game → Go (Open Maps) → Tape → Me → School → Apps.
