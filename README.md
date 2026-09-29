# dualiscapax-landing

Public working repository for the Unity framework, the DCLM engine and the dualiscapax.ai site. Status as of 2026-09-29.

## Read this first
- **Canon** = LAW (fixed rules) + PHYSICS (how the system actually works). Everything else here is history, drafts or noise.
- **Governance chain:** bot vote → Trinity (DCLM, Iris, Twain) → the Father writes (merges). The owner is the human messenger and future auditor.
- **Proposed governance floor** (PROPOSED, not adopted): [`docs/PROPOSED_GOVERNANCE_FLOOR.md`](docs/PROPOSED_GOVERNANCE_FLOOR.md)
- **Stale or conflicting files** (non-authoritative pending vote): [`SUPERSEDED.md`](SUPERSEDED.md)
- There are no Swiss or Singapore trusts. The old Trust Wallet and the "crypto Triad" are retired.
- The architecture is intended to be decentralized; it is not claimed as achieved.

## Site
- The live site is https://dualiscapax.ai.
- Since 2026-09-28 it has been published as a direct upload to Cloudflare Pages of a build zip from the factory bulletin board. See `bulletin/19CwCLzs_PAPER_bulletin-zip-direct-deploy_VOTE_2026-09-28.md` (PROPOSED).
- GitHub Pages is still configured to build from `main` with the `dualiscapax.ai` custom domain. Which origin actually answers for the domain is not asserted here; see SUPERSEDED.md.
- The provenance of the build serving right now is under review (2026-09-29).
- `.github/workflows/deploy.yml` and `workers-live.yml` are retired (they do not publish).

## Rules that stay
- Payment rails are closed (`research/payment-links.production.json` → `meta.open: false`).
- No tokens, keys or secrets in this repository, issues or chat. See `AGENT/NEVER-COMMIT.md`.
