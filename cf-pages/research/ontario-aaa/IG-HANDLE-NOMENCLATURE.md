# Ontario AAA Instagram handle nomenclature

**Scope:** Public handle discovery + profile existence only. No private scraping. No invented roster players.  
**Date:** 2026-09-12 (America/Toronto)  
**Focus:** Quinte Red Devils (QRD) + sample OMHA U16 East/West clubs.

---

## Dualis notes already on disk

Existing IG guidance lives **outside** this folder’s prior files, but is duplicated under research:

| Path | What it says about IG |
|---|---|
| `research/ONTARIO-AAA-IDENTITY.md` | Worked pattern `{org}_aaa_{birth_year}` — example `@quintereddevils_aaa_2011`. Birth-year handles track **cohort**, not age label. Roster-reveal highlights = verify source. |
| `research/ontario-aaa/ROSTER-POPULATION.md` | Lists “Instagram birth-year account roster reveal” as holy grail source (no handle catalog). |
| `research/ontario-aaa/*.md` (other) | No prior dedicated IG handle catalog (this file is new). |

**Takeaway:** Dualis already assumed the QRD 2011 pattern; this pass **confirms** that handle exists publicly and maps sibling patterns across OMHA.

---

## Pattern summary (observed)

Ontario AAA Instagrams cluster into **three layers**:

| Layer | Role | Typical patterns | Example |
|---|---|---|---|
| **Club / org main** | Association news, tryouts, board | `{club}`, `{club}hockey`, `{club}_official`, `{zone}aaa`, `{club}omha` | `@quintereddevils_official`, `@whitbyhockey`, `@barrieaaa`, `@oakvillerangershockeyclub`, `@minor_petes_aaa` |
| **Birth-year cohort team** | Tracks one birth year as it ages (U14→U15→U16…) | `{slug}_aaa_{YYYY}`, `{slug}_{YYYY}`, `{nickname}{YYYY}aaa`, `{YY}{slug}`, `{YY}_aaa_{slug}` | `@quintereddevils_aaa_2011`, `@quintereddevils_2010`, `@wildcats2010aaa`, `@08oakvillerangers`, `@12_aaa_petes` |
| **Age-label / season team** | Named by U-age (less stable across seasons) | `{slug}_u16`, `{slug}u16aaa`, `{slug}_u18` | `@petes_u18` (seen tagged from org); search hits like `*u16aaa` |
| **Parent / AA / fan** | Parent-managed or non-AAA | `{YY}{town}aa`, fan film accounts | `@09whitbyaa` (bio: Parent Managed, AA) |

### Naming rules of thumb

1. **Prefer birth year in the handle** over U-age for Dualis cohort binding (`birth_year=2011` for U16 in 2026–27).
2. Org mains rarely hold roster reveals; **cohort accounts** do.
3. Same cohort keeps the handle while bio age label updates (e.g. Whitby `@wildcats2010aaa` bio: “2025/2026 U16 AAA”).
4. Two-digit year prefixes (`08…`, `09…`, `12_…`) are common for older/younger bands.
5. Underscores vary: `_aaa_2011` vs `_2010` vs `2010aaa` glued — try all.
6. Club site footers / Linktree often point to **org main only**; birth-year accounts are found via search + tags from the org.

---

## Search recipe (reuse)

For any OMHA club + birth year `YYYY` / short `YY`:

```
WebSearch / IG search strings (public):
  1. "{Full Club Name}" Instagram AAA
  2. "{slug}_aaa_{YYYY}"   e.g. quintereddevils_aaa_2011
  3. "{slug}_{YYYY}"       e.g. quintereddevils_2010
  4. "{nickname}{YYYY}aaa" e.g. wildcats2010aaa
  5. "{YY}{slug}"          e.g. 08oakvillerangers
  6. "{YY}_aaa_{slug}"     e.g. 12_aaa_petes
  7. "{slug}u16aaa" / "{slug}_u16" / "{slug}_u18"
  8. site:instagram.com "{Club}" U16 AAA
  9. Club website footer / Linktree → org handle → check Tagged / linked cohort accounts

Verify (public profile page only):
  - Display name + bio mention club / AAA / birth year or current U-age
  - Optional: club URL or Linktree in bio → confidence ↑
  - Do NOT scrape followers, DMs, or private accounts
  - Do NOT invent player names from guesses
```

