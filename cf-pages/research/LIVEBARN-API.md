# LiveBarn API / OAuth research — DualisCapax Ice Tape hub

**Date:** 2026-09-12 (America/Toronto)  
**Product:** DualisCapax.ai ice portal (Ontario AAA)  
**Question:** Can Dualis create a LiveBarn app like TeamSnap (Client ID/Secret + redirect URI), or is access partner-only / no public API?

---

## Verdict (structured)

| Field | Value |
|---|---|
| **has_public_api** | **no** |
| **has_oauth** | **no** |
| **self_serve_app_registration** | **no** (unlike TeamSnap `auth.teamsnap.com/oauth/applications`) |
| **partner_path** | **yes / unclear details** — venue + content partnerships exist; no public partner-API docs |
| **recommended Dualis path** | **session/login deep-link bind today** + **partner ask** (do not invent OAuth like TeamSnap) |

---

## official_urls

| URL | What it is | API/OAuth? |
|---|---|---|
| https://www.livebarn.com/ | Marketing / product home | No |
| https://www.livebarn.com/faqs | Consumer FAQ (accounts, VOD, Live Tagging, Player Analysis) | No API/OAuth mention |
| https://www.livebarn.com/help-center | Support topics + contact instructions | Support via Profile → Contact Us |
| https://www.livebarn.com/pricing | Subscription plans | No |
| https://www.livebarn.com/venue-owners | Venue B2B pitch (install, revenue share) | No developer API |
| https://www.livebarn.com/venue-demo-request | Venue demo / sales form | Contact path for venues |
| https://www.livebarn.com/suggest-a-venue | Suggest venue → demo form | No |
| https://www.livebarn.com/partners | Partners page (appears unfinished / placeholder copy as of fetch) | No API docs |
| https://help.daysmartrecreation.com/en/articles/9301327-livebarn-integration | DaySmart Dash ↔ LiveBarn | Promo-code / subscribe links in emails only |
| https://www.icehockeysystems.com/blog/ihs-news/ihs-partners-livebarn | IHS content partnership (2022) | Download/upload workflow described; not a public API |

**Probed and not useful as docs portals:**

- `developers.livebarn.com`, `api.livebarn.com`, `docs.livebarn.com` — no resolvable public developer portal (DNS/hosts not serving official API docs as of 2026-09-12).
- `https://www.livebarn.com/login` — 404 on HubSpot marketing site (login lives in the app/product surface, not a documented OAuth authorize URL).

**No official OpenAPI, OAuth authorize/token URLs, Client ID registration UI, or “create an application” flow found.**

---

## What exists today (confirmed vs speculation)

### Confirmed (official / partner pages)

1. **Consumer product only for third parties:** email signup + password, paid subscription, web + iOS/Android/tvOS apps. FAQ documents email/password login, device limits, VOD ~30 days, clip share (30s), Live Tagging, Player Analysis (Sportlogiq).
2. **No public developer portal** in FAQs, Help Center, Venue Owners, Pricing, or Partners.
3. **Facility software integration (DaySmart Dash):** append LiveBarn **promo code** and subscribe links to reminder emails — not video/media API access.
4. **Named content partnerships** (e.g. Ice Hockey Systems): members download LiveBarn clips/segments and upload into partner libraries; Live Tagging links; not a self-serve OAuth app model.
5. **Ontario league blackouts / partner surfaces** called out in FAQ (OMHA, GTHL, etc.) — rights are venue/league controlled; relevant to Dualis deep links (some surfaces may be blocked).
6. **Support for API access requests:** logged-in Profile → Contact Us; venue sales via Venue Demo Request; Sales & Partnerships exists as a company function (no published “API partner portal”).

### Speculation / unofficial only (do not ship)

Community GitHub clients (`shauntarves/livebarn`, `bmorton/go-livebarn`, forks) claim a private “LiveBarn 2.0” media API reached by **inspecting browser traffic**, using **username/password + user UUID** and/or **session access_token + lb_uuid**. These are reverse-engineered, break when LiveBarn changes, and violate Dualis partner-ask policy (“never reverse-engineer subscriber APIs”). **Do not document endpoints as Dualis integration surface.**

### Login / SSO

- Official FAQ describes **email verification code + password** account creation and email/password login.
- No official docs for third-party OAuth, SSO as an IdP for Dualis, or “Sign in with LiveBarn.”
- Not “SSO-only” for end users — classic credential login. Also not “OAuth for apps.”

---

## Compare briefly to Hudl (also in Dualis tape pipe)

