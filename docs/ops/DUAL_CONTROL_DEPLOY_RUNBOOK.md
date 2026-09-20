# Dual-Control Deploy Runbook (v1.0)

**Charter:** `DUAL_CONTROL_DEPLOY_PROMOTE` ACCEPTED + IMPLEMENT authorized 2026-09-20  
**Freeze:** PRODUCTION FROZEN · CHECKOUT CLOSED · SESSION_MINT closed · previews off  
**Honesty:** Standing Edit can still bypass this gate until Edit is shrunk — egg #1 OPEN.

## Before Absolute 100% Workers deploy

1. On tip `factory-floor-v01` (or named branch):
   ```bash
   node scripts/dual-control/generate-tipseal.mjs --worker dualis-gate --out /tmp/tipseal.json
   ```
2. David Warrant-B: set env to the seal tip sha (must match):
   ```bash
   export DAVID_YES_TIP_SHA=<40-hex from tipseal.json tip_sha>
   ```
   Or say in chat: `YES deploy tip_sha=<40-hex>` before operator runs gate.
3. Gate (fail-closed):
   ```bash
   node scripts/dual-control/gate-deploy.mjs --tipseal /tmp/tipseal.json --expect-worker dualis-gate
   ```
4. Only if gate exit 0: perform upload/deploy of the **same** worker tree that was sealed.
5. After deploy: record annotation intent  
   `tip_sha=<sha> content_sha256=<sha>`  
   (use `scripts/dual-control/annotate-deployment.mjs` when CF token available).
6. Verify: `node scripts/dual-control/verify-dc.mjs` plus live proof pack regressions.

## Pages rail (`pages-direct-upload`)

1. TipSeal the static tree (package or extracted payload):
   ```bash
   node scripts/dual-control/generate-tipseal.mjs --payload-dir cf-pages --worker pages --out /tmp/tipseal-pages.json
   ```
2. David Warrant-B: `DAVID_YES_TIP_SHA` must equal TipSeal `tip_sha` (workflow input `david_yes_tip_sha`, or defaults to `GITHUB_SHA` on dispatch).
3. Gate fail-closed **before** `wrangler pages deploy`:
   ```bash
   node scripts/dual-control/gate-deploy.mjs --tipseal /tmp/tipseal-pages.json --expect-worker pages
   ```
4. Do **not** expect `annotate-deployment.mjs` on Pages — no `workers/message` API (residual OPEN; see `EGG7_TIP_BLIND_RESIDUAL.md`).
5. PRODUCTION FROZEN: tip mutate + PR only unless David authorizes a live Pages dispatch.

## Never

- Deploy Absolute 100% without TipSeal + matching `DAVID_YES_TIP_SHA`
- Claim egg #1/#7 CLOSED because this runbook exists
- Reopen checkout / mint / previews for “testing”
- Invent PE / declare Absolute Truth
