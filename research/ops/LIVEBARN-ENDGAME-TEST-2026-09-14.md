# LiveBarn end-game real-world test — log

**Date:** 2026-09-14 (America/Toronto)  
**Owner:** Chief of Staff + Ice Watchdog  
**User:** David — owns LiveBarn login / account conditions  
**Look-at:** https://dualiscapax-landing.pages.dev/ (Ice Tape)  
**Law:** exploration preflight; progress-aware layers; three-bucket stop (bind / infra / known-state)

## End game (open question)

Does the household **see LiveBarn video through Dualis** (in-hole or paired stream treated as inside the portal)?  
Shell proven ≠ video job closed.

## Layer ladder (score each)

| # | Stage | Pass means |
|---|---|---|
| 1 | Seat sealed | TeamSnap oauth / Dom #29 on-device |
| 2 | tape_pipe=livebarn | Dualis remembers LB pipe |
| 3 | Hole URL | TeamSnap Notes or saved stream / else LB lobby |
| 4 | Dualis playground | Tape chrome + scoreboard face |
| 5 | Paired LB surface | Second tab/window opened to LB |
| 6 | Vendor auth | Household LB session validates (user owns) |
| 7 | **VIDEO** | Stream watchable — **END GAME** |

## Failure copy

- Last stage → stop → bucket → fix  
- Bind: not validating — update login on this device  
- Infra: Dualis path — team owns; don’t blame password  
- Known-state: upgrade/outage — user not at fault  

## Phone protocol (household)

1. Hard-refresh https://dualiscapax-landing.pages.dev/  
2. Ice → confirm Seat Bound (Dom / household seat)  
3. Tape → **Start Dualis session**  
4. Complete LB sign-in in paired surface (user)  
5. Open a known rink/game stream  
6. Flip back to Dualis Tape — note scoreboard + whether video job feels “through Dualis”  
7. Report stops to Watchdog for layer score  

## Box depth run (this session)

Running Dualis Tape path as far as possible without household LB credentials.  
On login wall: log stop as **bucket 1 (user bind)** and continue **post-auth path work** (what happens if auth succeeds — stream select, CSP, return-to-Tape, soft-fail UX).

### Run log

| Time (ET) | Stage reached | Result | Bucket | Notes |
|---|---|---|---|---|
| (fill during run) | | | | |

## Post-auth path (work while user bypasses login)

**Context (2026-09-14 ET):** Box cannot complete household LiveBarn login. Stages 1–4 can be exercised on Dualis; stages 5–7 need the user's LB session. Design below is what happens **after** sign-in succeeds — no partner API invented; no scrape.

### Research notes (honest)

| Source | Finding |
|---|---|
| `curl -sI https://watch.livebarn.com/` (2026-09-14) | `Content-Security-Policy: frame-ancestors 'none'` **and** `X-Frame-Options: deny` |
| LiveBarn public FAQs / venue pages | Browser + iOS/Android/tvOS apps; Search → venue → surface → Live/VOD. **No public embed / partner media API docs.** |
| GitHub reverse-client libs (shauntarves/livebarn, go-livebarn) | Unofficial browser-derived VOD fetch — **not** Dualis integration surface; do not use or cite as partner API. |
| Epiphany + `ice-portal.js` | Dualis **is** the session (`openTapePlayground` → Dualis face first, then `openTapeWindow` paired tab). CSP deny is expected and accepted. |
| Keys | `dc.ice.tape_stream` (`TAPE_STREAM_KEY`), pipe `livebarn`, sign-in fallback `https://watch.livebarn.com/en/signin` |

### Embed preflight verdict — **paired window, not iframe**

- **Verdict: PAIRED PRIMARY.** `watch.livebarn.com` refuses framing (`frame-ancestors 'none'` + `X-Frame-Options: deny`). Dualis must **never** rely on `<iframe class="ice-tape-frame">` for LiveBarn.
- Code already branches: `liveBarnBlocksIframe()` → arm `#tapeLandShell` (scoreboard + chrome) + `openTapeWindow(u, "dualis_livebarn")` with `_blank` / synthetic `<a>` / last-resort same-tab.
- Team cam / Falcon URLs that allow framing still use in-hole iframe; LiveBarn stays shell + paired tab.
- Re-check headers only if LB CDN/app changes; until then do not attempt iframe “just in case.”

### Concrete sequence IF user bypasses login (stages 5→7)

**Stage 5 — Paired LB surface (Dualis already open)**

