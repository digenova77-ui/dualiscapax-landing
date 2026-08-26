# Affinity Operating Model — What Is Going On

**Status:** 26 Aug 2026 12:08 PM EDT  
**Purpose:** Smash OIDC + Theory buckets + parallel/serial + secrets isolation + live surface into **one** residual picture.

---

## One sentence

**GitHub `main` is where we can write; Cloudflare edge is where you test; OIDC is how deploy stays keyless; A/B/C buckets are how write residual stays efficient; live 522 means edge↔origin affinity is broken right now.**

---

## Affinity map (what belongs with what)

| Residual unit | Affinity cluster | Who / what |
|---------------|------------------|------------|
| **Path residual** | Medical leaf HTML | Agent A · unique leaf paths |
| **Bond residual** | Onboarder spine + nav | Agent B · spine pages |
| **Structure residual** | Catalog + indexes + law docs | Agent C · indexes/catalog |
| **Deploy residual** | OIDC mint · CF worker · Pages bind | Actions + **you** (not A/B/C chat) |
| **Secret residual** | CF / GH / Google silos | Operator dashboards only |
| **Live residual** | What humans hit at dualiscapax.ai | Edge must serve `main` |
| **Coherence residual** | Lander freeze · conflict assign | Grok-lead |

**Affinity rule:** Do not mix clusters. That is Theory smash. Efficiency = 1.0 only when clusters do not share write blobs.

---

## What actually makes it easier (and for whom)

| Lever | Makes easier for | Still blocked without |
|-------|------------------|------------------------|
| Theory-smash path buckets | Agents (less contention) | Discipline + tool not false-deduping distinct paths |
| Parallel/serial records | Agents + you (predictable order) | Following leaf→index serial |
| SECRETS isolation | You (no key leaks in chat) | You installing secrets in silos |
| **GitHub OIDC workflow** | **You + deploy loop** | `GCP_WIF_*` / `CF_DEPLOY_*` vars+secrets set by you |
| Connected GitHub tool | Grok pushing leaves/docs | Repo permissions; rate limits |
| Encyclopedia catalog | Grassroots read-path | C updating indexes after LEAF-LIVE |
| Bond + C-suite/grassroots unify | Copy affinity | B applying to spine pages |

OIDC does **not** speed leaf writing. It speeds **safe deploy** once you flip the switches.

---

## What is going on right now (probe)

| Surface | Observation |
|---------|-------------|
| `raw.githubusercontent.com/.../main/.../ms.html` | **Present** — MS leaf on `main` |
| `https://www.dualiscapax.ai/` | **HTTP 522** — Cloudflare could not reach origin |
| `.../neurological/ms.html` on live host | **522** — same edge failure |
| OIDC workflow file on `main` | **Committed** — mint job ready; cloud jobs gated on vars |
| Agent parallel writes | Frequent **duplicate-op blocks** even on new paths — process residual |

**Diagnosis:**  
**Build affinity (GitHub) is ahead of edge affinity (Cloudflare).**  
You cannot test major pushes on the public host until 522 is cleared (Pages project bound to this repo `main`, or origin server healthy).

That is why OIDC + CF deploy matter *now*: they are the missing link between “we pushed MS” and “you can click it on dualiscapax.ai.”

---

## Smash: combined operating loop

```
[ A leaf on unique path ]     ─── parallel ────  [ B Bond/nav page ]
         |                                              |
         | LEAF-LIVE (serial)                           |
         v                                              v
[ C catalog + index link ]  ─── structure residual ───────+
         |
         v
[ GitHub main = source of truth ]
         |
         |  OIDC mint (always) + optional CF/GCP jobs
         v
[ Cloudflare edge serves main ]  ←← **MUST be healthy (not 522)**
         |
         v
[ You test on dualiscapax.ai ]
```

**If edge is 522, the whole “push so I can test” loop is broken at the last hop** — independent of how good the leaves are.

---

## What I still cannot do (honest)

1. **Fix Cloudflare 522 from here** without your dashboard (DNS, Pages bind, origin).  
2. **Set** `CLOUDFLARE_API_TOKEN`, WIF provider, or Google SA bindings — only you.  
3. **Guarantee** three agents never false-collide on the GitHub write tool (platform dedup).  
4. **Serve** the site myself — I write git; edge must publish.  
5. **Hold** Stripe/xAI secrets — correct; Worker secrets only.

---

## Highest-leverage next residual (ordered)

1. **Clear live 522** — bind Cloudflare Pages (or origin) to `digenova77-ui/dualiscapax-landing` @ `main`.  
2. **Enable CF deploy job** — secrets + `CF_DEPLOY_ENABLED=true` so Worker/depth API can ship via OIDC-gated workflow token silo.  
3. **Keep A shipping leaves** on unique paths; C links after LEAF-LIVE.  
4. **B Bond/nav** on spine once edge is testable.  
5. Optional **GCP WIF** when Google automation is actually needed.

---

## Affinity one-liner

**OIDC + secret silos + Theory buckets + parallel records only pay off when edge affinity matches git affinity — right now git is green, live is 522, so smash priority is restore Cloudflare↔main, then keep building.**

**Last update:** 26 Aug 2026 — Affinity operating model + live probe.
