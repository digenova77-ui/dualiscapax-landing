# Ice athlete info architecture — universal seat (not dock tabs)

**Date:** 2026-09-14 (America/Toronto)  
**Lens:** ANY PLAYER · ANY POSITION · ANY LEAGUE — hockey as guide sport  
**User law (2026-09-14):** Perspective of any player, any position, any league. Sport + individual tendencies determine **layout emphasis** — never hide info; **dock ≠ ceiling**.  
**Care order when seated (David):** **you → team → opponent → league → other.** Every face and depth move respects that gravity.  
**Probe instance only (not product default):** Dom Di Genova · Quinte Red Devils U16 AAA #29 LW Power F — see § Probe.  
**Sources (cite/echo only):** `cf-pages/js/ice-portal.js` STAGES + renders; `SEAT-IDENTITY-V1.json`; `data/matchups/README.md`; `cf-pages/research/ICE-PORTAL.md`; `LAYOUT_LAW.md`; schedule/roster packs when present for a seat  
**Laws:** Never limit depth because bottom tabs don’t allow it · Layout emerges from sport + individual tendencies · Cite/echo only; never invent · Dualis teen-simple face · Care order you→team→opponent→league→other

---

## Universal athlete

Ice is one product for every seated hockey athlete. Position, style, and league **shift emphasis** (density, default order, verb language) — they do **not** fork into different apps, docks, or hidden panes.

### Who sits

| Axis | Coverage (principles port; cite local packs only) |
|---|---|
| **Positions** | **F** — Power F / Sniper / Playmaker / 2-Way · **D** — Offensive / Defensive / Hybrid · **G** — Athletic / Butterfly / Positional |
| **Leagues / levels** | OMHA U16 AAA as a worked example; same IA for **U13–U18**, **OWHA** (girls), **Junior**, **prep/school**, **US youth** (and peer circuits). Bind names and cite sources change; need grammar does not. |
| **Seat grain** | One jersey on one team slate. Matchup packs, Me dims, School chips, and season lines are **seat-owned** — never bleed another kid’s cites. |

### Care order when seated (gravity)

When a seat is claimed, information gravity is fixed:

1. **You** — this athlete’s next ice, body/fuel, school, seat dims, personal tape, personal matchup dos  
2. **Team** — teammates, staff, team RSVP / TeamSnap, home rink, shared slate  
3. **Opponent** — tonight’s / this week’s foe; seat plan vs **this** opponent when cited  
4. **League** — scores / standings / scorers / circuit board when cited or link-off  
5. **Other** — peer lookup (HockeyDB), catalog binds, overflow Apps

**Rule:** Faces default to **you**, then widen. Depth may open team → opponent → league → other, but never invert the stack (e.g. League board must not bury “your next puck drop”; opponent dos must not replace “your” empty awaiting-cites state with another seat’s pack).

### Universal vs role-shifting needs

Needs are **temporal + role**, not tab labels. Teen-simple face; depth via expand / day-tray / partner link-off.

#### UNIVERSAL (every seat, every league level)

| Horizon | Need | Care tier | Honest Dualis surface today |
|---|---|---|---|
| **Day** | When / where is ice tonight? | you → team | **Game** hub (next game else practice) + **Cal** week; TeamSnap bind for RSVP |
| **Day** | How do I get there / am I late? | you | **Go** → Maps; pasted Maps ETA only (no invented drive time) |
| **Day** | Homework / grades between ice | you | **School** portal link-offs; GPA claim + transcript photo echo |
| **Day** | Who am I on this team? | you | **Me** size · shot · style · pos · age once cited; peer search un-prefills seated kid |
| **Week** | Next puck drop + upcoming slate | you → team | **Game** countdown + upcoming + tourney block |
| **Week** | Stay / fuel / food on away | you → team | **Go** Fuel · Hotel · Airbnb · Food + on-device stay paste |
| **Week** | Tape of last ice / coach clip | you → team | **Tape** LiveBarn / Hudl / BYO — Dualis **pointer**, does not host |
| **Week** | League context | league | **Game → League** stubs until GameSheet / circuit cite; link-off not invention |
| **Season** | Stable seat identity | you → team | **Seat** claim + Spordle/HCR (or local registry) / TeamSnap binds |
| **Season** | Season line (GP G A P / GA SV% etc.) | you | Cite when connected; dash until real — never invent |
| **Season** | Full slate window | you → team | **Cal** season window from cited schedule |
| **Season** | Transcript / GPA / eligibility floors | you | **School**; published NCAA (or peer) floors as progressive disclosure only |