1. On Dualis Tape: seat bound → `tape_pipe=livebarn` → tap **Start Dualis session**.
2. Dualis playground arms (scoreboard face stays on Dualis tab).
3. Paired tab opens to known hole (`dc.ice.tape_stream` or TeamSnap Notes LB URL) **or** `LB_SIGNIN` if none saved.
4. Soft-fail if popup blocked → see mobile checklist below; Dualis face still valid (stage 5 partial).

**Stage 6 — Vendor auth (user owns credentials)**

1. In paired tab: complete LiveBarn sign-in (email/password; household account).
2. Confirm active subscription (Basic = one device; Premium = two — extra Dualis+LB tabs can kick sessions).
3. Disable public/work Wi‑Fi traps / ad-block only if LB FAQ login tips apply; Dualis does not proxy credentials.
4. Pass = landed past sign-in into Search / Favorites / home. Fail → **bucket 1 (bind)** — “Update LiveBarn login on this device”; do not blame Dualis password fields.

**Stage 7 — VIDEO (facility camera → end game)**

LB UI steps (from LiveBarn FAQs — Live path):

1. Open **Search**.
2. Type the venue name (Quinte / rink the team uses that day — never invent; use TeamSnap event location or known favorites ♥).
3. Select venue → list of **surfaces**.
4. Tap **Live** on the correct surface (not VOD unless reviewing past game).
5. If Live icon missing: game may not have started / No Action / Initializing / Technical Issue / Blackout / Private PIN / Ontario “LEAGUE PARTNER GAMES ONLY” — see soft-fail copy.
6. Optional: switch **Pano** vs **Auto** (web: lower-left of player) once video is up.
7. **End-game check:** stream watchable in paired tab **while** Dualis Tape scoreboard/chrome remains the session face on flip-back. That is “through Dualis” without embedding LB.

### How Dualis should capture / save the hole URL

Goal: next Start Session skips lobby and opens the watchable surface URL.

1. **Preferred (user):** After Live player is up, copy the browser address bar URL from the paired tab (if LB exposes a stable deep link) → Dualis Tape → paste into **Paste team stream URL** → **Save · show here**. Code path: `lsSet("dc.ice.tape_stream", v)` + `setTapePipe` (use LiveBarn source card / re-open so pipe stays `livebarn`).
2. **Auto on open:** `openTapePlayground` already persists when `isLiveBarnUrl(u) && u !== LB_SIGNIN` → writes `dc.ice.tape_stream`. So any known LB URL passed in (TeamSnap Notes or prior save) is remembered.
3. **TeamSnap Notes:** `resolveKnownTapeStream(preferLiveBarn)` → Notes URL if no saved stream. Coach/parent should paste the same hole URL into the event Notes once for the roster.
4. **Do not save:** bare `…/en/signin`, password query strings, or reverse-engineered media segment URLs. Hole = shareable watch/venue/surface page the household can reopen.
5. **Refocus:** `#btnTapeLbWindowLand` / `#btnTapeLbRefocus` re-open/focus paired tab with `data-lb-url` (saved hole or sign-in).

### Soft-fail copy — stages 5–7

| Stage | Symptom | Bucket | Copy (user-facing) |
|---|---|---|---|
| 5 | Second tab never opens / blank | Infra (popup) | “Phone blocked the LiveBarn tab. Allow pop-ups for Dualis, then tap **Open / focus LiveBarn tab** again. Dualis scoreboard stays here.” |
| 5 | Dualis face missing / wrong pipe | Infra | “Tape didn’t arm the Dualis session. Hard-refresh Dualis, confirm LiveBarn source, Start Dualis session again — not your LiveBarn password.” |
| 6 | Wrong email/password / unregistered | Bind | “LiveBarn didn’t accept this device’s login. Sign in on the LiveBarn tab with the household account. Dualis isn’t holding your password for them.” |
| 6 | Logged out when opening another tab | Known-state (plan) | “Basic plan = one LiveBarn device. Close extra LB tabs or use Premium for two. Dualis face can stay open.” |
| 7 | No Live icon / No Action / Initializing | Known-state | “Camera isn’t live yet — LiveBarn shows no action or initializing. Keep Dualis open; retry Live on that surface when warm-up starts.” |
| 7 | Technical Issue / Blackout / gray VOD | Known-state | “Venue or LiveBarn outage / blackout — not your Dualis setup. Check later or ask the rink; we can’t restore missing VOD.” |
| 7 | Private padlock | Bind (venue PIN) | “This surface is Private — needs the venue PIN. Dualis can’t bypass it.” |
| 7 | Video plays but Dualis feels “just LB” | Infra (UX) | “Flip back to the Dualis tab for scoreboard + ice chrome. LiveBarn is the paired stream, not the session face.” |
| 7 | Stream URL won’t save / Notes empty | Infra | “Paste the LiveBarn watch URL into Tape’s stream field (or TeamSnap Notes). We never invent rink links.” |