| | LiveBarn | Hudl (core youth video) | TeamSnap (schedule) |
|---|---|---|---|
| Public self-serve OAuth app | **No** | **No** (core video / Focus) | **Yes** (`auth.teamsnap.com`) |
| Public media/library API | **No** | **No** for core library | APIv3 + scopes |
| Elite / adjacent APIs | Sportlogiq Player Analysis is a LiveBarn *product feature*, not a Dualis-facing API | Wyscout, StatsBomb, Hudl IQ GraphQL (licensed, not youth tape default) | N/A |
| Dualis today | Login / deep-link bind + partner ask | Login / deep-link bind + partner ask | Wire OAuth like TEAMSNAP-OAUTH.md |

**Bottom line:** LiveBarn is closer to **Hudl core video** than to TeamSnap. Do not expect a Client ID/Secret form tomorrow.

---

## what_user_can_do_today (concrete)

1. **Do not try to “create a LiveBarn OAuth app.”** There is no TeamSnap-style developer console to mint Client ID/Secret + redirect URI.
2. **Keep Apps bind as login / deep-link only** — open LiveBarn login / venue-search / VOD surfaces the athlete’s family already uses; Dualis stores **pointers + clocks**, not CDN media.
3. **Send the LiveBarn partner ask** already drafted in `PARTNER-ASK-HOCKEY-CONNECTORS.md` §2 (read surfaces under subscriber consent; media window metadata; deep link back into LiveBarn player). Use Profile → Contact Us and/or Sales & Partnerships / venue-demo style outreach reframed as **software partner**, not venue install.
4. **Optional UX bridges that stay ToS-safe:** paste venue name + surface + start time; open LiveBarn search; accept 30s share links / Live Tagging email links / Player Analysis order IDs as **manual** inputs — never scrape private APIs.
5. **Parallel Hudl the same way** for coach clips; keep TeamSnap as the only self-serve OAuth seat/schedule pipe.

---

## recommended Dualis path

**Primary:** **Login / session deep-link bind only** (current Apps bind) until a sanctioned partner API exists.  
**Secondary:** **Partner ask** for OAuth-or-B2B read of surfaces + time-window pointers (mirror TeamSnap UX *after* LiveBarn grants credentials — do not fake the flow).  
**Reject:** reverse-engineered media clients, storing subscriber passwords, redistributing VOD.

Concrete bind path for Ice Tape hub:

```
TeamSnap OAuth (schedule seats)  →  Dualis game docket
        ↓
LiveBarn deep-link bind (venue + surface + start)  →  pointer only
        ↓  [if partner API ever granted]
LiveBarn OAuth/partner token  →  list surfaces + window URLs under user sub
        ↓
optional Hudl deep-link / partner read for coach tags
```

Until partner grant: mark `livebarn_bind: "login_deeplink"`, `livebarn_oauth: false`.

---

## blockers / unknowns

- Whether LiveBarn will ever expose a **third-party media API** (IHS/DaySmart suggest partnerships are content/promo, not open platforms).
- Exact contact for **software** partnerships vs venue sales (Help Center sales phone on page looked placeholder; Profile Contact Us is the documented subscriber path).
- ToS stance on wrap-tier / Dualis covering a LiveBarn sub (already flagged in partner ask).
- Ontario **LEAGUE PARTNER GAMES ONLY** / blackout surfaces — deep links may fail even with a sub.
- Whether Sportlogiq Player Analysis Hub has any partner export Dualis could use (not published as public API).
- Unofficial “v2 media API” shape — **unknown/unstable; out of scope**.

---

## short summary (3–5 sentences for the user)

LiveBarn does **not** offer a public developer API or TeamSnap-style OAuth app registration (no Client ID/Secret portal, no official authorize/token docs). Official integrations today are partner-mediated promo/content links (e.g. DaySmart email codes, IHS download-and-upload), not a third-party media API. Login is email/password on LiveBarn’s own apps/site — not SSO-for-apps. For Dualis Ice Tape, keep the Apps bind as **login/deep-link only**, and pursue a **partner ask** for sanctioned read access; do not reverse-engineer private endpoints. Hudl’s core youth video path is similarly closed (elite Wyscout/StatsBomb/IQ APIs exist but are not the youth tape pipe), so both tape vendors stay partner-or-deeplink until granted.

---

## Sources checked (2026-09-12)

WebSearch: LiveBarn API / developer / OAuth / partner / embed / third-party 2025–2026; developers.livebarn / api.livebarn; SSO; Hudl public API.  
WebFetch: livebarn.com FAQs, Help Center, Pricing, Venue Owners, Partners, Venue Demo Request; DaySmart LiveBarn integration; IHS partnership post.  
DNS/HTTP probe: developers / api / docs.livebarn.com (no public docs portal); www.livebarn.com/login → 404.  
Internal: `TEAMSNAP-OAUTH.md`, `PARTNER-ASK-HOCKEY-CONNECTORS.md`, `SEC01-UNIFY-TAPEPIPE.md`.

**Do not invent endpoints.** None are published by LiveBarn for third-party apps.