#### SHIFTS BY ROLE (emphasis + verb language — same stages, same depth paths)

| Role / style | What rises (still universal panes) | What softens (still reachable) | Care note |
|---|---|---|---|
| **Power F** | Me fuel + compete dims; matchup dos wall/net-front when cited; Tape post-game wall/net | League bravado; Apps as primary | Opponent dos are **your** seat pack only |
| **Sniper F** | Tape release looks; Me shot/style; Game scorers when cited | Go (unless away week) | You → then scorers (league), not league-first |
| **Playmaker F** | Tape dish / seam looks; Cal appointments; Me style | Matchup “edge” bravado | Team chemistry language only when cited |
| **2-Way F** | Cal both-ends; Tape defensive detail; Me recovery | Opponent “edge” swagger | You recovery before opponent story |
| **D Offensive** | Cal gap/breakout when cited; Tape pair/offensive blue; Game PP when cited | Forward net-front corpus | Pair = team tier under you |
| **D Defensive** | Tape gap/PK detail; Cal D-zone appointments; Me recovery | Scorer boards as primary | Opponent forecheck plan = your seat cites |
| **D Hybrid** | Mix of Offensive + Defensive density by cited style | Single-archetype Me copy | Style cite drives blend — no invent |
| **G Athletic** | Tape crease sessions; Me workload/recovery; Game **next start** | Forward board-battle dos | Start = you; team travel still Go |
| **G Butterfly** | Tape butterfly/pad sessions; Me recovery; Cal start pattern when cited | Skater matchup edge copy | Same gravity; verb language crease-native |
| **G Positional** | Tape angle/depth sessions; Game next start; Cal | Chaotic athletic-only framing | Positional cues only from cites |

Individual cites (household profile, live matchup packs, school name, registry) **override** bare position defaults. Another seat’s richness never becomes chrome for this seat.

### Leagues / levels — principles that port

| Level class | What stays universal | What shifts (cite local) |
|---|---|---|
| **OMHA U16 AAA** (probe class) | Day/week/season grammar; care order; stages | GameSheet / OMHA URLs; Spordle/HCR; 30-game slate shape when cited |
| **U13–U18 (boys OMHA / peers)** | Same IA | Age-appropriate school pressure; travel radius; roster proof source |
| **OWHA (girls)** | Same IA · same positions/styles | Circuit binds & schedule cites; never assume boys-league URLs |
| **Junior** | Same care order; deeper week opponent + league pressure | Heavier League link-off when cited; recruiting/School still you-first |
| **Prep / school hockey** | School ↔ Ice coupling tighter | School face may densify on school-day opens; still you → team |
| **US youth** | Same stages & gravity | NCSA/Eligibility Center / US registry binds replace Ontario-only chips when cited |

**Port rule:** Swap cite sources and bind labels; do not invent a second dock or hide F/D/G panes by league.

---

## Probe instance only (Dom / Quinte)

**Status:** Worked example to pressure-test universal IA — **not** product defaults for other kids.

| Field | Echo (household / packs — Dom only) |
|---|---|
| Seat | Quinte Red Devils U16 AAA · `#29` · `LW` · Di Genova · `cite_status: household` · `landing_prebaked: true` |
| Size / shot / style | `5'11" / 185` · `L` · `Power F` |
| Soft play line (NCSA public, may be months old) | Size and above-average shot; developing power forward — puck protection, shot in traffic, heads-up physical style |
| School | Nicholson Catholic College · NCSA chip · Class of 2029 · club #29 Quinte note |
| Staff (team pack) | HC Randy Rowe; assts Boomhower / Culhane / Ellis; mgrs Mercer / Middleton |
| League slate (OMHA AAA RS, captured 2026-09-12) | **30** games · **15 home / 15 away** · first cite Thu Oct 8 2026 vs Greater Kingston Jr Gaels @ Mackay Arena |
| Kingston matchup pack (`…/29/vs-greater-kingston-gaels.json`) | `status: live` · seat-owned dos/edge for **#29 only** |

Ice never invents scores, meal plans, workout logs, or another kid’s matchup notes from Dom’s pack. Dom NCSA URL / Me seed must not inherit to other seats (code already special-cases).

