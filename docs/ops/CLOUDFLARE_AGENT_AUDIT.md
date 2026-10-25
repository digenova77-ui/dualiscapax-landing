# Cloudflare Agent Setup and Deployment Rail Audit

**Repository:** `digenova77-ui/dualiscapax-landing`  
**Audit date:** 2026-10-25  
**Scope:** Source configuration and GitHub Actions only. No Cloudflare account, DNS, secrets, dashboard settings, or live services were changed.

## Findings

### 1. Repository-level agent instructions

Added `AGENTS.md` as the project-wide instruction source and `.github/copilot-instructions.md` for GitHub Copilot. Both enforce Trinity as the sole authorization gate, require fail-closed decisions and evidence-based claims, and prohibit unapproved production changes.

Cloudflare's current agent guidance distinguishes the beta `cf` CLI for broad account API tasks from Wrangler for projects that already have `wrangler.toml` / `wrangler.jsonc`. This repository has a Pages-oriented `wrangler.toml`, so this audit preserves Wrangler and does not migrate configuration. See [Cloudflare's agent CLI guidance](https://developers.cloudflare.com/cf/agents/) and [Docs for agents](https://developers.cloudflare.com/docs-for-agents/).

### 2. Current repository deploy workflow

`.github/workflows/pages-deploy.yml` is manually triggered (`workflow_dispatch`) and performs:

1. Checkout.
2. `scripts/check_edge_routes.py`.
3. `scripts/test_omni_match.py -q`.
4. ZIP package validation and creation through `scripts/pack_hierarchical_flat_zip.py`.
5. Cloudflare token preflight using repository secrets without intentionally printing the token.
6. `wrangler pages deploy /tmp/pages-out --project-name=dualiscapax-landing --commit-dirty=true`.
7. Live route checks against `https://dualiscapax.ai`.

**Conclusion:** This workflow is an actual Pages deployment rail by source definition. It is not automatic on push, and inspecting the YAML does not prove that it has run successfully or that the public domain serves this commit.

### 3. The reported `npx wrangler preview` failure

The supplied Cloudflare build log shows a dashboard build command invoking `npx wrangler preview`, which fails because the configuration lacks a `[previews]` block. The root `wrangler.toml` explicitly identifies a Pages project and warns not to add that Workers Builds-only block because Pages rejects it.

**Conclusion:** Do not “fix” the dashboard failure by adding `[previews]` to the root Pages configuration. The failing dashboard build is a separate Workers Builds/preview rail and is not the same command as the repository's `wrangler pages deploy` workflow. Confirm which Cloudflare project type owns that build command in the dashboard before changing its configuration. No dashboard changes were made in this audit.

### 4. Documentation drift found

The previous `docs/ops/ENVIRONMENT.md` included stale statements claiming that the root `wrangler.toml` was named `dualiscapax-web` and contained an empty `[previews]` block. The checked-in config instead names `dualiscapax-landing` and has no `[previews]` block. The environment guide also names a project `dualiscapax-web` in the manual-upload steps while the workflow targets `dualiscapax-landing`. This discrepancy must be resolved against the actual Cloudflare dashboard binding before any manual upload or production promotion.

### 5. Safe next steps

1. Review and merge this PR so repository agents consistently load the Cloudflare and Trinity instructions.
2. In Cloudflare dashboard, identify whether the failing build is a Pages project or a standalone Worker/Workers Builds project. Do not edit settings until the project type and intended rail are clear.
3. For the Pages project, use the existing Pages workflow or the documented manual ZIP process; first test on a preview/staging deployment where available.
4. Capture the GitHub Actions run URL, deployment URL, commit SHA, route-check results, and failure responses. Only then report a live pass.
5. Keep DNS, secrets, production services, and production promotion untouched unless explicitly approved.

## Verification boundary

This audit and its proposed instructions are source-only changes. No deployment was run. No production change was made. No current Cloudflare account state or live deployment hash was verified by this report.
