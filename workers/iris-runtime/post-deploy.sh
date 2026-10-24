#!/usr/bin/env bash
# Post-deploy verification for Iris staging.
# Runs the local suites always. Runs the live Worker checks only when
# IRIS_STAGING_URL is set. Does not deploy. Does not touch production.
set -euo pipefail

cd "$(dirname "$0")/../.."

echo "=== Local suites ==="
node workers/iris-runtime/verify-staging.mjs
node workers/iris-memory/verify-staging.mjs
node --test tests/iris-memory.test.mjs tests/iris-runtime-memory.integration.test.mjs
node --test tests/iris-authorize-regression.test.mjs
node --test tests/iris-receipt-gate.test.mjs
node --test tests/test_iris_provider_gate.mjs
node --test tests/iris-authorize-endpoint.test.mjs
node --test tests/iris-receipt-endpoint.test.mjs
node --test tests/iris-authorize-next10.test.mjs
node --test tests/iris-authorize-next20.test.mjs
python -m unittest tests.test_iris_authorize_contract -v

if [[ -n "${IRIS_STAGING_URL:-}" && -n "${IRIS_STAGING_SIGNING_SECRET:-}" && -n "${IRIS_STAGING_UNITY_ID:-}" ]]; then
  echo
  echo "=== Live staging (${IRIS_STAGING_URL}) ==="
  node workers/iris-runtime/verify-live.mjs
else
  echo
  echo "IRIS_STAGING_URL is not set. Live checks skipped."
  echo "Set IRIS_STAGING_URL, IRIS_STAGING_SIGNING_SECRET, and a valid IRIS_STAGING_UNITY_ID to run live checks."
fi
