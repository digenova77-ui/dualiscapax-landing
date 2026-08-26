# Secrets Isolation — One Key Capability Per Agent

**Status:** Locked 26 Aug 2026  
**Law:** Keys are residual. Cross-exposure is residual waste.  
**Hard rule:** **Never** put API keys, tokens, or service-account JSON in the repo, in agent chat, or in shared agent context.

Cross-ref: AGENT-BUCKETS · PARALLEL-SERIAL-RECORDS · FUEL-UNIFIED · Bond · money-spine purity

---

## Unify Cloudflare · GitHub · Google — without exposing keys to each other

| Plane | What it holds | Who reads it |
|-------|----------------|--------------|
| **Cloudflare** | Worker secrets, Pages env, DNS API token (dashboard / `wrangler secret`) | Only the Worker runtime or a **single** deploy identity |
| **GitHub** | Actions secrets, deploy keys, fine-grained PATs | Only the workflow or bot identity that needs that secret |
| **Google** | Service accounts, OAuth client secrets, Drive/API keys | Only the SA or OAuth client bound to that job |

**Unification model:** one **control plane** (you / Grok-lead ops), three **secret silos**. Agents never receive a shared bag of all keys. Each agent gets **one capability** — implemented as a scoped credential **you** install in the silo that agent’s job touches, not as a string pasted into chat.

```
                    YOU (operator)
                         |
         +---------------+---------------+
         |               |               |
   Cloudflare silo  GitHub silo    Google silo
         |               |               |
      [runtime]     [Actions/PAT]    [SA / OAuth]
         |               |               |
         +------ no lateral key share ----+
                         |
              Agent A / B / C
         (one capability each — see below)
```

---

## One capability per agent (not a shared god-key)

### Agent A — Path residual (medical leaves)

| Field | Value |
|-------|--------|
| **Needs** | **ONE** write path to ship leaf HTML on `main` |
| **Capability name** | `GITHUB_WRITE_LEAVES` |
| **What it is** | Fine-grained GitHub credential scoped to **Contents: write** on `dualiscapax-landing` only, ideally path-limited by process (A only commits under `research/healthcare/medical/**/\*.html` leaves — never secrets files) |
| **Where it lives** | GitHub Actions secret **or** operator-held PAT used only for A-lane commits — **not** in Cloudflare, **not** in Google |
| **Does not get** | Cloudflare API token · Stripe keys · Google SA · DNS edit |

**A does not need Cloudflare or Google keys** for static residual journal leaves.

---

### Agent B — Bond residual (nav + onboarder spine)

| Field | Value |
|-------|--------|
| **Needs** | **ONE** write path to ship spine HTML on `main` |
| **Capability name** | `GITHUB_WRITE_SPINE` |
| **What it is** | Separate fine-grained GitHub credential (or same repo Contents write but **different secret name / different bot identity**) used only for onboard/payments/corporate/research hub pages |
| **Where it lives** | GitHub silo only |
| **Does not get** | Stripe **secret** keys (public payment links only on client) · Cloudflare global API · Google SA with Drive full access |

**Payments residual:** Stripe **publishable** / Payment Link URLs may appear on the public site. **Secret** Stripe keys stay in Cloudflare Worker secrets or Stripe dashboard — **never** given to Agent B as a chat string, never in `payments.html`.

---

### Agent C — Structure residual (catalog + indexes + law docs)

| Field | Value |
|-------|--------|
| **Needs** | **ONE** write path for catalog/indexes/docs |
| **Capability name** | `GITHUB_WRITE_STRUCTURE` |
| **What it is** | Fine-grained GitHub credential for `research/healthcare/library/**`, `docs/residual-law/**`, stack indexes |
| **Where it lives** | GitHub silo only |
| **Does not get** | Cloudflare API · Google admin · Stripe secret · A/B deploy identities |

---

## Optional third-plane capabilities (operator only — not A/B/C chat)

| Capability | Silo | Purpose |
|------------|------|--------|
| `CF_API_TOKEN` | Cloudflare | Pages/Worker deploy, DNS — **Grok-lead / you only** |
| `CF_WORKER_SECRETS` | Cloudflare runtime | Stripe webhook secret, server-side API — **runtime only**, never agents |
| `GOOGLE_SA_READONLY` | Google | Drive export / Docs read if you later wire automation — **not** shared to A/B/C unless a single job needs it |
| `GH_PAGES_DEPLOY` | GitHub Actions | Built-in `GITHUB_TOKEN` in Actions is enough for Pages; prefer that over a PAT when possible |

Agents A/B/C **do not** receive `CF_*` or `GOOGLE_*` in normal encyclopedia/Bond sprint work.

---

## How you install (operator checklist — values never in git)

1. **GitHub → Settings → Secrets and variables → Actions**  
   - Create three secrets if you use three bot identities: `AGENT_A_GH`, `AGENT_B_GH`, `AGENT_C_GH`  
   - Or one `SITE_CONTENTS_WRITE` used only by a controlled Actions workflow that path-filters by agent lane  
2. **Cloudflare → Workers → Settings → Variables / Secrets**  
   - `wrangler secret put …` for runtime secrets only  
3. **Google Cloud → IAM → Service accounts**  
   - Least privilege; JSON key downloaded once to your secret store — **not** committed, **not** pasted to agents  
4. **Never** paste key material into Grok / Harper / Benjamin / Lucas chat  
5. **Never** commit `.env`, `credentials.json`, or `wrangler.toml` with secrets filled in

---

## Cross-exposure = forbidden residual

| Forbidden | Why |
|-----------|-----|
| One PAT with admin + Cloudflare token + Google SA in one agent prompt | Lateral movement residual |
| Keys in `payments.html` / client JS | Public scrape residual |
| Same secret name reused across A/B/C “for convenience” | Theory smash violation — shared blob |
| Putting keys in this markdown file | Public repo residual |

---

## Unified picture (what “unify” means here)

**Unify the planes under one operator and one residual law.**  
**Do not unify by sharing secrets.**

- One website (`dualiscapax-landing` → Cloudflare Pages / GitHub Pages)  
- One money spine purity (Stripe secret only in Worker if needed)  
- One catalog / Bond / leaf process  
- **Three agent capabilities, three silos, zero lateral key share**

---

## Agent cheat card

| Agent | The ONE capability it needs | Silo |
|-------|----------------------------|------|
| **A** | `GITHUB_WRITE_LEAVES` | GitHub only |
| **B** | `GITHUB_WRITE_SPINE` | GitHub only |
| **C** | `GITHUB_WRITE_STRUCTURE` | GitHub only |
| **You / Grok-lead** | `CF_*` · Worker secrets · optional `GOOGLE_SA_*` | Cloudflare / Google — never injected into A/B/C |

**Last update:** 26 Aug 2026 — Secrets isolation locked. No keys in repo. No keys between agents.