---

## Dualis Ice stages vs needs (no invented data)

STAGES rail (`ice-portal.js`): **Seat · Game · Cal · Go · Tape · Me · School · Apps**

| Stage | Care gravity | Maps well to | Friction for any athlete |
|---|---|---|---|
| **Seat** | you → team | Identity gate; same flow every player | Equal-weight forever → chrome noise after claim |
| **Game** | you → team → opponent → league | Next ice; upcoming; League shell | Matchup dos often on **Cal** not Game Day; League empty until cite; opponent pack path narrow in helpers |
| **Cal** | you → team → opponent | Week spine; day tray can host matchup lane | “Game week” mental model taps Game first; depth one stage over |
| **Go** | you → team | Away logistics | Quiet on home nights (correct) but full rail peer |
| **Tape** | you → team | Watch / review pointer | External tab (LiveBarn iframe block) — easy to feel empty without event breadcrumb |
| **Me** | **you** | Body + fuel binds + locked dims | Style/pro depth off face without named link-off; no invent logs |
| **School** | **you** | Academics + recruiting link-offs | Probe-rich chips must not become defaults for other seats |
| **Apps** | other (overflow) | Bind catalog | Duplicates Me/School/Game entry points; rarely needs equal dock weight |

**Net:** Stages cover **nouns** (schedule, travel, video, body, school). Athletes run **verbs**: prepare *my* matchup · review *my* clip · fuel for Friday · check school between life. Verbs want flow + link-off under care order — not another equal dock icon. League and other stay reachable without stealing the open.

---

## Where tabs choke depth (universal)

1. **Equal 8-icon rail** — Seat/Apps same weight as you-first week verbs → teen face gets chrome (`ICE-PORTAL.md`; `LAYOUT_LAW` gist-not-book).  
2. **Matchup depth ≠ Game Day** — seat packs built for Game/Cal, but cite sheet often Cal-owned → prep one tap from mental “Game” home (still **your** pack).  
3. **Opponent slug helpers too narrow** — probe mapped Kingston/Gaels; other foes may return `""` even when seat JSON exists → depth on disk unreachable.  
4. **League under Game is shell-only** — correct no-invention; missing link-off to real boards (GameSheet / circuit) so **league** tier has no honest door.  
5. **Tape external without breadcrumb** — no “Watch · Tape” from *this* event → Tape feels like settings.  
6. **Me depth omitted** — “define elsewhere when they go looking” lacks named link-off → choked by omission.  
7. **School eligibility floors** in JS but not progressive disclosure on School face.  
8. **Apps duplicates** School/Me binds — splits attention; violates “other last.”

**Law:** Fix ≠ more dock tabs. Fix = link-off + flow so depth survives a 4–5 icon gist rail **without breaking you→team→opponent→league→other**.

---

## Layout tendency matrix (emphasis shifts ≠ different products)

Shared product · shared stages · shared depth paths. Cells change **surface weight** and **verb copy** from cited position/style + time-of-week — never hide a column.

### Shared principles

- **Time-first under care order:** Day open ≈ **your** next ice / next away; Me/School rise on quiet days; Tape rises post-game; League only after you/team/opponent are oriented.  
- **Role changes emphasis, not availability.** F / D / G keep Game·Cal·Go·Tape·Me·School.  
- **Style sharpens Me + matchup language** from **cited** blurbs/packs only — never invent destiny or named pro twin as fate.  
- **Depth always reachable** — expand, day-tray, partner link-off. **Dock ≠ ceiling.**  
- **Seat-owned packs** — `data/matchups/{team}/{jersey}/…` never bleed across jerseys.

### Matrix (heavier ↑ / lighter ↓ — all still reachable)

