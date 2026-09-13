# Hudl API / OAuth research — DualisCapax Ice Tape hub

**Date:** 2026-09-12 (America/Toronto)  
**Product:** DualisCapax.ai ice portal (Ontario AAA)  
**Question:** Does Hudl offer a public developer API and/or OAuth for third-party apps (TeamSnap-style Client ID/Secret + redirect), or is access partner-only?

---

## Verdict (structured)

| Field | Value |
|---|---|
| **has_public_api** | **no** for core Hudl video / Hudl Focus / youth library (Dualis default). **yes (licensed)** for elite adjacent products: Wyscout Data API, StatsBomb Aggregated/Data Hub, Hudl IQ GraphQL — not youth tape OAuth. |
| **has_oauth** | **no** — no self-serve third-party OAuth app registration found (unlike TeamSnap `auth.teamsnap.com/oauth/applications`). Product logins use platform credentials / API keys / Basic Auth on licensed data APIs; front-end IQ mentions Auth0 short-lived tokens for UI, not partner OAuth. |
| **self_serve_app_registration** | **no** |
| **partner_path** | **yes / sales-mediated** — B2B integrations for core video are sales-mediated; contact Hudl sales/support with use case. |
| **recommended Dualis path** | **session/login deep-link bind today** + **partner ask** for core library metadata (same class as LiveBarn). **Do not** invent TeamSnap-style OAuth. |

---

## official_urls

| URL | What it is | API/OAuth? |
|---|---|---|
| https://www.hudl.com/ | Marketing / product home | No developer portal |
| https://www.hudl.com/products | Product catalog | No |
| https://www.hudl.com/products/focus | Hudl Focus (AI capture cameras) | Product page; no public API docs |
| https://www.hudl.com/products/assist/ice-hockey | Hudl Assist ice hockey | Sales/contact form; CSV export for Gold/Platinum teams (UI), not partner OAuth |
| https://www.hudl.com/en_gb/products/wyscout/data-api | Wyscout Data API marketing | Licensed soccer data packs; API access described commercially |
| https://apidocs.wyscout.com/ | Wyscout OpenAPI docs | **Yes** — licensed Wyscout Data API (Basic Auth per Wyscout support) |
| https://www.hudl.com/products/statsbomb | StatsBomb product | Licensed analytics |
| https://data.statsbomb.com/ | StatsBomb Data Hub | Credentialed API access for customers (username/password separate from platform login) |
| https://support.hudl.com/ | Hudl Support | Product how-tos; embed codes; Assist CSV export; IQ/StatsBomb API articles for eligible customers |
| https://support.hudl.com/s/article/embed-your-highlight-reel-hudl-v3 | Embed highlight reel | Manual share → EMBED code (not OAuth) |
| https://support.hudl.com/s/article/retrieve-individual-broadcast-embed-code-or-links-hudl-tv | Hudl TV broadcast embed | Manual embed from vCloud (not OAuth) |
| https://support.hudl.com/s/article/export-reports-to-csv | Export reports CSV | Gold/Platinum teams; UI download only |
| https://support.hudl.com/s/article/wyscout-api | Wyscout API (support) | Points to apidocs.wyscout.com |
| https://github.com/hudl | Hudl GitHub org | Engineering libraries (Mjolnir, Fargo, etc.) — **not** product SDKs for video library |
| https://hudl.github.io/ | Open-source site | Same — not product API |
| https://www.hudl.com/contact | Contact | Sales / partner path |

**Probed hosts (2026-09-12):**

| Host | Result |
|---|---|
| `https://developer.hudl.com/` | HTTP 200 but serves **main marketing homepage** (`canonical` → `https://www.hudl.com/`). **Not** a developer portal / app console. |
| `https://api.hudl.com/` | HTTP 403 `MissingAuthenticationTokenException` (API Gateway). Authenticated host exists; **no public docs, OpenAPI, or “create app” UI**. **Do not invent endpoints.** |
| `https://apidocs.wyscout.com/` | Live Wyscout API docs (licensed product). |

**No official** core-Hudl OpenAPI, OAuth authorize/token URLs, Client ID registration UI, or “create an application” flow found for youth video / Focus / Assist.

---

## What exists today (confirmed)

### Core Hudl video / Focus / Assist (Dualis Ice Tape relevance)

1. **No public developer API** for core team video library, uploads, playlists, Focus camera feeds, or Assist hockey stats as a partner-facing REST/OAuth surface.
2. **B2B integrations are sales-mediated** (consistent with APIs.io / api-evangelist Hudl index and absence of a developer console).
3. **Embed (manual, not API):** coaches/athletes can copy embed codes for highlight reels; orgs can embed Hudl TV broadcast players from vCloud. Useful for deep-link / iframe pointers Dualis already models — **not** app OAuth.
4. **Assist ice hockey:** professional tagging + reports tied to clips; contact sales. Eligible Gold/Platinum teams can **Export → Download CSV** from Reports in the UI — file export, not a third-party OAuth API.
5. **Login bind only** for Dualis today: user already has Hudl access; Dualis can deep-link into Hudl for clips the seat can already see. No “Sign in with Hudl” IdP docs for third-party apps found.

### Elite / adjacent licensed APIs (not youth tape default)

These are **real** but **wrong product class** for Ontario AAA Leaf ice tape:

