# Hockey niche portal scouts — Dualis Ice (Ontario AAA / youth)

**Audience:** Chief of Staff / Ice  
**Date:** 2026-09-14 (America/Toronto)  
**Rank criterion:** Dualis **integration factor** — services that are not winning alone for the household, **or** work better as an Ice module than as a standalone app. **Not** brand popularity.  
**Law:** Integration only — **their meter, Dualis seat/face** (TeamSnap / LiveBarn pattern). Dualis does **not** clone, replace, or steal their business. Boards = **cite pipes**, never Sportsheadz clones.  
**Login law:** echo > embed > paired > kick-out.  
**Already in frame** (mention only): TeamSnap, Spordle/HCR, GameSheet, LiveBarn, Hudl, Fitbit/MFP, Google Classroom, Airbnb stays.  
**Sources:** WebSearch 2026-09; `/tmp/dualis-landing/research` (SEC01-SPORTLOGIQ, PARTNER-ASK-HOCKEY-CONNECTORS, ONTARIO-AAA-IDENTITY, OMHA U16 branch INDEX); `/workspace/ice-bind-integration-scour.md`.  
**Honesty:** No invented APIs. Unofficial GameSheet WebUI SDKs = forbidden.

---

## Ranked table (Top 11)

| Service | Job for athlete/household | Why alone fails/overwhelms | Dualis face | Integration preflight (echo/embed/paired/kick-out) | Priority |
|---|---|---|---|---|---|
| **Sportsheadz (cite pipe)** | Club/league CMS: schedules, standings, Players pages, team codes, messaging — OMHA Digital Network + many GTHL clubs | Families already juggle it + TeamSnap + GameSheet; Dualis must not become a second board. Alone it is org software, not a residual/athlete OS | Seat · Game · Go | **Echo cites only:** season `Teams/{id}/Players/`, schedule, standings URLs → Dualis packs. **Not** a clone of Sportsheadz Web/App. GameSheet score extract is **their** B2B (League URL + Division IDs) — Dualis asks GameSheet partner class, not scrape. Embed club pages only if framing allows; else paired board tab. Kick-out never as product | **P0** |
| **HKY-IQ (hockeyiq.ca)** | Off-ice IQ homework: annotated NHL clips + voiceover; optional game/player film review (~CAD $15/mo or yearly) | Niche traction; another orphan sub; no schedule/clocks; no public API | School · Tape (homework strip) | **Their meter stays.** Content-license / homework lane if granted — **echo** clip IDs + titles onto School homework; **paired** player for playback. No public API today → soft deeplink / partner content ask. Kick-out only for checkout | **P0** |
| **Sportlogiq × LiveBarn PA (+ Analytics)** | Per-jersey shift cuts, TOI, heat maps ($14.95 USD/game); Hub library; LiveBarn Analytics / iCE Elite youth metrics rolling 2025–26 | Metric dump + Hub search + separate LiveBarn sub = overwhelm; CV ≠ residual physiology | Tape (`measured_tape`) · Me clocks | **Their meter.** Doors: (1) paste TOI/shift count, (2) club XML if iCE export, (3) Teamworks/LiveBarn partner — **no public OpenAPI**. Echo shift/TOI pointers onto Tape; xG/heat stay on their page. Never re-host spotlight video. Kick-out = open their PA/Hub order | **P0** |
| **OMHA-AAA / omha-aaa.net (+ GameSheet-adjacent boards)** | League policies, standings indexes, Sportsheadz league App codes; GameSheetstats season pages (e.g. OMHA AAA) | Not a consumer product — PDFs + multi-site boards; households bounce league ↔ club ↔ GameSheet | Game · Seat | **Cite pipe.** Echo standings/schedule URLs + policy dates onto Game. Optional **embed** public GameSheetstats iframes when season ID known (already doctrine for GameSheet). Paired for omha-aaa.net / club board admin. Never invent scores | **P1** |
| **Elite Prospects** | Public player/team season pages; full-name roster cross-check (U14+); documented commercial API (`api.eliteprospects.com`) | Families treat EP as live truth → stale/wrong age bands; paid API key required for programmatic use | Seat (cross-check) · School recruiting strip | **Cite / partner.** Echo same-season team+player IDs onto seat evidence (never EP-alone as season truth per ONTARIO-AAA-IDENTITY). Partner API key via api@eliteprospects.com — **real docs exist**. Embed EP pages if CSP allows else paired. Kick-out for premium scouting reports | **P1** |
| **BenchApp** | Free/PRO team ops: roster, RSVP (email/SMS), dues/tournament fees, duties, lineups — hockey-native | Strong beer-league brand; Ontario AAA often already on TeamSnap/Sportsheadz → yet another parent login when used | Game · Seat · Apps | **Echo if team binds it:** next ice, RSVP, fee status onto Game/Seat. No public Dualis-facing API found — soft deeplink / partner ask; paired app for manager. **Do not replace TeamSnap.** Kick-out for Stripe pay-to-play checkout | **P1** |
| **RAMP Interactive** | Association registration, websites, payments — common OWHA / Ontario MHA portals (e.g. rampregistrations.com) | Once-a-year registration firehose; fees/waivers/installments; then household forgets the portal | Seat · Apps · Go (fee calendar) | **Paired / seasonal echo.** Echo registration receipt + fee due dates onto Seat/Cal after user confirms. No public consumer API assumed — partner or claim+receipt photo. Kick-out for live registration form (their checkout) | **P2** |
| **TeamLinkt** | Org registration, schedules, rosters, websites; free Core + payment take-rate; hockey SKUs; some Canadian leagues | Org-first; household sees yet another portal when association chooses it over Sportsheadz/RAMP | Seat · Game · Apps | Same class as RAMP: **echo** roster/schedule cites if association publishes them; paired for registration. No Dualis self-serve API claimed. Kick-out for payment checkout | **P2** |
| **NCSA** | Recruiting profile, coach DB, messaging, paid guidance tiers (often multi-$k) | Cost + pressure + generic multi-sport CRM; hockey exposure still live/showcase-led | School | **Pointer echo.** Profile URL + target-school list onto School; GPA/transcript stay Dualis/Classroom echo. Soft bind / paired NCSA portal. **Do not sell recruiting.** Kick-out for paid advisor upsell | **P2** |
| **SportsRecruits** | Athlete recruiting dashboard: coach views, messaging, video, filters; free + Pro sub | Another recruiting tab; useful only if coaches in sport already live there | School · Tape (film pointer) | Echo profile + film links; paired for messaging. No Dualis partner API claimed. Kick-out for Pro checkout | **P2** |
| **FieldLevel** | Coach-to-coach referrals + athlete premium tiers | Weak without engaged current coach; premium stack on top of NCSA/SR | School | Echo referral/profile pointer when coach uses it; paired. Lower Ontario AAA default than EP + Hudl film. Kick-out for premium | **P3** |

