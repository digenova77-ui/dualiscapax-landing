# DaySmart Recreation (Dash) pricing research — DualisCapax Ice Tape hub

**Date:** 2026-09-12 (America/Toronto)  
**Product:** DualisCapax.ai ice portal (Ontario AAA)  
**Question:** Is DaySmart Recreation purchasable on a plan with visible cost? Does buying it help Dualis get LiveBarn tape?

**Brand note:** DaySmart Recreation is marketed as **Dash** (dashplatform.com / daysmart.com/recreation). Help center remains `help.daysmartrecreation.com`.

---

## Verdict (structured)

| Field | Value |
|---|---|
| **purchasable_self_serve** | **quote_only** — official site pushes **Request a Demo** / sales contact; no public checkout with listed subscription SKUs. Existing customers can add card/ACH in-app for billing (help article), but that is not a self-serve “buy plan X for $Y” storefront. |
| **published_prices** | **Base software subscription: none published** on official DaySmart/Dash marketing pages. **Add-on/service prices published in Dash Help Center only** (see below). Third-party “~$1,188/yr Basic” estimates are **unverified** — do not treat as official. |
| **plan_names** | **Not listed** on official pricing pages (Software Advice: “No plan information available”). Unofficial third-party sites name Basic / Deluxe / Deluxe Growth / Premium — **not confirmed** on daysmart.com or dashplatform.com. |
| **who_it's_for** | **Facility / club / recreation ops software** (ice rinks, multi-sport complexes, parks & rec) — scheduling, registration, POS, memberships, marketing. **Not** an athlete/consumer video app. |
| **helps Dualis get LiveBarn tape?** | **Likely no.** LiveBarn “integration” is **promo-code subscribe links in emails** only — not a video/media API. |

---

## published_prices (exact, with sources)

### Official (Dash Help Center) — published dollar amounts

| Item | Amount | Source |
|---|---|---|
| QuickBooks / Intacct integration add-on | **$100/month** + **$250 setup**; free 30-day trial | https://help.daysmartrecreation.com/en/articles/9300833-quickbooks-intacct-integration |
| Data import services (Support) | **$225/hr** | https://help.daysmartrecreation.com/en/articles/9301097-importing-data |

These are **add-on / professional service** fees, **not** the base Dash/DaySmart Recreation SaaS subscription price.

### Official marketing / review aggregators — no base price

| Source | What it says about price |
|---|---|
| https://www.dashplatform.com/ | Product marketing; CTA to try / demo — **no dollar amounts** |
| https://www.daysmart.com/recreation/solutions/ | “Request a Demo” / 30-min demo — **no price list** |
| https://www.softwareadvice.com/parks-and-recreation/daysmart-recreation-profile/ | “Pricing available upon request”; “No plan information available”; “Custom quote” |
| https://www.getapp.com/recreation-wellness-software/a/daysmart-recreation/ | No pricing info / view pricing plans → quote path |
| https://www.capterra.ca/software/1030372/daysmart-recreation | Starting price: “Not provided by vendor” |

### Unofficial / do not use as Dualis fact

| Source | Claim | Status |
|---|---|---|
| https://pricingnow.com/question/daysmart-recreation-pricing/ | “Basic” ~ **USD 1,188/year** (1 user); plans Basic, Deluxe, Deluxe Growth, Premium | **Third-party estimate only** — not corroborated on DaySmart/Dash official pages as of 2026-09-12. **Do not fabricate or ship as published price.** |

**Sales contacts published:** (800) 881-6515 ext. 2 (help center); DaySmart corporate sales +1 (888) 873-5213 / sales@daysmart.com (daysmart.com).

---

## LiveBarn integration vs tape API

Confirmed official help:

- https://help.daysmartrecreation.com/en/articles/9301327-livebarn-integration  
- https://help.daysmartrecreation.com/en/articles/9882905-integrations-add-ons  

**What it does:** Facility staff enable LiveBarn, paste their **LiveBarn promo code**; event reminder emails (and optional email template variables) append a **subscribe link with that promo**. Requires an existing LiveBarn venue account + hardware.

**What it does not do:** Expose LiveBarn VOD, surfaces, chunks, OAuth, or any media API to DaySmart or to Dualis. Buying Dash does **not** unlock LiveBarn tape for DualisCapax.

See also Dualis `LIVEBARN-API.md`.

---

## Related: Dash has its own API (facility data — not LiveBarn)

DaySmart/Dash customers with **API Key Management** permission can create API keys for a **JSON:API** to query facility objects (reporting, exports, lightweight integrations).

- Docs entry: https://help.daysmartrecreation.com/en/articles/9302111-dash-api  
- Auth: API keys (role-scoped), not TeamSnap-style public OAuth app marketplace.  
- Rate limit note (help): soon 200 req/min/user → HTTP 429.  
- **Relevance to Dualis Ice Tape:** only if a **facility** partners and grants Dualis keys for schedule/registration metadata — still **not** LiveBarn video.

---

## what Dualis should conclude

1. DaySmart/Dash is **B2B facility software**, sold via **demo + quote**.  
2. **No honest public base subscription sticker price** found on official channels.  
3. Only official dollar figures found are **QB/Intacct $100/mo + $250 setup** and **imports $225/hr**.  
4. Purchasing DaySmart **does not** get Dualis LiveBarn tape access; LiveBarn remains a separate venue/consumer stack with promo-email glue only.  
5. For tape: pursue LiveBarn partner ask (see `LIVEBARN-API.md` / partner-ask one-pager), not a DaySmart subscription.

---

## User summary (2–4 sentences)

DaySmart Recreation (now branded **Dash**) is facility management software for rinks and rec centers, sold through **demo and custom quote** — there is **no official published base plan price** on DaySmart/Dash marketing sites (Software Advice/GetApp/Capterra all say upon request). The only **exact official dollars** found are help-center add-ons: QuickBooks/Intacct at **$100/month + $250 setup**, and data imports at **$225/hour**; ignore third-party “~$1,188/yr Basic” claims unless Sales confirms them. Buying DaySmart almost certainly **does not** help Dualis pull LiveBarn tape — the “LiveBarn integration” only appends **promo subscribe links** to emails, not a video API.

---

## Sources checked

- https://www.dashplatform.com/  
- https://www.daysmart.com/ , /recreation/solutions/  
- https://help.daysmartrecreation.com/en/articles/9301327-livebarn-integration  
- https://help.daysmartrecreation.com/en/articles/9882905-integrations-add-ons  
- https://help.daysmartrecreation.com/en/articles/9300833-quickbooks-intacct-integration  
- https://help.daysmartrecreation.com/en/articles/9301097-importing-data  
- https://help.daysmartrecreation.com/en/articles/9302111-dash-api  
- https://help.daysmartrecreation.com/en/articles/10831509-account-payment-method-management  
- https://www.softwareadvice.com/parks-and-recreation/daysmart-recreation-profile/  
- https://www.getapp.com/recreation-wellness-software/a/daysmart-recreation/  
- https://www.capterra.ca/software/1030372/daysmart-recreation  
- https://pricingnow.com/question/daysmart-recreation-pricing/ (unofficial — flagged)
