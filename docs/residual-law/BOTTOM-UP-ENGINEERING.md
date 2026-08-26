# Bottom-Up Engineering — From Observed Stack, Not Vendor Theater

**Status:** 26 Aug 2026  
**Method:** Reverse-engineer **what the live system already does** (repo · origin · edge · Actions) and assemble DualisCapax needs from those residual facts + **public** platform contracts.  
**Hard limit:** Do **not** violate GitHub / Cloudflare / Google / Stripe TOS. Connected OAuth and account use **are** agreement. “We never agreed” is not a residual path.

Cross-ref: DOMAIN.md · REPO-CAPABILITIES · CANT-LOOP · MISSING-PIECE · OIDC · SECRETS-ISOLATION · AGENT-BUCKETS

---

## 1. What “their site” actually is (observed, not guessed)

| Layer | Observed residual | Serves DualisCapax how |
|-------|-------------------|-------------------------|
| **REPO** `dualiscapax-landing` | Source of truth; agents can write | Content, law, encyclopedia, OIDC workflows |
| **ORIGIN** `digenova77-ui.github.io/dualiscapax-landing/` | **200** · serves `main` including MS | **Primary test surface** |
| **EDGE apex** `dualiscapax.ai` | **200** · same modern tree as origin | Public brand URL for test/share |
| **EDGE www** | **522** only | DNS residual — not a rebuild |
| **EDGE .com** | “Coming Soon” | **Different** project residual — do not merge in mind |
| **pages-build-deployment** | **Active** workflow | Static publish already automated on push |
| **residual-ring** | Runs on push + schedule | Build → verify → observe without chat open |
| **oidc-auth** | Triggerable via API | Short-lived deploy trust when vars set |

**Reverse-engineered publish contract (public GitHub Pages behavior):**  
`push main` → Pages build → origin updates → apex follows when DNS points at Pages.  
No secret required for static HTML. That is enough for encyclopedia + Bond surfaces.

---

## 2. Bottom-up stack DualisCapax needs (assembled from residual units)

```
L0  Law residual     Mission · DCLM · Fuel · Bond · CANT-LOOP · domain constraints
L1  Content residual Path leaves (A) · Bond spine (B) · Structure catalog (C)
L2  Git residual     create_or_update_file · branches · PRs · secret scan content
L3  CI residual      residual-ring · oidc-auth · pages-build-deployment
L4  Origin residual  github.io  (always verify here first)
L5  Edge residual    apex healthy · www operator DNS · .com separate
L6  Depth residual   Worker + wrangler secret put (XAI etc.) — silo only
L7  Money residual   Stripe Payment Links public; secrets never in repo/chat
```

Engineer **up** from L0–L5 before treating L6–L7 as blockers. Static DualisCapax **already works** at L4–L5 apex.

---

## 3. Affordances that serve us (legitimate)

| Affordance | Source | Use |
|------------|--------|-----|
| Static host on push | GitHub Pages (documented + active workflow) | Ship all Open residual journals |
| Custom domain via CNAME file | Repo `CNAME` = `dualiscapax.ai` | Apex binding |
| workflow_dispatch + OIDC JWT | GitHub Actions public model | Keyless cloud when WIF/CF configured |
| Public GET of origin/apex | HTTP | residual-ring C observe |
| Connected GitHub tools | User-linked OAuth | Write/trigger/list without pasting PATs in chat |
| Google Drive connected | User-linked | Operator docs off-repo |
| DOMAIN.md triad | **Our** prior lock | Stop re-diagnosing edge as content |

These are **in** the product contracts we operate under — not loopholes outside TOS.

---

## 4. Explicitly out of bounds

| Action | Why out |
|--------|---------|
| Scrape or automate past Cloudflare/GitHub auth walls | TOS + abuse residual |
| Use undocumented private APIs to mutate DNS without account API token **you** issue | Unauthorized |
| Claim “never agreed to TOS” while using the service | False residual |
| Put competitor medical content verbatim under our brand | Copyright / honesty residual |
| Cure claims / securities language from “reverse engineered” marketing | Our own residual law forbids |

Bottom-up means **our** law + **public** contracts + **observed** behavior — not parasitic access.

---

## 5. Engineer what we need next (ordered by residual leverage)

1. **Keep shipping L1 on main** — test on origin + apex (proven).  
2. **Treat residual-ring + Pages as the deploy backbone** — already running; trigger OIDC when Worker needed.  
3. **Operator one-shot:** www CNAME → `digenova77-ui.github.io` DNS-only (DOMAIN.md) — closes 522 loop.  
4. **Operator optional:** CF/GCP secrets in Actions silo — enables oidc-auth cloud jobs.  
5. **Depth API:** `server/worker.js` + `wrangler secret put` — never frontend key.  
6. **Do not** rebuild HTML to fix EDGE; do not wait on www to densify encyclopedia.

---

## 6. One line

**Reverse-engineer the triad we already locked: repo writes, Pages publishes, origin and apex serve, www is DNS-only residual — build DualisCapax upward from that public contract under residual law, never by stepping outside TOS.**

**Last update:** 26 Aug 2026
