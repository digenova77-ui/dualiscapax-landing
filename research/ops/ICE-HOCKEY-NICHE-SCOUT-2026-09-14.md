# Hockey-only niche scout — Dualis Ice (2026-09-14)

**Audience:** Chief of Staff  
**Scout:** Ice Watchdog  
**Rank key (David):** Dualis **integration factor** — who works *inside* Ice as a module that (a) isn’t working well alone, or (b) works *better* as a Dualis module than as a standalone app. **Not brand size.**  
**Partner law (David):** NOT stealing business ideas or rebuilding their products. Scout = integration partners like TeamSnap / LiveBarn — **their service, Dualis face**. Dualis >> SportsHeadz (cite pipes only). Never rebuild someone else’s design. Integrate for **interoperability** with the rest of Ice. If a service won’t interoperate, it can still be valuable as its **own portal module/metric** — still their product, Dualis face.  
**Login law:** echo > embed > paired > kick-out · preflight before build · no token asks  
**Already in frame (excluded):** TeamSnap, Spordle/HCR, GameSheet, LiveBarn, Hudl, Fitbit/nutrition, Classroom, Airbnb  

---

## Broad picture

Best Dualis modules are services households **already pay for or cite**, that feel lonely/overwhelming as their own app, but **light up Seat/Game/Me/School/Tape** when echoed. We bind; we do not clone.

---

## Re-ranked by integration factor (top 10)

### 1. Sportlogiq Player Analysis (LiveBarn meter) — Tape · Me clocks
| | |
|---|---|
| **Why better inside Dualis** | Alone = pay-per-game page + Hub noise. Inside Ice = one jersey’s TOI/shift clocks on the **same seat card** as TeamSnap schedule + Tape session |
| **Alone weak** | Friction, another tab, easy to abandon after one game |
| **Module shape** | Bind/module: their $14.95 meter → Dualis `measured_tape` echo (paste door first; partner later). Never re-host spotlight video |
| **Interoperate?** | Yes — with LiveBarn hole + Seat + Me |
| **Preflight** | No public API; paste / XML / Teamworks partner |
| **Readiness** | Face-ready / pipe-not |

### 2. Elite Prospects — Me (peer / path)
| | |
|---|---|
| **Why better inside Dualis** | Alone = endless DB. Inside Ice = peer chips beside **this seat’s** style/size identity (Power F class), not a second homepage |
| **Alone weak** | Overwhelming for U16 household; U10 sparse |
| **Module shape** | Partner echo of player id → seat `ids.elite_prospects` + Me peer strip. Their data, Dualis face |
| **Interoperate?** | Yes — Me + seat identity; cite-only |
| **Preflight** | Official API (ops key — never user token) |
| **Readiness** | Integration-ready (partner) |

### 3. SportsHeadz / OMHA–club board cites — Game · Cal
| | |
|---|---|
| **Why better inside Dualis** | Alone = board maze. Inside Ice = **cite paint** on Game/Cal for the sealed seat’s league — Dualis >> SportsHeadz (never clone UX) |
| **Alone weak** | Household doesn’t “use SportsHeadz” as an app; they endure it |
| **Module shape** | Cite pipe / harvest echo only. Not a rebuild |
| **Interoperate?** | Yes — with TeamSnap validate-later + GameSheet scores |
| **Preflight** | Public cites + org GameSheet extract IDs |
| **Readiness** | Face-ready / harvest live |

### 4. NCSA — School · Me (recruiting module)
| | |
|---|---|
| **Why better inside Dualis** | Alone = recruiting portal + premium fog. Inside Ice = School GPA floor + NCSA public bio as **one seat’s** academic/athletic strip |
| **Alone weak** | Grades locked; daily hockey life isn’t NCSA |
| **Module shape** | Deeplink + public echo module. Never invent locked grades. Still their product |
| **Interoperate?** | Partial — bio/events yes; grades no (known-state) |
| **Preflight** | Public profile URL; no household OAuth |
| **Readiness** | Echo/deeplink live |

### 5. HockeyDB — Me (path metric module)
| | |
|---|---|
| **Why better inside Dualis** | Alone = search site. Inside Ice = empty-by-default peer tool on Me next to EP — only when junior path exists |
| **Alone weak** | Empty for many AAA kids; not a daily home |
| **Module shape** | Deeplink/echo metric. No scrape. Their pages |
| **Interoperate?** | Soft — Me only until ids land |
| **Preflight** | No public API |
| **Readiness** | Deeplink live · demote API fantasy |

