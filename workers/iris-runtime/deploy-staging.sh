#!/usr/bin/env bash
# Staging-only deploy for the Iris Runtime Worker.
# Does not touch production Pages, routes, or secrets.
#
# Prerequisites:
#   - wrangler authenticated (wrangler login or CLOUDFLARE_API_TOKEN)
#   - Four staging services exist: identity-api-staging, trinity-law-staging,
#     iris-memory-staging, model-provider-staging
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
echo "Next: point IrisAuthorizeBase at the staging Worker origin and re-run the verification suite."
