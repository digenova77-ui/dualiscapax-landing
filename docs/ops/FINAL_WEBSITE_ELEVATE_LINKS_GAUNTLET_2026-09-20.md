# FINAL — Website elevate + links + freeze gauntlet
**When:** 2026-09-20 ~21:55–22:05 ET (America/Toronto)  
**Apex tip in:** `283b959af90f6e70ad6236044f52dc58a1376ac4` TipSeal SUCCESS 35552408222 (mini Iris orbs)  
**Repo:** digenova77-ui/dualiscapax-landing · branch work: `factory/elevate-dead-hrefs-2026-09-20`  
**Freeze:** PRODUCTION FREEZE — no pay gates opened · invent PE forbidden · executor TipSeal = NO (parent TipSeals)

---

## A) Website elevate (narrow remediable HIT)

| Plate | Issue | Fix | Park honesty |
|-------|-------|-----|--------------|
| `cf-pages/access-layers.html` | Nav/doors → `processor.html` `fuel-law.html` `law.html` `own-processor.html` `gateway-law.html` (Absolute 404) | → `payments.html` `fuel.html` `gates.html` `consideration.html` `gates.html`; FX door labeled checkout parked | Yes |
| `cf-pages/curtain.html` | Nav → `world.html` `ca.html` (404) | → `sectors.html` `schools.html` | Yes |
| `cf-pages/payments.html` | CTA → `research/access.html` (404) | → `access-layers.html` | Yes |

**Style inconsistency (main doors):** index=`lander.css`; look/faq/bind/why=`theme.css`±glass; pay=`styles.css`; payments/donate=IBM Plex+Inter+glass; gates=mini-guide only. **Not remediated** — full CSS unify is not narrow tip HIT (PARK for Desk Web Wordage).

**Security/function:** No CHECKOUT_OPEN thaw; no donate_open thaw; no Stripe URL invent; CSP/_headers unchanged.

---

## B) Dead links + looping pages — EXACT table

### Live curl Absolute (pretty URLs) — 2026-09-20 ET

| Path | Code | Redirects | Notes |
|------|------|-----------|-------|
| `/` + 50 stem plates (`/access`…`/why`) | 200 | 0 | Clean pretty serve |
| `/leagues` | 200 | 1 → `/ohf` | Alias OK (308 then 200) |
| `/easthill` `/grade2` | 200 | 1 → `/rte/easthill/` | Alias OK |
| `/teacher` `/teachers` `/hpedsb` `/alcdsb` `/limestone` | 200 | 1 → `/rte/boards/` | Alias OK |
| `/rtesimadclm` | 200 | 1 → `/rtesimadclm/manifold` | Alias OK |
| `/buy.html` `/index.html` `/pay-thanks.html` | 308 → pretty | 1 | CF Pages stem strip — **not a loop** |
| `/pay-thanks` | 200 | 0 | Live thanks plate |
| `/pay/thanks` `/pay/thanks/` | **404** JSON `no-route` | 0 | Worker owns `/pay/*`; `_redirects` 200→pay-thanks.html **does not apply**. Tip `thanks: "/pay-thanks.html"`. **No tip hrefs** to `/pay/thanks`. Residual = worker-route (PARK / non–cf-pages). |
| `/bind/medical` `/medical/bind` | **404** HTML | 0 | **No loop** (prior class fixed). No tip hrefs. |
| `/processor` `/fuel-law` `/law` `/own-processor` `/gateway-law` `/world` `/ca` `/research/access` `/for-people` `/founding` `/hub` `/av/test` | **404** | 0 | Dead targets; main-door hrefs remapped above where present |

### Loop probe (max 6 hops, no-follow chain)

**Zero 308/301 loops found.** Single-hop pretty aliases only. Prior `/bind/medical` loop class: **absent**.

### Tip href graph (cf-pages/**)

- HTML plates: 118 · internal href refs: ~1040  
- Main-door remediable dead: **3 plates / 8 hrefs** (fixed this pass)  
- Residual dead (not main-door / peel / nested ai): `_peel-backup/*` relative orphans; `ai/*` → for-people/founding/hub/law; `av/storyboard` → `/av/test`; brand svg miss — **PARK** (low signal / not Absolute main doors)

---

## C) Freeze gauntlet — reconfirm

| Check | Result | Cite |
|-------|--------|------|
| `checkout_open` | **false** | Live fulfill health: `"checkout_open":false` · `"stripe_process_state":"PARKED_UNTIL_BIND_CONTINUE"` · `grant_path_gated_by_checkout_open:true` @ `dualiscapax-stripe-fulfill-v2.digenova77.workers.dev` |
| Tip pay flags | **closed** | `payments-config.js`: `stripe_enabled:false` `donate_open:false` `jacket_open:false`; `buy-catalog.js` `open:false` |
| Donate park | **parked** | `donate.html` lede + panel; donate-rails stub while `donate_open!==true` |
| Advertise A1–A10 | **not advertised live** | `factory/sandbox/COIN_SECURITY.md` A1–A10 are attack vectors; Absolute pay plates say Checkout closed; no `buy.stripe.com` / ownerMint on live pay doors |
| Iris seats | **live on tip** | mic=`getUserMedia` (`iris-av.js`/`iris-sensors.js`); TTS=`speechSynthesis`; cascade chip on `iris.html`; orb=`iris-dock-orb`/`presence-orb.js`; page-aware=`iris-page-hook.js` + `?path=`; mini-orbs=`iris-mini-guide` on hard plates (apex #36) |
| Egg1 / Egg7 | **OPEN cite-only** | Egg1 substrate = historical version promote (`EGG7` doc + `RESIDUAL_R2_VERSION_RETENTION.md`); Egg7 tip-blind Pages residual OPEN — **not closed this pass** |
| GRANT_OFFBAND desk | **feasible / not inventing PE** | Fulfill GRANT path gated by CHECKOUT_OPEN; off-band = operator/manual desk only — see Factory census |
| Remediable HIT | **3 plates fixed** (prefer 0 next pass) | No pay thaw |

---

## Tip mutate

| Field | Value |
|-------|-------|
| tip mutate | **Y** (cf-pages HTML only) |
| tip_sha | `74e7669a42813c1ece1a02fb987f9eb55f3ae594` (PR #37 squash merge; **parent TipSeal needed**) |
| TipSeal | **parent only** — executor did **not** TipSeal |
| PATH_ALLOWLIST | `cf-pages/**` only |

