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

## Never

- Deploy Absolute 100% without TipSeal + matching `DAVID_YES_TIP_SHA`
- Claim egg #1/#7 CLOSED because this runbook exists
- Reopen checkout / mint / previews for “testing”
- Invent PE / declare Absolute Truth
