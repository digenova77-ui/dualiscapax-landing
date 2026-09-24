# FACTORY DIRECTIVE: DUALISCAPAX LANDING WEBSITE ASSET DEPLOYMENT & HOUSEKEEPING GUARDRAIL

**Document Control ID:** `ED-DIR-20260923-WEBSITE-DEPLOY-V1` **Classification:** FACTORY BULLETIN BOARD DROP · PRODUCTION DEPLOYMENT DIRECTIVE · SYSTEM OF RECORD **Operating Entity:** DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7 · OBCA \#100089211) **Authority:** Operator Sovereign Directive (David John Di Genova · ORCID: 0009-0005-6291-8508) **Target Surface:** `dualiscapax.ai` / `digenova77-ui/dualiscapax-landing` (Cloudflare Pages) **Timestamp:** 2026-09-23T22:18:00-04:00 (2026-09-24 02:18:00 UTC)

---

## 1\. Objective & Mandate

This bulletin board drop instructs the factory swarm, GitHub Actions pipeline, and deployment watchers to execute a clean update of the live `dualiscapax-landing` project on Cloudflare Pages, ensuring that the actual updated front-end website files (`index.html`, assets, and structure) are deployed instead of empty housekeeping receipts.

## 2\. Mandatory Operational Rules

1. **Explicit Asset Inclusion:** All commits targeting production deployment must contain the verified front-end assets and `index.html` within the root / `cf-pages` directory. Zero empty housekeeping commits (`chore(factory): honest tick receipt`) may trigger production builds without accompanying static assets.  
2. **Housekeeping Guardrail (`[skip ci]`):** All automated factory health checks, heartbeats, and tick receipts must append `[skip ci]` to their commit headers to prevent unintended edge deployment overrides.  
3. **5-Stage Pipeline Alignment:** Maintain strict alignment across Source (`main`), Build (`dist_candidate`), Deploy Target (GitHub Actions runner), Cloudflare Project (`dualiscapax-landing`), and Live Domain (`https://dualiscapax.ai`).

---

*Sealed under DCLM Layer \[0\] Law Floor (TRUTH\_OR\_NOTHING).*