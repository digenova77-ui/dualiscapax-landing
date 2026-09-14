# Ice portal vendor binds — Dualis integration scour

**Audience:** Chief of Staff  
**Date:** 2026-09-14 (America/Toronto)  
**Scope:** HOW each bind integrates with Dualis (**echo / embed / paired**) — not handoff links.  
**Sources (repo, never invented):** `cf-pages/js/ice-portal.js` `BINDS` + Tape/Me/School/Apps/Go; `research/tape/LIVEBARN-SESSION-EPIPHANY.md`; `research/SEC01-UNIFY-TAPEPIPE.md`; `research/SEC01-SPORTLOGIQ.md`; `cf-pages/research/PARTNER-ASK-HOCKEY-CONNECTORS.md`; `cf-pages/research/UNIFIED-LOGIN-PASSKEY.md`; `research/ops/TEAMSNAP-BIND-DCLM-2026-09-14.md`.  
**Public web (2025–2026 briefs):** LiveBarn (no public embed/API; promo-link partner only); Hudl hockey (no public video API; Wyscout/IQ = football/elite later); Fitbit Web API `activity` scope + Google Health API migration (legacy Fitbit API turn-down ~Sep 2026); Google Classroom (API for coursework/grades — not a bare iframe); GameSheet (public **iframe embeds** on gamesheetstats.com; no documented public REST for partners — SportsHeadz-class B2B score extract is sales-mediated; unofficial WebUI SDKs exist and are **forbidden**).

**Do not deploy. Do not ask for API tokens.**

---

## Login law (canonical order)

| Priority | Mode | Meaning |
|---|---|---|
| **1 · Echo** | Data lands on Dualis faces | Scoreboard, fuel tiles, GPA/assignments, schedule, clocks — Dualis chrome owns the UI; vendor is a cite |
| **2 · Embed** | Vendor UI inside Dualis chrome | iframe / in-hole player when CSP + framing allow (team cam / Falcon-class) |
| **3 · Paired** | Dualis session + second window | When CSP/`X-Frame-Options` blocks iframe: Dualis stays Tab 1 (playground); vendor login/stream in paired tab |
| **4 · Kick-out** | Last resort only | Bare `target=_blank` with no Dualis session chrome — **only when** echo/embed/paired cannot deliver the job |

**Bind once on-device like a seat.** Login change → soft-fail until rebind (local `dc.ice.binds.*` + proof receipts; TeamSnap token revoke clears oauth how). Dualis never stores vendor passwords. Passkey handshake is identity-critical for TeamSnap/Spordle; LiveBarn/Hudl are soft.

---

## Matrix — BINDS + School/Go surfaces