Rule: last stage reached → stop → bucket → fix. Never tell the user their Dualis seat password is wrong when LB auth fails.

### Mobile popup / return-to-Tape checklist

1. Start session from an explicit tap (`#btnTapeLbSession`) — required for `window.open`.
2. If blocked: Dualis stays; use **Open / focus LiveBarn tab →** again after enabling pop-ups for `dualiscapax-landing.pages.dev`.
3. `openTapeWindow` order: `window.open(u,"_blank")` → synthetic `<a target=_blank rel=noopener>` → last resort `location.href` (leaves Dualis — user must Back / re-open Dualis).
4. After last-resort same-tab: bookmark Dualis; complete LB; return via history or home-screen Dualis; tap **LiveBarn tab →** only if Dualis still holds the hole URL.
5. Prefer keeping Dualis in one tab and LB in another; avoid stacking many LB tabs (Basic plan kick).
6. Landscape: Dualis may lock orientation only when already landscape; portrait session face is OK.
7. Return-to-Tape success = Dualis scoreboard visible + LB video still playing in background/other tab (or quick flip). That closes stage 7 psychologically even though pixels are not in an iframe.

### GameSheet note (separate — iframe candidate only)

GameSheet **publishes** official embed docs: `https://gamesheetstats.com/seasons/{ID}/games` (and schedule/standings) as `<iframe>` — see help.gamesheet.app embed tool (updated 2026-06). Useful for Tape scoreboard/live echo (`dc.ice.gamesheet_live`), **not** a LiveBarn video substitute. Preflight GameSheet iframe separately when wiring live board; do not conflate with LB paired path.

## Related

- `research/tape/LIVEBARN-SESSION-EPIPHANY.md`  
- `research/ops/ICE-BIND-INTEGRATION-SCOUR-2026-09-14.md`  
- Ice Watchdog three-bucket + Apps Bound demotion (pending)

*Log append-only during the run.*


## Platform / OS matrix (required)

End-game is not Android-only. Dualis Tape + LiveBarn paired session must be scored on each household surface:

| Surface | Browser / WebView | Layer risks to log |
|---|---|---|
| **Android phone** | Chrome | Popup → new tab vs blocked; orientation/rotate; return-to-Tape |
| **Android tablet** | Chrome | Same + landscape playground |
| **iOS iPhone** | Safari | Popup blockers stricter; `window.open` often same-tab; no true multi-window like desktop |
| **iOS iPad** | Safari | Split view / Stage Manager may help paired feel |
| **Windows** | Chrome / Edge | Paired window strongest; popup settings |
| **macOS** | Safari / Chrome | Safari popup + autoplay; Chrome closer to Android desktop |
| **Desktop Linux** (dev) | Chrome | Box / engineering only |

### Cross-platform rules

1. Preflight each OS before claiming VIDEO end-game for that surface.
2. Paired-session UX may differ by OS — one code path, OS-specific soft-fail copy when needed.
3. Never design only for David’s Android; Android is the household probe, not the product ceiling.
4. Log stops with **surface** column: e.g. `iOS Safari · stage 5 · popup blocked` vs `Windows Chrome · stage 7 · video OK`.

### Score sheet (fill per surface)

| Surface | 1 Seat | 2 Pipe | 3 Hole | 4 Playground | 5 Paired | 6 Auth | 7 VIDEO | Bucket if stop |
|---|---|---|---|---|---|---|---|---|
| Android Chrome | | | | | | | | |
| iOS Safari | | | | | | | | |
| Windows Chrome/Edge | | | | | | | | |
| macOS Safari | | | | | | | | |
| macOS Chrome | | | | | | | | |


## Platform compliance law (user 2026-09-14)

Whatever surface can run Dualis Ice **at all** must also support the LiveBarn / Tape end-game path — same compliance bar.

**Exception:** a real security constraint in that environment that Dualis cannot pass without breaking a fundamental rule (ours or the platform’s). Then: **explicitly tell the household** — known-state / surface limitation, not their fault, not a silent fail.

**Default posture:** workarounds exist for almost every OS/browser friction (popup → same-tab paired return, orientation, autoplay) as long as Dualis does not break its own laws (never invent, never scrape forbidden APIs, never steal vendor sessions, never paste scores). Prefer workaround over “unsupported” labels.

**Honest surface block (example macOS):** If a surface (e.g. macOS Safari) has a security constraint with **no Dualis-legal workaround**, tell the household plainly: end-game video cannot run on that surface **until someone makes it work**. Known-state bucket — not their fault, not “try again,” not blame login.