**Slug cheat sheet (OMHA sample):**

| Club | Likely slugs |
|---|---|
| Quinte Red Devils | `quintereddevils`, `qrd`, `qrdaaa` |
| Whitby Wildcats | `whitbyhockey`, `wildcats`, `whitbywildcats` |
| Oakville Rangers | `oakvillerangers`, `oakvillerangershockeyclub` |
| Peterborough Petes (minor AAA) | `petes`, `minor_petes_aaa`, `aaa_petes` |
| Barrie Jr Colts | `barrieaaa`, `barriecolts` |
| Halton Hurricanes | `haltonhurricanes`, `hhcanes` |
| Ajax Pickering Raiders | `apraiders`, `ajaxpickering`, `apr` |
| Greater Kingston Gaels | `gkhockey`, `kingstonjrgaels`, `gaels` |
| York Simcoe Express | `ysexpress`, `yorksimcoe`, `yse` |

---

## Quinte Red Devils (QRD) — verified / candidates

| Handle | URL | Appears to be | Confidence | Notes |
|---|---|---|---|---|
| `@quintereddevils_official` | https://www.instagram.com/quintereddevils_official/ | **Club main** | **High** | Bio: Quinte Regional Minor Hockey Association; Linktree `linktr.ee/quintereddevils`; highlights for board / season rosters |
| `@quintereddevils_aaa_2011` | https://www.instagram.com/quintereddevils_aaa_2011/ | **Birth-year team (2011)** | **High** | Public title: `QRD_AAA_2011`; Dualis worked example for U16 2026–27 cohort |
| `@quintereddevils_2010` | https://www.instagram.com/quintereddevils_2010/ | **Birth-year team (2010)** | **High** | Title: `2010 Quinte Red Devils`; tagged from org account |
| `@quintereddevils_2015` | https://www.instagram.com/quintereddevils_2015/ | **Birth-year team (2015)** | **Medium** | Indexed public reel branded QRD; fetch often login-walled |
| `@quintereddevils` | https://www.instagram.com/quintereddevils/ | Possible org/alias | **Low–Med** | Search cites it; not fully bio-verified this pass |
| `qrd2011` / `quintreddevils` / `quinteaaa` | — | — | **Not confirmed** | Pattern trials; do not treat as official without profile proof |

**X/Twitter (context only):** `@QRD_AAA` appears as org Twitter (not IG).

**Club site:** https://quintedevils.com/ — schedules use age+year labels e.g. `U16 (2011)`.

---

## Sample other OMHA clubs

### Whitby Wildcats

| Handle | URL | Type | Confidence | Notes |
|---|---|---|---|---|
| `@whitbyhockey` | https://www.instagram.com/whitbyhockey/ | Club main | **High** | Bio: official Whitby Minor Hockey; whitbyhockey.com |
| `@wildcats2010aaa` | https://www.instagram.com/wildcats2010aaa/ | Birth-year AAA (2010) | **High** | Bio: “2025/2026 U16 AAA”; season highlights |
| `@09whitbyaa` | https://www.instagram.com/09whitbyaa/ | Parent AA (not AAA) | **High** | Bio: Parent Managed — **do not** treat as AAA U16 |

Pattern: `{nickname}{YYYY}aaa` and `{YY}{town}aa`.

### Oakville Rangers (OMHA West)

