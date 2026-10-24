#!/usr/bin/env bash
# Deploy the isolated Iris Memory staging service only.
# Requires Wrangler authentication and IRIS_MEMORY_SERVICE_TOKEN already set as a Worker secret.
set -euo pipefail
cd "$(dirname "$0")"
echo "=== Iris Memory staging preflight ==="
node verify-staging.mjs
echo
echo "Deploying iris-memory-staging (no production routes configured)..."
npx wrangler deploy
echo
echo "Memory service deployment command completed. Verify its deployment and health before deploying Iris Runtime."