| Seat class | ↑ Heavier surfaces | ↓ Lighter (reachable) | Care-order check |
|---|---|---|---|
| **F Power** | Game · Cal matchup dos · Me fuel+dims · Tape wall/net | Seat post-claim · Apps | Opponent dos after you/team slate |
| **F Sniper** | Tape release · Me shot · Game scorers when cited | Go (home weeks) | Scorers = league after you |
| **F Playmaker** | Tape dish · Cal · Me style | Edge bravado | Team looks only if cited |
| **F 2-Way** | Cal both ends · Tape D-detail · Me recovery | Matchup swagger | You recovery first |
| **D Offensive** | Cal breakout/gap · Tape blue · Game PP when cited | Forward Power-F corpus | Pair = team under you |
| **D Defensive** | Tape PK/gap · Cal D-zone · Me recovery | Scorer-primary chrome | Opponent plan = your cites |
| **D Hybrid** | Blend per cited style | Single-archetype Me | No invented blend |
| **G Athletic** | Tape crease · Me workload · Game next start · Cal | Skater board dos | Start = you; Go for team trips |
| **G Butterfly** | Tape pads/butterfly · Me recovery · Cal starts | Skater edge copy | Same gravity |
| **G Positional** | Tape angles · Game start · Cal | Athletic-only framing | Cite-only cues |

Quiet day / school-heavy day / away week / post-game: time context **re-weights** the same matrix without dropping care order.

---

## Depth moves that work for every seat

Each move: existing cites/packs/partner URLs only · any jersey · any league bind set · **care order respected**.

1. **Game Day → “Matchup for this seat” expand** (you → opponent)  
   Reuse `matchupLaneHtml` / `matchupPlanForSeat`. Empty = “— awaiting cites for **this seat**.” Never another jersey’s dos.

2. **Widen opponent → pack slug from schedule echo** (you → opponent)  
   Prefer opponent/location strings on cited events (or filenames under `{jersey}/`) so any foe can load **this seat’s** JSON when present — echo-only.

3. **League empty panes → circuit / GameSheet link-off** (league, after you)  
   “Open GameSheet Teams →” / circuit game page on empty Scores/Standings/Scorers — no fake numbers. League door without League-first chrome.

4. **Game / Cal event → Tape with stream from team notes** (you → team)  
   Resolve LiveBarn/BYO from TeamSnap (or peer) Notes. “Watch · Tape” from next-game card into `renderTape` — pointer flow.

5. **Me “looking deeper” → profile / HockeyDB** (you → other)  
   Teen line under locked dims: profile link when cited · HockeyDB search un-prefilled — no essay, no invented %.

6. **School → published eligibility floors disclosure** (you)  
   Reveal behind “NCAA floors →” (or peer published floors) under GPA claim — cite published constants only.

7. **Away event → Go prefilled** (you → team)  
   “Go · Maps / Stay” from away row into `renderGo` using cited location — no new tab.

8. **Demote Apps to overflow; open binds from Me / School / Seat** (other last)  
   Workout/Nutrition → Me; school portals → School; Apps = “All binds” link-off — frees rail for athlete verbs; care order intact.

9. **Open / hub prioritizes you**  
   Default land: next ice for **this seat** (Game) before team bulletin, opponent sheet, or league board. Widen on tap — don’t invert.

10. **Team context without stealing you**  
    Staff / RSVP / shared slate available from Game/Cal, visually secondary to personal countdown and personal matchup empty/live state.

---

## Mapping cheat-sheet (need → stage → depth · care)

| Athlete need | Primary stage | Depth without new dock tab | Care tier |
|---|---|---|---|
| Next ice | Game | Cal week · circuit cite URLs | you → team |
| Seat vs opponent | Game/Cal | `data/matchups/.../{jersey}/vs-*.json` expand | you → opponent |
| Drive / stay / food | Go | Maps / stay / food link-offs | you → team |
| Watch ice | Tape | Paired LiveBarn/Hudl tab | you → team |
| Fuel / body / style dims | Me | Partner logins · profile/HDB link-off | you |
| Homework / GPA / eligibility | School | Edsby etc. · floors disclosure | you |
| Scores / standings / scorers | Game → League | GameSheet / circuit link-off | league |
| Prove seat / bind catalog | Seat → binds | Apps as overflow | you → other |

---

## Out of scope (this memo)

- Full Ice chrome redesign  
- Inventing GameSheet scores, season totals, or matchup dos for any seat  
- Treating Dom/Quinte cites as defaults for other athletes  
- Changing USER_VALIDATED roster or EP gaps for the probe team

**Bottom line for builders:** Start from **what any seated athlete needs** on practice day / home rematch / midweek away / Sunday tape — under **you → team → opponent → league → other**. Hang depth off Game·Cal·Go·Me·School flows. Role and league only retune emphasis. The dock is a gist remote — never the encyclopedia lid; Dom/Quinte is probe pressure only.