| Handle | URL | Type | Confidence | Notes |
|---|---|---|---|---|
| `@oakvillerangershockeyclub` | https://www.instagram.com/oakvillerangershockeyclub/ | Club main | **High** | Verified badge; oakvillerangers.ca / lnk.bio |
| `@08oakvillerangers` | https://www.instagram.com/08oakvillerangers/ | Birth-year / U16 AAA cohort | **High** | Display: Oakville Rangers U16 AAA; bio: U16 AAA Hockey team based in Oakville |

Pattern: `{YY}{clubslug}` for cohort; full org name for main.

### Peterborough Petes (minor AAA)

| Handle | URL | Type | Confidence | Notes |
|---|---|---|---|---|
| `@minor_petes_aaa` | https://www.instagram.com/minor_petes_aaa/ | Org AAA main | **High** | Bio: Peterborough AAA Hockey Organization; peterboroughminorpetes.ca |
| `@12_aaa_petes` | https://www.instagram.com/12_aaa_petes/ | Birth-year (2012) / U15 | **High** | Bio: Home of the … 2012 U15 AAA Jr Petes; jersey-number posts |
| `@petes_u18` | https://www.instagram.com/petes_u18/ | Age-label U18 team | **Medium** | Seen tagged from `@minor_petes_aaa` (profile fetch flaky) |

Pattern: `{YY}_aaa_{slug}` and `{slug}_u{age}`.

### Barrie Jr Colts

| Handle | URL | Type | Confidence | Notes |
|---|---|---|---|---|
| `@barrieaaa` | https://www.instagram.com/barrieaaa/ | Zone / club main | **High** | Bio: Instagram account for Barrie AAA zone; barrieaaazone.ca linked from club sitemap |

Birth-year Barrie handles not confirmed this pass (candidates like `barriecolts2011aaa` remain **unverified**).

### Halton Hurricanes

| Handle | URL | Type | Confidence | Notes |
|---|---|---|---|---|
| Club site | https://haltonhurricanes.ca/ | — | — | No reliable IG link in public homepage fetch |
| Search candidates | `haltonhurricanesomha`, `u16hhcanes`, `haltonhurricanes2011` | Mixed | **Low** | Appeared in search synthesis only — **re-verify before use** |

### Ajax Pickering Raiders / Kingston Gaels / York Simcoe Express

| Club | Status this pass |
|---|---|
| Ajax Pickering Raiders | Search suggested `@apraidersu18`-style names — **not profile-verified** here |
| Greater Kingston Gaels | Mentions of `@gkhockey` in secondary sources — **not profile-verified** |
| York Simcoe Express | Mentions of `@ysexpress` / `@yse_u18` — **not profile-verified** |

Apply the search recipe; promote only after public profile title/bio match.

---

## Confidence rubric (Dualis)

| Level | Criteria |
|---|---|
| **High** | Public profile title/bio matches club + AAA/cohort; preferably club URL or Linktree |
| **Medium** | Indexed public post/reel or org tag naming the handle; bio incomplete / login wall |
| **Low** | Pattern guess or search-engine synthesis only |

---

## Operator cautions

- Birth-year IG ≠ current season roster until a **current** roster-reveal / club page confirms it (`STALE_COHORT` trap — see `ONTARIO-AAA-IDENTITY.md`).
- AA / parent accounts (e.g. `@09whitbyaa`) are easy false positives.
- Never publish named minors from IG on the public Dualis lander; IG is a **verify** source behind Unity bind / org consent.
- This document lists **handles only** — no player names invented or scraped into a roster.

---

## Quick wins for Dualis U16 2026–27 (2011 birth year)

| Priority | Handle | Why |
|---|---|---|
| 1 | `@quintereddevils_aaa_2011` | Confirmed 2011 cohort account |
| 2 | `@quintereddevils_official` | Org hub / Linktree / season roster highlights |
| 3 | Parallel: try `{slug}_aaa_2011` / `{slug}2011aaa` / `11_{slug}` for each OMHA peer |

