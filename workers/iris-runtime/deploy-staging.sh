#!/usr/bin/env bash
# Staging-only deploy for the Iris Runtime Worker.
# Does not touch production Pages, routes, or secrets.
#
# Prerequisites:
#   - wrangler authenticated (wrangler login or CLOUDFLARE_API_TOKEN)
#   - Staging services exist: identity-api-staging, trinity-law-staging,
#     iris-memory-staging, model-provider-staging
#   - IRIS_MEMORY_SERVICE_TOKEN is configured as a secret on both Iris Workers
#   - TRINITY_HMAC_SECRET set as a Worker secret (see set-secret.sh)
#
# Usage:
#   cd workers/iris-runtime
#   ./deploy-staging.sh
set -euo pipefail

cd "$(dirname "$0")"

echo "=== Iris Runtime staging deploy ==="
echo "Checking wrangler.toml bindings..."
node verify-staging.mjs

echo
echo "Deploying to staging environment only..."
npx wrangler deploy --env staging

echo
echo "Staging deploy complete. Production was not touched."
if [[ -n "${IRIS_STAGING_URL:-}" && -n "${IRIS_STAGING_SIGNING_SECRET:-}" && -n "${IRIS_STAGING_UNITY_ID:-}" ]]; then
  echo "Running live verification against ${IRIS_STAGING_URL}"
  node verify-live.mjs
else
  echo "Set IRIS_STAGING_URL, IRIS_STAGING_SIGNING_SECRET, and IRIS_STAGING_UNITY_ID, then run ./post-deploy.sh to prove the deploy."
fi
