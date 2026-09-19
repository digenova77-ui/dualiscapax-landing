# Residual R6 — DC_ARTIFACT_TIP UNSTAMPED in git (intentional)

## Design

`factory/tools/stamp_artifact_tip.mjs`: **Source trees stay UNSTAMPED.**
Deploy of an UNSTAMPED *package* without admit is unauthorized.

Git tip strings inside:

- `workers/stripe-fulfill/worker.js`
- `workers/dualis-gate/dualis-bc.js`
- `workers/iris-gateway/index.js`
- `workers/origin-join/worker.js`

remain `export const DC_ARTIFACT_TIP = "UNSTAMPED"`.

## Closing the residual

1. **CI (R3):** `factory/tools/admit_stripe_fulfill_deploy.sh` dry-runs,
   stamps the **outdir** with tip SHA + `--require-derivation`, then
   `admit_artifact_authority --semantic-profile stripe` **before**
   `wrangler deploy`.
2. Live module provenance remains proveable via dry-run hash compare
   (prior campaign: `VERIFIED_DERIVATION` vs serving etag), independent of
   the in-source UNSTAMPED label.
3. Do **not** commit tip SHA into source constants (would churn every commit
   and fight the stamp tool).

**Status:** Documented + CI admit enforces stamped package before deploy =
**VERIFIED** as design. Live Worker body may still embed UNSTAMPED until a
future admitted deploy that ships a stamped module (optional; not required
to keep park closed).