### 6. HKY-IQ — Me · Tape (IQ homework module)
| | |
|---|---|
| **Why better inside Dualis** | Alone = content site + booking email. Inside Ice = off-ice homework strip on the athlete seat (clip pointer / licensed embed) |
| **Alone weak** | Low daily traction; commercial embed restricted |
| **Module shape** | Content-license module — their clips, Dualis face. Not a Dualis coaching product |
| **Interoperate?** | Only after written license; else paired/deeplink |
| **Preflight** | License required (ToS) |
| **Readiness** | Demote until license |

### 7. SportsEngine — Game (adaptive schedule module)
| | |
|---|---|
| **Why better inside Dualis** | Alone = another team OS. Inside Ice = **same Game hub** when the club isn’t on TeamSnap — interoperability across club stacks |
| **Alone weak** | Wrong default for OMHA Quinte; login fatigue |
| **Module shape** | Adaptive bind like TeamSnap — OAuth echo events/roster. Don’t rebuild SE |
| **Interoperate?** | Yes when club grants GraphQL OAuth |
| **Preflight** | Real OAuth2 + GraphQL |
| **Readiness** | Integration-ready for SE clubs · park behind TeamSnap |

### 8. SportsRecruits — School · Me (recruiting video module)
| | |
|---|---|
| **Why better inside Dualis** | Alone = another recruiting app (overlaps NCSA). Inside Ice = highlight pointer on School/Me if household already lives there |
| **Alone weak** | Redundant with NCSA for many; US-weighted |
| **Module shape** | Partner deeplink/echo — their library, Dualis face |
| **Interoperate?** | Via their integrator program (video vendors already do) |
| **Preflight** | Partner contact; no free athlete OAuth found |
| **Readiness** | Partner-ask · NCSA first |

### 9. TeamLinkt — Seat (registration receipt module)
| | |
|---|---|
| **Why better inside Dualis** | Alone = org registrar tool. Inside Ice = optional “season registered / HCR#” echo on Seat — not a second Spordle |
| **Alone weak** | Athlete doesn’t open TeamLinkt weekly |
| **Module shape** | Org-side interoperability; household sees Dualis face receipt only if cite exists |
| **Interoperate?** | Private HCR org link — Dualis not in that loop today |
| **Preflight** | No consumer API |
| **Readiness** | Watch · no Apps Bound |

### 10. BenchApp — Game (adaptive only)
| | |
|---|---|
| **Why better inside Dualis** | Only if a seat’s team is BenchApp-native — then RSVP/schedule echo into Game beats living in BenchApp alone |
| **Alone weak** | Adult/beer-league gravity; overlaps TeamSnap for AAA |
| **Module shape** | Adaptive bind if detected — never rebuild |
| **Interoperate?** | No public API → deeplink/known-state until partner |
| **Readiness** | Demote for Ont AAA |

---

## Own-module / metric even if weak interop

If a service **won’t** interoperate (no API/embed/paired path): still allowed as **portal module/metric** — deeplink + Dualis chrome around *their* job — never a Dualis rebuild of their design. Examples: HockeyDB search, NCSA chip, HKY-IQ homework pointer pending license.

---

## Parked (low integration factor for Ont AAA Ice)

| Vendor | Why |
|---|---|
| **Instat** | Hudl-class elite — demote with Hudl; don’t rebuild |
| **FieldLevel** | Absorbed into SportsEngine — use SE module if needed |
| **RAMP** | Org CMS — not athlete module |
| **Scoreholio** | Weak AAA hockey job inside Ice |
| **Quanthockey** | Thin metric; deeplink only if cited |

---

## Eng micro tasks (integration-factor order)

1. `Tape/Me · Sportlogiq PA · paste door` — their meter → measured_tape on seat  
2. `Me · EP · partner API` — ops key; seat id + peer strip (not EP clone)  
3. `Game · OMHA/SportsHeadz · cite echo` — paint only; Dualis >> board  
4. `School · NCSA · cite harden` — public bio module; grades known-state locked  
5. `Me · HockeyDB · deeplink metric` — keep empty default; no scrape  

---

*No deploy. No rebuild. No token asks. Their service · Dualis face.*