| Bind | Dualis face | Today (honest) | Integration path we prepare for | What Bound means | Kick-out only when |
|---|---|---|---|---|---|
| **TeamSnap** | Seat · Game · Go · Apps | **Echo (+ OAuth path live):** APIv3 OAuth self-serve; token on-device; schedule/me cache paints Game + Go rink. Passkey handshake if mark-bound without token. Full-page OAuth navigates away (weakness: Dualis chrome lost until callback). | **Echo first:** roster, RSVP, events → Game hub / Go maps. Prefer same-origin redirect + seal `#seat` before heavy schedule pull. Paired OAuth tab later if TeamSnap allows return without replace. | `oauth` (token) or `handshake`/`attested` on this phone; seat claim sealed | Never as primary — schedule must echo onto Game/Go. Kick-out login URL only as fallback open before OAuth |
| **Spordle / HCR** | Seat · Apps | **Attest / handshake only.** Login link to My Account. No partner verify API yet. Identity-critical passkey handshake on “I signed in.” | **Echo:** read-only verify — account email ↔ HCR member X after consent. Prefer over TeamSnap for Ontario AAA seat proof. Never write registry. | `handshake` (or attested) = UV-signed local receipt, **not** Spordle session proof | Kick-out Spordle dashboard only until partner verify lands; after grant, never kick-out for identity |
| **GameSheet** | Tape scoreboard · Game league panes · Apps | **No live pull.** UI shells await cite; `dc.ice.gamesheet_live` local echo key; **never paste**. Public product = season iframe embeds (gamesheetstats.com) — possible **embed** for standings/box display, not a Dualis-owned API. No public REST docs; B2B score extract is partner/sales. | **Echo preferred:** sanctioned league-scoped score API (SportsHeadz-class: League URL + Division IDs → completed games/box). Optional webhook on final whistle. **Embed** GameSheet stats iframes into Tape/Game chrome if season ID known and framing allowed. | Bound = consent to pull / season ID on device — **not** pasted scores | Kick-out Teams app **only** if league has no GameSheet and no embed path; never “paste into Dualis” |
| **LiveBarn** | Tape | **Paired Dualis session (shipped doctrine).** Families pay LB sub; Dualis IS the session (scoreboard + ice chrome); LB opens paired window. CSP iframe deny accepted. Stream URL from TeamSnap Notes or saved hole. Soft bind (`deeplink` / attested). No Dualis CDN. | **Paired remains primary** until partner media API. Prepare partner OAuth → surface list + media window **pointer** under their sub; Sportlogiq PA shift IDs optional ($14.95 their meter). Never reverse-engineer subscriber APIs. Embed only if LB ever allowlists Dualis origin (unlikely; do not wait). | Bound = known hole / deeplink / soft attest on this phone; watch still requires **their** sub | Kick-out bare LB site **only** if Dualis Tape chrome cannot open (broken shell) — product law says that is failure, not design |
| **Hudl** | Tape | **Paired / soft deeplink.** Opens Hudl logins in named window; bind `deeplink`. No hockey public video API (2026: Instat↔Sportscode is their internal product; Wyscout Data API / Hudl IQ GraphQL = football/elite, not youth Leaf default). | **Echo pointers:** playlist/clip IDs + tag labels the seat already can see → Tape coach strip; deep link into Hudl for playback (**paired**). Partner ask for core library read. Do not claim “Hudl included.” IQ/AmFB later jacket, not SEC-01 Leaf. | Bound = soft deeplink / attested; optional OAuth later | Kick-out Hudl.com only when no pointer and coach must use their app raw — after partner grant, prefer echo+paired |
| **Workout (Fitbit / Google Health)** | Me | **Login links + mark bound → land Me.** No activity pull yet. Dualis never invents workout log. | **Echo:** Fitbit Web API daily summary (`activity` scope → `GET /1/user/-/activities/date/{date}.json`); prepare **Google Health API** migration (legacy Fitbit API turn-down ~Sep 2026). Fuel tiles on Me. Soft-fail on login change until rebind. | Bound = on-device attest; later OAuth token vaulted under passkey | Kick-out Fitbit/Google login only for consent bootstrap — data must echo to Me, never live in their tab as the product |
| **Nutrition (MFP / Cronometer)** | Me | **Login links + mark bound → land Me.** MFP partner API historically closed to new consumer apps; Cronometer no public consumer API (per BINDS job text). Never invent meal plan. | **Echo when/if partner opens:** macros → Me fuel tiles. Until then: bind/login first, Dualis fuel environment only. | Bound = on-device attest that user has their food app | Kick-out food-app login for account creation only; product stays Me fuel face |
| **Classroom (School apps)** | School | **Handoff tile today** (`classroom.google.com`). GPA/transcript = on-device claim + photo/file echo; NCSA chips locked where cited. “Letter marks · bind later if board allows.” | **Echo via Classroom API** (courseWork / studentSubmissions) for assignments + assigned grades the student can see — **not** iframe-of-Classroom as primary (Classroom is not a general embed target for gradebooks). Overall course GPA often **not** API-readable as a single field — compute or keep claimed GPA echo. PowerSchool: board-specific; often no public student API → paired portal or claim+transcript photo. | Future Bound = OAuth student scopes on device | Kick-out Classroom/PowerSchool only when board blocks API and family must check homework in their portal — Dualis still owns GPA claim + transcript echo |
| **Go stays (Airbnb)** | Go · Cal | **On-device stay echoes** (`dc.ice.stays`) — paste reservation URL / dates; never invent Dom stays. Airbnb search helper links. Not a BINDS vendor. | Stay as **echo** onto Go trip card + Cal green days. No Airbnb partner API assumed. Seed from TeamSnap away / cited tourney. | “Stay on this phone” ≠ vendor Bound | Kick-out Airbnb trips page only to copy reservation — Confirm stays back on Dualis |

