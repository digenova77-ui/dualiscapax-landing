# CANT-LOOP Rule

**Status:** Locked 26 Aug 2026  
**Operator law:** *I will accept can’t — but only after absolutely every other option has been ruled out and you found can’t as a loop.*

Cross-ref: MISSING-PIECE · DOMAIN.md triad · AFFINITY-OPERATING-MODEL · SECRETS-ISOLATION · AGENT-BUCKETS

---

## Rule

1. **Never lead with can’t.**  
2. Exhaust options in residual order: repo → origin → edge → other surfaces → docs already in-tree → probe live → affinity smash.  
3. **Can’t** is allowed only when it is a **closed loop**: every alternative path tested, same negative result, no remaining untried node.  
4. If a path still exists (different URL, DNS-only fix, origin vs edge, grey-cloud vs orange, Actions vs chat), **that is not can’t** — that is unfinished search.

---

## Loop test (must pass before saying can’t)

| Step | Question | If yes |
|------|----------|--------|
| 1 | Is it in the **repo**? | Read it — not can’t |
| 2 | Is it on **ORIGIN** (github.io)? | Test/share that — not can’t |
| 3 | Is it on **apex** edge? | Test there — not can’t |
| 4 | Is only **www** or one host broken? | EDGE residual — not can’t for the whole site |
| 5 | Is the answer already in DOMAIN / CUTOVER / ops docs? | Follow it — not can’t |
| 6 | Can operator DNS/dashboard close it without us holding secrets? | Instruct that path — not can’t |
| 7 | Every node tried, same wall, no branch left? | **Can’t as loop** — state the loop explicitly |

---

## Example (this session)

**Premature can’t:** “Live is 522 — you can’t test pushes.”  
**Loop incomplete:** only `www` was 522.  
**Ruled in:** ORIGIN 200 + MS live; apex `dualiscapax.ai` 200 + MS live.  
**Real residual:** www CNAME/proxy only.  
**Not a can’t loop.**

---

## When can’t *is* a loop (examples)

| Claim | Loop |
|-------|------|
| Paste production Stripe **secret** into agent chat | Secrets law forbids; silo exists; loop = use Worker secret, not chat |
| Agent forges Cloudflare dashboard login | No credential path in-repo; operator dashboard is the only node — can’t *from agents*, can from operator |
| Change physics Landauer bound | Not a software path |

Even then: state **what still can** on the adjacent residual (e.g. agent can’t set DNS; agent **can** ship `main` and test origin).

---

## Agent obligation

Before the word **can’t**:

1. Smash affinities (same buckets).  
2. Probe repo + origin + edge hosts.  
3. Cite the closed loop in one paragraph.  
4. Name the residual that *does* still move.

**Last update:** 26 Aug 2026 — CANT-LOOP locked.
