# DualisCapax Inc. — Master Production Web Gateway & DCCP Sovereign Portal

[![Security & Invariants](https://github.com/digenova77-ui/dualiscapax-landing/actions/workflows/security.yml/badge.svg)](https://github.com/digenova77-ui/dualiscapax-landing/actions/workflows/security.yml)
[![Deploy GitHub Pages](https://github.com/digenova77-ui/dualiscapax-landing/actions/workflows/deploy.yml/badge.svg)](https://github.com/digenova77-ui/dualiscapax-landing/actions/workflows/deploy.yml)

**Live Surface:** [https://dualiscapax.ai](https://dualiscapax.ai)  
**Document Control ID:** ED-DEPLOY-20260831-ENCYCLOPEDIA-V1  
**Operating Entity:** DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7)  
**Governance Framework:** Dualis & Unity Framework (v0.40-Public) / DCLM Law Floor  

---

## Production invariants (locked)

- Access sales: **CLOSED** (`research/payment-links.production.json` → `open: false`).
- LEDGER-EARNED: CAD $0.
- LEDGER-PLEDGED: CAD $0.
- Zero secret keys in client / public directories: no `sk_live_`, no `whsec_`.
- DCLM Layer [0] Law Floor: `NO_FORCE`, `HOST_SAFE`, `CLEANUP_FIRST`, `TRUTH_OR_NOTHING`.

## Deploy

GitHub Pages deploys from `main` via `.github/workflows/deploy.yml` and serves `https://dualiscapax.ai` (CNAME).

Cloudflare Workers (`workers-live`, `stripe-fulfill-v2`) require operator-set repository secrets. They cannot be minted from git or chat:

1. Repo **Settings → Secrets and variables → Actions**
2. Add `CLOUDFLARE_API_TOKEN` (Workers + D1 edit)
3. Add `CLOUDFLARE_ACCOUNT_ID`
4. Optional: `D1_DATABASE_ID`, `STRIPE_WEBHOOK_SECRET`, `XAI_API_KEY`
5. Re-run workflow `workers-live`

Never paste those values into source, issues, or chat.
