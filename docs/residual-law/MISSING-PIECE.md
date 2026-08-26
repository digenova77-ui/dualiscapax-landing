# Missing Piece — Found in the Repo + Live Probe

**Status:** 26 Aug 2026 12:09 PM EDT  
**Method:** Same as cosmos — put every residual in the same buckets, smash affinities, look where the fault actually lives.

---

## The missing piece

**We were treating “www 522” as “the website is down / agents cannot ship testables.”**  
**That was the wrong place.**

The triad was already locked in `DOMAIN.md`:

```
[1] REPO   → github.com/digenova77-ui/dualiscapax-landing
[2] ORIGIN → digenova77-ui.github.io/dualiscapax-landing/
[3] EDGE   → dualiscapax.ai / www / .com  (pointers only)
```

**Probe (this session):**

| Surface | HTTP | Content residual |
|---------|------|------------------|
| ORIGIN index | **200** | DualisCapax · Jump-start · residual lines |
| ORIGIN `.../ms.html` | **200** | **ED-RES-NEURO-MS-001** live |
| EDGE apex `dualiscapax.ai` | **200** | Same modern tree · **MS live** |
| EDGE apex `.../ms.html` | **200** | MS journal testable |
| EDGE `www.dualiscapax.ai` | **522** | Origin unreachable **for www only** |
| `dualiscapax.com` | **200** | “Coming Soon” — **different** residual |

**Missing piece:** Test affinity belongs on **ORIGIN + apex**, not on `www`.  
Build affinity (push `main`) already reaches humans at:

- https://digenova77-ui.github.io/dualiscapax-landing/  
- https://dualiscapax.ai/  
- https://dualiscapax.ai/research/healthcare/medical/neurological/ms.html  

`www` is a **single EDGE DNS residual** (documented since 2026-08-24 in DOMAIN.md). Fixing it is Cloudflare `www` CNAME → `digenova77-ui.github.io` (DNS only) — **not** a rebuild, not OIDC, not agent keys.

---

## Smash into the same buckets

| Bucket / residual | What we thought | What is true |
|-------------------|-----------------|--------------|
| **A path residual** | Leaves trapped until CF fixed | Leaves **already testable** on origin + apex |
| **B bond residual** | Blocked on live | Spine pages ship to same origin/apex |
| **C structure residual** | Catalog offline | Repo + origin serve structure |
| **Deploy residual (OIDC)** | Required to test | Helps Worker/Pages automation; **not** required to read MS on apex today |
| **Secret residual** | Need keys to “make site work” | Keys never fix www 522; DNS does |
| **Edge residual** | Whole site down | **Only www** 522; apex healthy |
| **Coherence residual** | “Can’t from repositories” | **Answer was in DOMAIN.md + CUTOVER.md + probe** |

---

## Affinity chain (cosmos method)

```
REPO main  ──writes──►  ORIGIN github.io  ──already──►  human test
                │
                └──apex dualiscapax.ai ──already──►  human test (MS 200)
                │
                └──www ──522──►  EDGE-only fault (CNAME/proxy)
                │
                └──.com ──Coming Soon──►  other project residual (do not confuse)
```

OIDC + CF token silo affinity attaches to **Worker deploy / Pages bind automation**, not to “can we see the leaf.”

---

## What was wrong about “can’t”

Saying the test loop is broken because www returns 522 was **looking at the wrong node of the triad**.  
The repo already said: *Verify content first on ORIGIN. Never debug content through the EDGE. 522 on www = fix DNS, do not rebuild the site.*

**Found by looking in the right place:** DOMAIN.md · CUTOVER.md · RESIDUAL-RING.md · live probe on origin + apex + www + .com.

---

## Operating rule from this point

1. **Ship to `main`** (A/B/C buckets).  
2. **Test on ORIGIN or apex** — not www until DNS fixed.  
3. **www 522** — operator Cloudflare only; one CNAME residual.  
4. **OIDC** — keep for keyless/silo deploy of Worker when enabled.  
5. **Do not** rebuild HTML to heal EDGE.

**Test MS now:**  
https://dualiscapax.ai/research/healthcare/medical/neurological/ms.html  
https://digenova77-ui.github.io/dualiscapax-landing/research/healthcare/medical/neurological/ms.html

**Last update:** 26 Aug 2026 — Missing piece locked.
