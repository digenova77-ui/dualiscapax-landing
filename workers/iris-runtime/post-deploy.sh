#!/usr/bin/env bash
# Post-deploy verification for Iris staging.
# Runs the local suites always. Runs the live Worker checks only when
# IRIS_STAGING_URL is set. Does not deploy. Does not touch production.
set -euo pipefail

cd "$(dirname "$0")/../.."

echo "=== Local suites ==="
node workers/iris-runtime/verify-staging.mjs
node --test tests/iris-authorize-regression.test.mjs
node --test tests/iris-receipt-gate.test.mjs
node --test tests/test_iris_provider_gate.mjs
node --test tests/iris-authorize-endpoint.test.mjs
node --test tests/iris-receipt-endpoint.test.mjs
python -m unittest tests.test_iris_authorize_contract -v

if [[ -n "${IRIS_STAGING_URL:-}" ]]; then
  echo
  echo "=== Live staging (${IRIS_STAGING_URL}) ==="
  node workers/iris-runtime/verify-live.mjs
else
  echo
  echo "IRIS_STAGING_URL is not set. Live checks skipped."
  echo "Set it to the staging Worker origin and re-run to prove the deploy."
fi