**HockeyDB:** historical pro/amateur stats site; **no public API** in scout. Cite-only for career history if needed — **below table** (P3 watchlist), not a Dualis bind target.

**SportsEngine:** NBC Sports Next stack — US-heavy; thin Ontario AAA household signal vs Sportsheadz/RAMP/TeamLinkt → omit from Top 11.

**Instat:** Hudl-family film/stats — treat as **already in frame** via Hudl (partner ask / paired), not a new niche bind.

---

## Doctrine (scout framing)

1. **Dualis >> Sportsheadz.** Club/league boards and Players pages are **cite pipes** that feed Dualis seats. Dualis packs; Dualis is not a board CMS.
2. **Their meter, Dualis face.** LiveBarn PA $14.95, HKY-IQ subscription, NCSA/SR tiers, RAMP/TeamLinkt registration fees — Dualis never wraps those into Leaf until wet-ink + ToS say otherwise.
3. **No clone / no replace.** Explicit non-goals match PARTNER-ASK: no second scoresheet, camera network, film room, or association website product.
4. **Forbidden:** GameSheet WebUI scrapers; reverse-engineer LiveBarn/Hudl; invent APIs; EP as sole season roster truth.

---

## Preflight notes by mode

| Mode | When to use here |
|---|---|
| **Echo** | Sportsheadz Players/schedule cites; EP same-season IDs; Sportlogiq TOI/shift numbers; HKY-IQ homework titles; registration receipts; recruiting profile URLs |
| **Embed** | GameSheetstats season iframes (if framing OK); rare club board embeds |
| **Paired** | LiveBarn PA/Hub order UI; HKY-IQ clip player; RAMP/TeamLinkt registration; NCSA/SR/FieldLevel portals; Sportsheadz app when cite incomplete |
| **Kick-out** | Vendor checkout / password create only — never the product surface |

---

## File map

| Path | Role |
|---|---|
| This file | Niche scout ranking |
| `research/PARTNER-ASK-HOCKEY-CONNECTORS.md` | HKY-IQ optional; GameSheet SportsHeadz-class score ask |
| `research/SEC01-SPORTLOGIQ.md` | PA / XML / partner doors |
| `research/hockey/boys-amateur/omha-u16-aaa/INDEX.json` | Dualis packs; cite pipes law |
| `/workspace/ice-bind-integration-scour.md` | Already-in-frame binds |

---

*Scout only. No deploy. No tokens. No clone.*
