# LiveBarn end-game test log — 2026-09-14

**Look-at URL:** https://dualiscapax-landing.pages.dev/  
**Repo:** digenova77-ui/dualiscapax-landing  
**Owners:** Chief of Staff + Ice Watchdog  
**User:** David — owns LiveBarn login / account conditions  
**Law:** exploration = preflight capability; progress-aware soft-fail; three buckets (bind / infra / known-state)

## End game (still under determination)

Everything built so far (Dualis playground, scoreboard, paired tab, bind-once) can work.  
**Open question:** does the household actually **watch video through Dualis** (in-hole if CSP allows, or paired stream experienced as “inside our portal”)?

## Layer checklist (score as we go)

| # | Stage | Pass? | Notes | Bucket if stop |
|---|---|---|---|---|
| 1 | Seat sealed (TeamSnap OAuth) | — | | bind / infra |
| 2 | `tape_pipe=livebarn` | — | | infra |
| 3 | Hole URL known (Notes / saved) or LB lobby | — | | bind / infra |
| 4 | Dualis playground chrome + scoreboard up | — | | infra |
| 5 | Paired LiveBarn tab/window opened | — | CSP iframe deny = expected, not fail | infra / known-state |
| 6 | Vendor auth validates | — | Watchdog never assumes password | **user bind** |
| 7 | **VIDEO visible / watchable** (end game) | — | | bind / infra / known-state |

## Phone household protocol

1. Open https://dualiscapax-landing.pages.dev/ (hard-refresh) on phone.  
2. Confirm Seat Bound (Dom / household seat).  
3. Rail → **Tape**.  
4. Tap **Start Dualis session** (not bare LiveBarn from Apps).  
5. Confirm Dualis face stays (scoreboard/chrome).  
6. Paired LiveBarn tab → sign in with household sub (user).  
7. Open a venue/game stream.  
8. Flip back to Dualis — report what holds / what breaks.  
9. Ice Watchdog scores: last stage → bucket → fix.

## Desktop depth run (agent)

Run as far as possible without inventing credentials. Stop at stage 6 and hand login to user.

### Run log

_(appended below during run)_

## Related locks (same day)

- Portal login law: echo > embed > paired > kick-out  
- Bind persist like seats; login change → soft-fail until update  
- Watchdog: progress-aware; never assume correct login; three buckets  
- Exploration law: capability check before deep build  
- Hudl demoted until Tape pointer/embed  
- Scour: `research/ops/ICE-BIND-INTEGRATION-SCOUR-2026-09-14.md`

## Ops split

- Watchdogs: infrastructure / coding  
- User: logins / account conditions  
- Ultimate resolve: user  

