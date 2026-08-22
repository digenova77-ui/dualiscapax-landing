# Residual ring — A watches B watches C

## Human idea (your frame)
Never get sick of the job: at a checkpoint, C becomes the new A, and the ring rotates.

## Residual craft (what we can actually automate)

| Role | Job | Tool surface |
|------|-----|----------------|
| **A — Build** | Normalize packs, hash content, commit artifacts on push | GitHub Actions on `push` |
| **B — Verify** | Diff critical paths vs previous successful run; fail on silent drift of law/claim surfaces | Actions + `git diff` + SHA manifest |
| **C — Observe** | Record deploy target status (Pages/CF when wired); compare published SHA to repo SHA | Actions HTTP check + optional CF API later |

After a **green** checkpoint: promote C’s observed baseline → A’s next baseline (rotate). That is the eternal ring *as process*, not as unbound agent will.

## What is NOT automated without human +1
- Residual **law** text that changes meaning
- Medical claims / cure language
- Open-market coin / securities language
- eFuse / Seal amendments

Those stay dual-column and human-gated.

## Pattern we already hit too often (deeper log reading)
1. Push to GitHub → **www still serves different tree** (CF not bound to this repo)
2. Manual upload / Workers vs Pages confusion
3. Re-explaining the same deploy path

**Better way:** one repo (`dualiscapax-landing`) → Actions residual-ring → Cloudflare Pages **production** project bound to `main` only. Observe step fails loudly if live HTML hash ≠ repo critical-file manifest.

## Ring rotation rule
```
baseline_N   = manifest SHA from last green C
A builds     → artifacts + manifest_N+1
B verifies   → diff baseline_N vs manifest_N+1 (allowlisted paths may change; law paths require CHANGELOG)
C observes   → fetch live URL; if mismatch, open issue / fail job
green        → baseline_N+1 becomes new A baseline
```

## Cloudflare
No CF token in this agent session by default. Observe step uses public GET of configured URL. When CF API token is available, add deploy status poll (optional secret `CF_API_TOKEN`).

## Agents (Grok team)
We are not a 24/7 daemon. The **ring runs on GitHub** on every push and on a daily schedule so the job does not depend on chat being open. When we return in chat, we read the latest Actions run = last ring position.