---

## Prepare for Dualis — doctrine

Surfaces that **must receive the data** (vendors serve Dualis faces; Dualis does not become their CDN):

| Dualis surface | Must receive | From |
|---|---|---|
| **Tape scoreboard** | Live/final score, goal ticker (jersey + assists), period — cite only | GameSheet echo (or watch); never paste |
| **Tape playground** | Dualis chrome + stream hole (embed) **or** paired LB/Hudl window | LiveBarn / team cam / Hudl pointer |
| **Me fuel tiles** | Activity summary, HR if scoped, nutrition macros when available | Fitbit → Google Health; food apps if partner |
| **School GPA / assignments** | Claimed/verified GPA, transcript photo, homework list | On-device claim + Classroom API later; PowerSchool if board allows |
| **Game scores / schedule** | Next puck, practices, league panes when cited | TeamSnap OAuth cache; GameSheet/OMHA cites — never invent |
| **Go stays** | Away trip lodging + Maps rink — stays on-device | User stay echo + TeamSnap/OMHA away location |

### Doctrine bullets

1. **Echo > embed > paired > kick-out.** Handoff links are scaffolding, not the product.
2. **Bind once like a seat** (`dc.ice.binds.{id}`). Identity-critical (TeamSnap/Spordle) require passkey handshake until OAuth upgrades `how`. Soft vendors may attest. Login change → soft-fail tile until rebind — do not silent-clear clocks.
3. **LiveBarn:** Dualis session + paired window; families pay LB sub to watch *through* the portal chrome — Dualis does not host clips.
4. **Hudl hockey:** historically no public video API; prepare pointer+paired; IQ is AmFB/football later.
5. **GameSheet:** never paste; prepare sanctioned pull + optional stats iframe embed.
6. **Do not scrape** LiveBarn Hub, Hudl Focus, or GameSheet WebUI. Partner asks live in `PARTNER-ASK-HOCKEY-CONNECTORS.md`.
7. **SEC-01 pipe story unchanged:** TeamSnap who showed up → LiveBarn tape → Hudl clip / Sportlogiq shift cut → Dualis names the leftover. Dualis stores pointers + clocks, not video.

---

## Public web snapshot (honest, 2026-09)

| Vendor | Public developer surface | Implication for Dualis |
|---|---|---|
| LiveBarn | Venue/promo integrations; no documented iframe allowlist or consumer media API | Paired session is correct product; partner media API remains ask |
| Hudl | Wyscout Data API / StatsBomb (football); Instat+Sportscode internal; no youth hockey video API | Deeplink/paired + partner ask; IQ later jacket |
| Fitbit | Web API with `activity` (and related) scopes; migrating to Google Health API | Prepare echo to Me; plan Google OAuth re-consent before Fitbit API sunset |
| Google Classroom | Full Classroom API; add-on iframes are for *add-ons*, not wrapping Classroom itself | Echo assignments/grades via API; not “embed Classroom” |
| GameSheet | Official **website iframe** embeds; partner score extract exists for some platforms; no public OpenAPI | Embed stats iframes OK; score **echo** needs partner path — forbid unofficial scrapers |

---

## File map (for operators)

| Path | Role |
|---|---|
| `cf-pages/js/ice-portal.js` | `BINDS[]`, Tape paired LB, Me/School/Apps/Go |
| `cf-pages/js/dc-passkey.js` | Handshake vs soft attest; identityCritical |
| `cf-pages/js/teamsnap-oauth.js` | Self-serve OAuth seat/schedule |
| `research/tape/LIVEBARN-SESSION-EPIPHANY.md` | Paired-session law |
| `research/SEC01-UNIFY-TAPEPIPE.md` | Who owns what |
| `cf-pages/research/PARTNER-ASK-HOCKEY-CONNECTORS.md` | Sanctioned asks |
| `cf-pages/research/UNIFIED-LOGIN-PASSKEY.md` | Login phases |

---

*End of scour. No deploy. No tokens requested.*
