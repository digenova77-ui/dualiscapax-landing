# Dom mock league source — OMHA U16 AAA / Quinte Red Devils (PRIOR season)

**Seat:** Dom only · **Label:** MOCK (not live 2026–27) · **Echo:** GameSheet Stats structure Dualis will use live later · **Never invent** when a real prior board exists.

**Doable:** **YES**

**Best source URL (Dualis site family):**  
https://gamesheetstats.com/seasons/10783/teams/384061/standings  
(season hub: https://gamesheetstats.com/seasons/10783 · Quinte U16 team id **384061**)

---

## Season end date chosen (mock snapshot window)

| Fact | Value |
|------|--------|
| **Prior / completed season** | **OMHA AAA 2025–2026** (GameSheet season id **10783**) |
| **As-of today** | 2026-09-14 — 2025–26 is finished; 2026–27 must **not** be used for mock |
| **Regular season (U16 East)** | 2025-09-29 → **2026-02-08** (omha-aaa.net) |
| **GameSheet Quinte U16 last `final` games** | through **2026-03-07** (East playoffs; e.g. U16E-A07 vs Greater Kingston) |
| **Season END (championships)** | **2026-03-15** — OMHA U16 AAA Championship weekend (Peterborough); final Credit River 4–2 York-Simcoe; Quinte lost SF same day 4–5 OT to Credit River (omha.net / omhachampionships.ca) |
| **Mock window preference** | **Season end / last-games window: 2026-03-07 → 2026-03-15** so standings + scores + scorers are fully populated (not mid-season empty boards) |

**Chosen mock as-of label:** `MOCK · OMHA AAA 2025-26 · as of season end 2026-03-15`  
(Echo GameSheet boards from season **10783** / team **384061**; championship box scores may also cite omhachampionships.ca if Dualis needs that weekend’s scores.)

---

## Primary URLs (GameSheet — Dualis family)

| Board | URL | Notes |
|-------|-----|--------|
| Season standings | https://gamesheetstats.com/seasons/10783/standings | Multi-division OMHA AAA; intermittent Cloudflare bot challenge from datacenter fetch |
| Season scorers | https://gamesheetstats.com/seasons/10783/players | Public HTML table; Quinte rows link to team 384061 |
| Season games (finals) | https://gamesheetstats.com/seasons/10783/games?filter%5Bstatus%5D=final | `/schedule` → redirects to `/games` |
| Quinte standings | https://gamesheetstats.com/seasons/10783/teams/384061/standings | **Best single mock cite** — U16 East board with Quinte #1 |
| Quinte scorers / team stats | https://gamesheetstats.com/seasons/10783/teams/384061/team-stats | Skater + goalie tables |
| Quinte schedule / scores | https://gamesheetstats.com/seasons/10783/teams/384061/schedule | Embedded `final` game objects through Mar 7, 2026 |
| Quinte roster | https://gamesheetstats.com/seasons/10783/teams/384061/roster | Roster only (not the mock standings/scores target) |

### Cite / embed / scrape posture

| Signal | Finding |
|--------|---------|
| **iframe / embed** | Successful GameSheet pages send `Content-Security-Policy: frame-ancestors * capacitor:` → **iframe/embed allowed** for Dualis-style embeds. Cloudflare *challenge* responses use `X-Frame-Options: SAMEORIGIN` (challenge page only). |
| **robots.txt** | `Allow: /` · `Disallow: /api/` · `Disallow: /*_rsc=` · Content-Signal: `search=yes, ai-train=no, use=reference`. Prefer **public HTML cite / embed / structured echo** over `/api/` or RSC scraping. |
| **HTML cite** | Public SSR/Next pages expose standings, scorers, and game JSON in page payload — suitable to **echo structure** for Dom MOCK. Not scrape-forbidden for ordinary public viewing; respect no-`/api/` and label MOCK. |
| **Sportsheadz** | Out of scope for Dualis path — Dualis >> GameSheet Stats (not Sportsheadz clone for this fixture). |

### Secondary cite (same season, non-GameSheet)

| Board | URL | Embed |
|-------|-----|--------|
| U16 standings (East/West + playoff pools) | https://omha-aaa.net/Groups/1210/Standings/ | `X-Frame-Options: SAMEORIGIN` → **not iframe-friendly**; OK as HTML cite / field cross-check |
| U16 player stats | https://omha-aaa.net/Groups/1210/Statistics/ | Same family as above |
| Championship scores (Mar 13–15) | https://omhachampionships.ca/Tournaments/2414/Schedule/ | Completes season-end score window |

Use GameSheet as Dualis echo source; omha-aaa / championships only if needed to fill championship weekend gaps.

---

## Sample field shapes (echo these — do not invent)

### Standings (GameSheet team standings table)

**Columns:**  
`RK | TEAM | GP | W | L | T | OTW | OTL | SOW | SOL | PTS | PCT | RW | ROW | GF | GA | DIFF | STK | PIM | PPO | PPG | SHGA | PP% | TSH | SHG | PPGA | PK%`

**Sample row (Quinte Red Devils, season 10783, post-season populated board):**

| RK | TEAM | GP | W | L | T | OTW | OTL | SOW | SOL | PTS | PCT | RW | ROW | GF | GA | DIFF | STK |
|----|------|----|---|---|---|-----|-----|-----|-----|-----|-----|----|-----|----|----|------|-----|
| 1 | Quinte Red Devils | 42 | 33 | 6 | 1 | 2 | 2 | 0 | 0 | 69 | .821 | 31 | 33 | 196 | 96 | +100 | Won 3 |

Minimal Dom mock W–L–PTS shape: **team, GP, W, L, (T/OTL), PTS** (+ GF/GA if Dualis live board shows them).

**Regular-season-only cross-check (omha-aaa East, ended 2026-02-08):**  
Quinte `GP 34 | W 26 | L 5 | T 1 | OTL 2 | Pts 55 | GF 152 | GA 82` — use only if mock is labeled regular-season; prefer full GameSheet 42-GP board for season-end window.

### Scorers (GameSheet team-stats / season players)

**Skater columns:**  
`RK | NAME | # | FLAGS | POS | GP | G | A | PTS | +/- | PPG | PPA | SHG | SHA | PIM | HT | Pt/G | GWG | FG | OTG | UAG | EN | SOG | SOSH | SOWG | SO% | PIMPG | SHOTS`

**Sample (Quinte team-stats, season end populated):**

| RK | NAME | # | GP | G | A | PTS | PIM | Pt/G |
|----|------|---|----|---|---|-----|-----|------|
| 1 | LAUCHLAN WHELAN | 13 | 42 | 44 | 25 | 69 | 46 | 1.64 |
| 2 | ANDREW LAURIN | 92 | 42 | 32 | 31 | 63 | 52 | 1.50 |

**Goalie columns (team-stats):**  
`RK | NAME | # | FLAGS | GP | GS | SA | GA | GAA | SV | SV% | W | L | T | SOL | OTL | PPGA | SHGA | SO | MIN | G | A`

### Scores / games (GameSheet schedule payload — `status: final`)

**Game-level fields:**  
`gameId, number, date, time, status, location, attendance, timeZoneName, timeZoneAbbr, timeZulu, timeStampZulu, gameType` (`regular_season` | `playoff`)

**Side fields (`visitor` / `home`):**  
`title, logo, id, goals, result (W|L), goalDetails[], goalsByPeriod{1,2,3,final}, shots, ppOpportunities, ppGoals, overallRecord, abbr, division{id,title}`

**goalDetails item:**  
`clockTime, firstName, id, lastName, period`

**End-window sample (playoff final on GameSheet):**  
`gameId 2823935 · number U16E-A07 · date Mar 7, 2026 · status final · gameType playoff`  
visitor Greater Kingston Jr. Gaels 2 (L) @ home Quinte Red Devils 5 (W) · division U16 East

---

## Dualis → Dom mock rules (short)

1. Echo **gamesheetstats.com** season **10783** / team **384061** field names and column order.  
2. Snapshot **season end 2026-03-15** (boards populated); never live 2026–27.  
3. UI label every surface **MOCK**.  
4. Prefer iframe/embed of public GameSheet URLs or structural echo of the tables above — do not invent teams/records if the prior board exists.  
5. Avoid `/api/` and `*_rsc=` paths per robots; Dom seat only.

---

## Report summary

| Item | Value |
|------|--------|
| **Doable** | **YES** |
| **Best source URL** | https://gamesheetstats.com/seasons/10783/teams/384061/standings |
| **Season end date** | **2026-03-15** (championships); GameSheet last Quinte U16 finals **2026-03-07** |
| **Field list (core)** | Standings: `team, GP, W, L, T, OTW, OTL, SOW, SOL, PTS, PCT, GF, GA, DIFF, STK` · Scorers: `name, #, GP, G, A, PTS, PIM` · Scores: `date, visitor/home title+goals+result, gameType, status, goalDetails` |
