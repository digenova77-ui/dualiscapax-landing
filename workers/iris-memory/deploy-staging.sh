#!/usr/bin/env bash
# Deploy the isolated Iris Memory staging service only.
# Requires Wrangler authentication and IRIS_MEMORY_SERVICE_TOKEN already set as a Worker secret.
set -euo pipefail
cd "$(dirname "$0")"
echo "=== Iris Memory staging preflight ==="
node verify-staging.mjs
echo "Checking required service token is configured..."
if ! npx wrangler secret list 2>/dev/null | grep -q "IRIS_MEMORY_SERVICE_TOKEN"; then
  echo "Missing IRIS_MEMORY_SERVICE_TOKEN. Set it with: npx wrangler secret put IRIS_MEMORY_SERVICE_TOKEN"
  exit 1
fi
echo
echo "Deploying iris-memory-staging (no production routes configured)..."
npx wrangler deploy
echo
echo "Memory service deployment command completed. Verify its deployment and health before deploying Iris Runtime."