| Product | Auth model (documented) | Docs / entry |
|---|---|---|
| Wyscout Data API | Basic Auth (username:password credentials) | https://apidocs.wyscout.com/ ; marketing https://www.hudl.com/en_gb/products/wyscout/data-api |
| StatsBomb Aggregated / Data Hub | Username/password credentials (separate from platform login) | https://data.statsbomb.com/ ; support articles under Hudl Support |
| Hudl IQ (AmFB) | API key header (`Authorization: apikey …`) + version header; UI uses Auth0 short-lived tokens | Hudl Support “Use Hudl IQ's API” (GraphQL host documented for customers) |
| Hudl GSL Mapping (preview GraphQL) | `X-Hudl-ApiToken` for customers with CSM-issued access | Appears in Hudl Support StatsBomb/Wyscout tooling articles — **customer success mediated** |

**Do not invent or list unverified core-video endpoints.** Elite APIs require commercial licenses and are soccer/AmFB analytics — not substitute for Focus/library OAuth.

---

## what_user_can_do_today

| Action | Available? |
|---|---|
| Create a third-party Hudl OAuth app (TeamSnap-style) | **No** |
| Self-serve register Client ID / redirect URI for core video | **No** |
| Partner / sales ask for B2B library read | **Yes** — contact Hudl |
| Login / deep-link bind for users who already have Hudl | **Yes** (product UX; no partner API required) |
| Manual embed of highlights / Hudl TV | **Yes** (share UI) |
| Buy Wyscout / StatsBomb / IQ data APIs | **Yes if licensed** — wrong surface for youth ice tape |
| Scrape Hudl WebUI / reverse-engineer Focus uploads | **Forbidden** (Dualis partner-ask policy) |

---

## recommended Dualis path vs TeamSnap-style OAuth

| | TeamSnap | Hudl (core) |
|---|---|---|
| Self-serve OAuth apps | **Yes** — `auth.teamsnap.com/oauth/applications` | **No** |
| Dualis pattern | Wire Client ID/Secret + callback (`TEAMSNAP-OAUTH.md`) | **Login/deep-link bind + partner ask** (`PARTNER-ASK-HOCKEY-CONNECTORS.md` §3) |
| What to ship now | OAuth schedule/roster pipe | Pointers + clocks into Hudl URLs the seat already can open; optional Assist CSV ingest only if a team staff exports with consent — not a substitute for API |
| What not to ship | N/A | Fake OAuth; invented `api.hudl.com` routes; Focus scrape |

**Ask Hudl for:** partner / integrations read of team library metadata, playlist + clip IDs, tag labels, share URLs the Unity ID seat already can see; optional Assist hockey fields if sold; sandbox team; MSA / rate limits / attribution. Dualis never hosts minor named clips; never claims “Hudl included.”

---

## blockers

1. No public core-video API or OAuth app console.
2. `developer.hudl.com` is marketing alias, not an app registry.
3. `api.hudl.com` requires auth tokens Dualis does not have; undocumented for third parties.
4. Elite APIs (Wyscout/StatsBomb/IQ) are licensed, sport-mismatched for AAA hockey tape, and still not OAuth-for-apps.
5. Assist CSV is plan-gated (Gold/Platinum) and manual — not partner webhook/API.
6. Rights / org admin control library visibility; Dualis must stay consent-bound and deep-link only.

---

## User summary (3–5 sentences)

Hudl does **not** offer a TeamSnap-style public OAuth app for third parties on core video, Focus, or Assist. What is public today is product login, manual embed codes, and (for some paid tiers) CSV report export — plus separate **licensed** soccer/AmFB data APIs under Wyscout, StatsBomb, and Hudl IQ that Dualis should not treat as the youth ice tape pipe. `developer.hudl.com` is not a developer portal; `api.hudl.com` is an authenticated gateway without public docs. Dualis should keep **login / deep-link bind** for Hudl tape pointers and pursue a **sales-mediated partner ask** for sanctioned library metadata — same posture as LiveBarn, not TeamSnap.

---

## Sources checked (non-exhaustive)

- https://www.hudl.com/ , /products, /products/focus, /products/assist/ice-hockey, /en_gb/products/wyscout/data-api, /contact  
- https://developer.hudl.com/ (resolved to marketing home)  
- https://api.hudl.com/ (403 auth required)  
- https://apidocs.wyscout.com/  
- https://support.hudl.com/ (embed, Assist CSV, Wyscout API, StatsBomb/IQ articles)  
- https://github.com/hudl , https://hudl.github.io/  
- https://apis.io/providers/hudl/ and raw apis.yml (api-evangelist index, 2026)  
- Dualis notes: `LIVEBARN-API.md`, `TEAMSNAP-OAUTH.md`, `PARTNER-ASK-HOCKEY-CONNECTORS.md`

---

## User confirmation — 2026-09-12

**User checked with Hudl:** they do **not** appear to have an API for hockey.

The StatsBomb / Hudl IQ surface the user probed (`hudl-iq-api.statsbomb.com`) returned:

```xml
<error>
  <title>401 Unauthorized</title>
  <description>Cannot authenticate the request</description>
</error>
```

That endpoint is **American football (Hudl IQ)** credentials territory — **not** a youth hockey library / Focus / Assist tape API for Dualis Ice.

**Dualis implication:** keep Apps → Hudl as login/deep-link bind + sales-mediated partner ask for core library read. Do not route Tape through StatsBomb / Hudl IQ.

