# Partner ask — hockey connectors (one-pager)

**DualisCapax** · ED-COM-20260912-PARTNER-ASK-V1  
**Audience:** Spordle/HCR (identity) → GameSheet → LiveBarn → Hudl (TeamSnap = self-serve OAuth seat map)  
**Not a partnership announcement.** Ask for sanctioned access only. No scrape clients.

**Unity unlock:** passkey-first — see `UNIFIED-LOGIN-PASSKEY.md`. Partner OAuth is how Dualis *knows* the link; passkeys do not install on vendor login pages.

---

## Who Dualis is (one breath)

Unity ID members run an **on-device** residual clock on whatever stack they already have. Dualis never replaces TeamSnap, LiveBarn, Hudl, or GameSheet. Dualis never hosts a minor’s named clip. Books stay on-device; outbound is receipt hashes only if ever granted.

One sentence for every vendor:

> You keep your job. We bind a Unity ID seat to your data (with consent) and name the leftover.

---

## Pipe (adaptive)

| System | Job we need | If missing |
|---|---|---|
| **TeamSnap** | Roster, schedule, RSVP, family graph (consent door) | Manual roster / schedule |
| **GameSheet** | In-game events / box (goals, pens, shots, TOI if present) | Only if league has **no** GameSheet — never paste |
| **LiveBarn** | Venue + start + surface → VOD / shift window pointer | Skip video clocks; literature prior |
| **Hudl** | Clip / tag / playlist pointers (coach language) | Adapt; no Sportscode clone |
| **HKY-IQ** (optional) | Off-ice homework clips | Optional content lane |

**Product law:** GameSheet is free for members → **never ask them to paste GameSheet data.** Pull when the league uses it.

---



---

## 0. Spordle / Hockey Canada Registry — IDENTITY (prefer for AAA)

**Why:** Every Ontario AAA player is on HCR. Parent Spordle My Account is email-verified and linked to the member. Stronger “prove you are this roster name” than TeamSnap alone.

**What we need:** Partner verify API or OAuth — confirm account holder email is linked to HCR member X (or return member link after user consents). Read-only. No write to registry.

**Ask:** Spordle / Hockey Canada third-party connectivity for DualisCapax Unity ID seat claims (Ontario AAA first).

**TeamSnap** remains the seat/schedule/family-graph map (self-serve OAuth APIv3 already exists).

## 1. GameSheet Inc — FIRST ASK

**Why you:** Digital scoresheet is the ground truth at the rink. Members already use you for free. Paste is the wrong UX.

**What we need (sanctioned):**
- Partner / B2B score API (same class SportsHeadz already uses: League URL + Division IDs → games in a date range)
- Read: completed games, scores, box / event lines (goals, assists, penalties, shots), team + division IDs, schedule keys for matching
- Auth: league/association-scoped credentials or OAuth; no scraping WebUI
- Optional later: webhook on final whistle

**What we do not need:** write access to sheets, iPad keys, referee admin, video.

**What we will never do:** ship unofficial WebUI scrapers; ask families to re-type a free scoresheet.

**Ask:** intro to partner integrations; staging League URL + Division IDs; docs for the score-extraction API; MSA / rate limits / attribution.

**Contact path:** GameSheet Inc partner / sales (gamesSheetinc.com) — “DualisCapax Unity ID score pull for residual clocks.”

---

## 2. LiveBarn — SECOND ASK

**Why you:** You are the tape. Families already subscribe. Dualis stores a **pointer + clocks**, not your CDN.

**What we need:**
- Partner OAuth (Unity ID member or team staff) → list surfaces the seat can see
- Read media window: surface UUID, start/end, feed mode (pano / auto), chunk or playlist URL **under their sub**
- Optional: Sportlogiq Player Analysis Hub shift list IDs when purchased
- Deep link back into LiveBarn player for the same window

**What we do not need:** camera install, venue revenue share, replacing your app.

**What we will never do:** reverse-engineer subscriber APIs or redistribute VOD.

**Ask:** partner program / media API; sandbox surface; ToS for third-party clock apps; whether wrap-tier economics (Dualis covering a Live sub) is even allowed — **we will not offer wrap until unit economics + your ToS clear.**

---

## 3. Hudl — THIRD ASK

