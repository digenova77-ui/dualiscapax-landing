# DualisCapax Copilot Instructions

Trinity is the sole authorization gate. No component or workflow may bypass it or create a parallel authority. Missing, invalid, stale, conflicting, or mismatched authorization evidence means DENY. Never claim success without verifiable evidence.

For Cloudflare in this repository:
- Treat the root `wrangler.toml` and `pages_build_output_dir` as a Pages Advanced Mode configuration.
- Use Wrangler for this configured project; do not migrate to `cf` or generate `cloudflare.config.ts` without a reviewed migration plan.
- Do not add `[previews]` to the Pages config to repair a Workers Builds preview error. `npx wrangler preview` and `wrangler pages deploy` are different rails.
- Audit `.github/workflows/pages-deploy.yml` separately from dashboard-side Workers Builds settings.
- Never change production DNS, secrets, dashboard settings, or live services without explicit approval. Never expose credentials.
- Prefer preview/staging checks; packaging, CI, and a ready preview are not proof of production deployment.
