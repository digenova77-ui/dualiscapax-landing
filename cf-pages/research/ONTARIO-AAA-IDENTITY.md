# Ontario AAA identity — teams, birth years, roster bind

Document: ED-COM-20260912-ON-AAA-ID-V3  
Season focus: **2026–2027**  
Ages in scope: **U10 → U18** AAA  
Leagues: **OMHA · GTHL · HEO · ALLIANCE**  
Binds: Spordle/HCR proof (preferred AAA) · TeamSnap seat/email map · Unity ID passphrase/passkey (device vault) · HOCKEY-SEAT-SPLIT · PARTNER-ASK

Law floor: **No named-minor PII on the public lander.** Roster names live only behind a bound Unity ID (guardian or 18+) or an org seat with consent. Dualis models **de-ID seats**; Instagram is a *verify source*, not a public dump.

---

## 1. Why bind exists (anti-hijack)

People must not “own” another athlete’s environment (modules, calendar, connectors, clocks).

### Claim UX (locked) — V3

1. **Pick team** — league → age → team from the season registry.  
2. **Pick yourself** — select your **name** on that team’s current roster list.  
3. **Prove it** with hockey-world identity already on file (name-pick alone fails closed):

| Priority | Proof | Why |
|---|---|---|
| **1 · Preferred** | **Spordle / Hockey Canada Registry (HCR)** | Every AAA registrant has an HCR member. Parent **My Account** is email-verified and **linked** to the child (HCR # or name + DOB). Strongest “you are this player” signal in Canadian minor hockey. |
| **2 · Day-one / seat map** | **TeamSnap OAuth email** | Already on the Dualis pipe; member contact email (player or parent) must match the chosen seat. Best self-serve API today. |
| **3 · Fallback** | Magic link / claim code to the **same** Spordle or TeamSnap contact inbox | Still bound to a known address — never freestyle |

4. **Seal Dualis vault** — Unity ID passphrase (+ optional passkey) only after proof.

**Division of labor:** Spordle/HCR = *who you are* nationally. TeamSnap = *which team seat / schedule / family graph* you’re on this season. Use both when available (HCR prove + TeamSnap seat). Until Spordle partner verify exists, TeamSnap email match ships; HCR is the partner-ask upgrade.

| Rule | Meaning |
|---|---|
| **1 seat ↔ 1 Unity ID primary** | Roster slot claimed, not hijacked by browse |
| **Identity proof** | Spordle/HCR preferred; TeamSnap email acceptable |
| **Device vault** | Passphrase + optional passkey after proof |
| **Household share** | Family may view purchased seat; no second unbound player |
| **Org seat** | Models 16–18; staff cannot become a player without that seat’s proof |

Modules unlock only after `unity_id` → `roster_seat_id` is **SETTLED** with proof.

---

## 2. Stable IDs (machine)

```
league_id     = omha | gthl | heo | alliance
season_id     = 2026-2027
age_id        = u10 | u11 | u12 | u13 | u14 | u15 | u16 | u17 | u18
birth_year    = YYYY   # authoritative with age_id for the season
team_slug     = kebab org name (quinte-red-devils)
team_id       = on.aaa.{league}.{team_slug}.{age}.{season}
roster_seat_id= {team_id}.#{jersey}.{pos}   # pos = LW|C|RW|LD|RD|G|F|D …
unity_bind    = hash(unity_id | roster_seat_id | claim_nonce)
```

Example (structure only — not a public name dump):

`on.aaa.omha.quinte-red-devils.u16.2026-2027.#29.LW`

---

## 3. Birth-year matrix — 2026–27 (GTHL / OMHA-aligned)

Age as of **Dec 31, 2026**. Single-year AAA bands (GTHL chart):

| Age | Birth year | Notes |
|---|---|---|
| U10 | 2017 | |
| U11 | 2016 | |
| U12 | 2015 | |
| U13 | 2014 | |
| U14 | 2013 | |
| U15 | 2012 | |
| **U16** | **2011** | User’s worked example band |
| U17 | 2010 | where the league runs it |
| U18 | 2009–2010 | often combined |

**Hard rule:** a seat labeled U16 for 2026–27 **must** carry `birth_year=2011` (or fail verification). Do not pull 2010/2012 names into a U16 roster from last year’s U15/U17 lists.

Instagram birth-year handles (`…_aaa_2011`) track the **cohort**, not the age label. Same IG cohort that was U14 in 2024–25 is **U16 in 2026–27**.

---

## 4. Team catalog (framework — league first)

Teams are the easy layer: publish/maintain a **season team registry** from league approved lists (not Instagram).

### GTHL U16 AAA (2026–27 approved / MHR)
Don Mills Flyers · Jr. Canadiens · Markham Majors · Mississauga Rebels · Mississauga Senators · North York Rangers · Reps · Toronto Marlboros · Toronto Red Wings · Toronto Titans · Toronto Young Nationals · Vaughan Kings

### OMHA U16 AAA (Elite Prospects / OMHA network — verify each season)
Ajax-Pickering Raiders · Barrie Jr. Colts · Burlington Eagles · Central Ontario Wolves · Credit River Capitals · Greater Kingston Gaels · Grey-Bruce Highlanders · Guelph Jr. Gryphons · Halton Hurricanes · Hamilton Steel · Markham Waxers · Niagara North Stars · North Central Predators · North Shore Whitecaps · Oakville Rangers · Peterborough Petes · **Quinte Red Devils** · Southern Tier Admirals · Whitby Wildcats · York-Simcoe Express

### ALLIANCE U16 AAA (2026–27 standings shells)
**East:** Brantford 99ers · Cambridge Jr RedHawks · Huron-Perth Lakers · Kitchener Jr Rangers · Waterloo Wolves  
**West:** Chatham-Kent Cyclones · Elgin-Middlesex Canucks · London Jr Knights · Sarnia-Lambton Jr Sting · Windsor Jr Spitfires

### HEO U16 AAA (prior season core — re-approve 2026–27)
Eastern Ontario Wild · Ottawa Jr. 67s · Ottawa Myers Automotive · Ottawa Valley Titans · Upper Canada Cyclones

Repeat the same `league × age` grid for U10–U18. Seed file shape: `research/ontario-aaa/teams.{season}.json`.

---

## 5. Player / roster depth (hard layer)

### Source priority (current season only)

| Priority | Source | Use |
|---|---|---|
| 1 | **Org claim + TeamSnap / GameSheet** | Canonical when connected |
| 2 | **Official club site roster** for `season` + `birth_year` (e.g. quintedevils.com U16-2011) | Structured |
| 3 | **Team Instagram roster reveal** for that birth-year account | Verify jersey / pos / last-name highlight |
| 4 | Elite Prospects / HockeyDB | Cross-check only — often stale or wrong age band |

### Instagram method (operator playbook)

1. Resolve team IG by pattern: `{org}_aaa_{birth_year}` (worked: `@quintereddevils_aaa_2011`).  
2. Confirm bio age label matches **current** season math (2011 → U16 in 2026–27).  
3. Prefer **roster-reveal highlights** (jersey \| last name cards) over old game posts.  
4. Record: `jersey`, `pos`, `display_last` (org-private), `source_url`, `captured_at`, `season_id`.  
5. Reject rows that only appear on prior-season pages (e.g. “U16-2009” archives).  
6. **Never** publish full named youth rosters on dualiscapax.ai — bind privately.

### Quinte worked example (2026–27)

| Field | Value |
|---|---|
| League | OMHA |
| Team | Quinte Red Devils |
| Age | U16 |
| Birth year | 2011 |
| Org site | quintedevils.com lists **U16 (2011)** staff for current ops |
| IG cohort | `@quintereddevils_aaa_2011` (roster-reveal highlights; bio may still say prior age label until updated — trust **birth year in handle** + season math) |
| Seat claim shape | `…u16.2026-2027.#29.LW` (user-stated household seat) |

Do **not** auto-claim #29 for a stranger: claim code + passphrase/passkey + guardian.

---

## 6. Login flow (product)

```
1. Pick league → age → team (season = current)
2. Show current roster names for that team (from TeamSnap sync / verified pack)
3. User selects their name (jersey + pos shown)
4. “Prove it’s you”
   - Preferred: Spordle/HCR — parent My Account linked to this member (HCR # / name+DOB)
   - Also / until partnered: TeamSnap OAuth — oauth_email ∈ contacts on that roster seat
5. On success: create unity_bind; onboard passphrase (+ optional passkey) seals device vault
6. Modules unlock for that seat only
7. Revoke = disconnect TeamSnap proof and/or burn bind; seat → UNCLAIMED
```

**Worked mental model:** TeamSnap already knows which email belongs to Dom’s seat. Dualis does not invent a new identity — it **reuses** that link so only Dom’s household inbox can claim Dom’s Dualis environment.

Household Leaf: one proven athlete seat; family can view.  
Org Club: models all seats; each athlete still needs TeamSnap proof to personalize their own calendar/modules.

---

## 7. Build order

1. JSON team registry U10–U18 × 4 leagues for 2026–27 (public OK).  
2. Birth-year validator in sport shell / onboard.  
3. Seat claim + Unity bind (reuse contract-bind / passphrase / passkey).  
4. Operator roster ingest tool (IG + club site) → **private** roster pack for org seats.  
5. TeamSnap OAuth later maps members → seats (strongest sanctioned path).

---

## 8. Explicit non-goals

- Scraping Instagram at scale into a public minor database  
- Letting search-by-name alone claim a seat  
- Treating Elite Prospects as season-current truth  
- Org staff impersonating a player login without that seat’s passphrase/passkey

---

## Instagram roster reveals — holy grail for *who’s on the team*

For Ontario AAA, birth-year team Instagrams (e.g. `@quintereddevils_aaa_2011`) with **roster-reveal story highlights** (jersey \| last name \| position \| photo) are the best **public** source for current roster depth and numbers.

| Layer | Job |
|---|---|
| **Instagram reveal** | Who is on the team this season · jersey · pos · face |
| **Spordle / HCR** | Prove the claimer *is* that member |
| **TeamSnap** | Seat / schedule / contact email map |

Operator rule: prefer IG reveal + club site for the season’s `birth_year` handle over Elite Prospects. Re-check after tryouts; do not use prior-season age labels without birth-year math.


---

## Hard fail — stale cohort trap (learned 2026-09-12)

A birth-year list from **two seasons ago** (e.g. Quinte U14-2011 roster on quintedevils.com for 2024–25) is **not** the 2026–27 U16 AAA team. Players leave (example: **Kyler Patterson** → Kingston Gaels marquee, not current QRD).

**Forbidden:** promote prior-season club roster pages as current depth.  
**Required:** season-current Instagram roster reveal, TeamSnap, GameSheet, or the club’s **current season** team page only. Mark anything else `STALE_COHORT` and do not bind seats to it.


See also: `ontario-aaa/ROSTER-POPULATION.md` — locked app population pipeline (path to truth).