**Why you:** Coach language — clips, tags, playlists. Dualis does not become Sportscode.

**What we need (core youth path):**
- B2B / partner read: team library metadata, playlist + clip IDs, tag labels, share URLs the Unity ID seat already can see
- Optional Assist hockey report fields when the team buys Assist (stats already tied to clips)
- Deep link into Hudl for the clip

**Already public (elite — not our youth default):** Wyscout Data API, StatsBomb Aggregated / Live GraphQL, Hudl IQ (AmFB) GraphQL — useful later for higher jackets, not Leaf.

**What we will never do:** claim “Hudl included,” scrape Focus uploads, or replace Assist.

**Ask:** partner / integrations for **core video library** read (youth/amateur); sandbox team; whether Assist hockey exports exist as API for partners.

---

## 4. TeamSnap — NOT a partner ask (self-serve)

Official **APIv3** + OAuth at `auth.teamsnap.com` (SDKs: JS / Ruby / iOS). Scopes: `read` / `write` / granular `write_*`.

**Dualis action:** register OAuth app; request `read` first (teams, members, events, availabilities). Write only if we ever push RSVP/status — default read-only.

---

## 5. HKY-IQ (optional, content)

Off-ice homework: annotated pro clips + voiceover (~CAD $15/mo or yearly). **No public API.** Separate content-license ask if we embed homework inside Dualis — not required for clocks.

---

## Consent & youth (every ask)

- TeamSnap (or equivalent) is the family graph / consent door.
- Guardian token or 18+ before any tape or named roster lands in a Dualis docket.
- Dualis stores de-identified clocks + vendor pointers; no named-minor video host.

---

## Success criteria (pilot)

1. **GameSheet:** pull one completed game box into a Dualis docket with zero paste.  
2. **TeamSnap:** OAuth bind → roster seats + event_id.  
3. **LiveBarn (if granted):** bind surface + window → `quinte_tape_present: true` pointer.  
4. **Hudl (if granted):** optional playlist/clip pointer.  
5. UI adapts: show only connected sources; GameSheet never shows a paste field when league has GameSheet.

---

## Email subject lines (copy-ready)

- GameSheet: `Partner API ask — DualisCapax Unity ID (score pull, no scrape)`
- LiveBarn: `Partner media API ask — DualisCapax (pointers + clocks only)`
- Hudl: `Partner read access — core library clips/tags for Unity ID seats`
- Combined LiveBarn + Hudl: `Partnership inquiry — DualisCapax Ice + Hudl / LiveBarn (athlete tape)`

---

## Explicit non-goals

- Do not sell bundled LiveBarn / Hudl / TeamSnap fees until wrap economics + vendor ToS are proven.  
- Do not announce partnerships before countersigned access.  
- Do not build a second scoresheet, camera network, or film room.

---

## Combined LiveBarn + Hudl email (copy-ready) — 2026-09-12

Send separately to each company’s partnerships inbox (same body), or CC both if you already have both contacts.

**Subject:** Partnership inquiry — DualisCapax Ice + Hudl / LiveBarn (athlete tape)

```
Hi Hudl & LiveBarn partnerships / BD teams,

I’m building DualisCapax Ice (dualiscapax.ai) — a teen-simple personal portal for Ontario AAA hockey athletes. After a paid seat claim + identity proof, the athlete gets one place for schedule, tape, and school path.

We’re already wiring TeamSnap OAuth for schedule into our Game hub. For Tape, athletes often already have Hudl and/or LiveBarn access. We want a sanctioned path to deep-link or read clips they already have rights to — not scraping, not session hijacking, not reverse-engineered private APIs.

Ask (same questions for each of you):
1. Is there a partner / developer API, OAuth, or approved embed for youth video libraries / rink surfaces the athlete can already access?
2. If yes, what’s the application path, scopes, and typical commercial terms for a consumer athlete app (not a venue install sales motion)?
3. If not yet, is there a waitlist or preferred contact for software partners?

We’re happy to ship “open in Hudl / open in LiveBarn” deeplinks now and graduate to API once approved. Happy to jump on a short call.

Thanks,
[Your name]
DualisCapax / eFuse Cosmogenesis
dualiscapax.ai
GitHub: digenova77-ui
```

Also mirrored at `research/TAPE-PARTNER-ASK-EMAIL.md`.
