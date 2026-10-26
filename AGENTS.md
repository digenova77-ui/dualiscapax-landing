# Agent Instructions — DualisCapax

## Governing authority

**TRINITY IS THE SOLE AUTHORIZATION GATE.** This is a binding implementation constraint, not a slogan.

- No agent, model, workflow, deployment rail, service, or human-operated automation may create a parallel authorization authority or bypass Trinity.
- No governed execution without a matching, valid Trinity authorization.
- Missing, invalid, stale, conflicting, or mismatched evidence means DENY (fail closed).
- Bind authorization to the exact principal, action, request ID, and input digest where the operation contract requires them.
- For idempotent governed requests, perform the atomic idempotency claim only after a matching Trinity allow.
- Never claim a capability, test, deployment, or live status passed without reproducible evidence.
- Documentation, CI labels, previews, and mock fixtures do not prove runtime enforcement or production behavior.
- Never add a “paper law” or parallel policy layer that competes with Trinity. Keep supporting checks subordinate to the single gate.

## Cloudflare project rules

- This repository contains `wrangler.toml` with `pages_build_output_dir`; treat it as a Cloudflare Pages Advanced Mode project unless evidence proves otherwise.
- In this repository use Wrangler for operations governed by the existing Wrangler configuration. Do not migrate to the beta `cf` CLI or generate `cloudflare.config.ts` without an explicit, reviewed migration plan.
- Do not add a `[previews]` block to the Pages `wrangler.toml` to fix a Workers Builds preview error. Pages and Workers Builds are different deployment surfaces.
- The GitHub Actions workflow `.github/workflows/pages-deploy.yml` deploys the packaged site with `wrangler pages deploy`. A dashboard build command such as `npx wrangler preview` is a separate rail and must be audited separately.
- Do not change production DNS, Cloudflare dashboard settings, account secrets, tokens, bindings, or live services without explicit user approval. Never print, commit, or request secrets in chat.
- Prefer a preview/staging deployment and verifiable route checks before any production promotion. A successful build or ZIP packaging is not proof of deployment.
- Preserve existing Durable Object bindings and migrations unless a reviewed code change specifically requires a change.
- Do not run deploy commands as part of an audit unless the user explicitly authorizes deployment.

## Engineering workflow

1. Inspect the current branch, config, scripts, and workflow before editing.
2. Make the smallest code/config change that resolves a demonstrated issue; do not “fix” an error by adding incompatible config.
3. Run available deterministic checks and report exact outcomes.
4. Keep production changes out of scope unless explicitly approved.
5. Submit changes through a reviewable pull request; state what was changed, tested, and not verified.
