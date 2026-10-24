#!/usr/bin/env bash
# Deploy a complete isolated Iris staging stack: memory + explicit dependency fixtures + runtime.
# Never deploys Pages, production routes, or production Workers.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

for command in node npm npx openssl; do
  command -v "$command" >/dev/null 2>&1 || { echo "Missing required command: $command" >&2; exit 1; }
done
npx wrangler whoami >/dev/null

if [[ -z "${IRIS_STAGING_UNITY_ID:-}" ]]; then
  read -r -s -p "Registered staging-only Unity ID (input hidden): " IRIS_STAGING_UNITY_ID
  echo
fi
if [[ -z "$IRIS_STAGING_UNITY_ID" ]]; then
  echo "A registered staging-only Unity ID is required; nothing deployed." >&2
  exit 1
fi

IRIS_MEMORY_SERVICE_TOKEN="$(openssl rand -hex 32)"
TRINITY_HMAC_SECRET="$(openssl rand -hex 32)"

put_secret() {
  local directory="$1" key="$2" value="$3" env_name="${4:-}"
  cd "$ROOT/$directory"
  if [[ -n "$env_name" ]]; then
    printf '%s' "$value" | npx wrangler secret put "$key" --env "$env_name" >/dev/null
  else
    printf '%s' "$value" | npx wrangler secret put "$key" >/dev/null
  fi
}

echo "=== Local verification (no deployment yet) ==="
node workers/iris-runtime/verify-staging.mjs
node workers/iris-memory/verify-staging.mjs
node --test tests/iris-staging-dependencies.test.mjs tests/iris-memory.test.mjs tests/iris-runtime-memory.integration.test.mjs

echo "=== Deploy durable memory service ==="
put_secret "workers/iris-memory" IRIS_MEMORY_SERVICE_TOKEN "$IRIS_MEMORY_SERVICE_TOKEN"
cd "$ROOT/workers/iris-memory"
npx wrangler deploy

echo "=== Deploy explicitly fake Identity / Trinity / model contract services ==="
for env_name in identity trinity model; do
  put_secret "workers/iris-staging-dependencies" STAGING_UNITY_ID "$IRIS_STAGING_UNITY_ID" "$env_name"
  put_secret "workers/iris-staging-dependencies" STAGING_FIXTURE_ENABLED "true" "$env_name"
done
cd "$ROOT/workers/iris-staging-dependencies"
for env_name in identity trinity model; do npx wrangler deploy --env "$env_name"; done

echo "=== Deploy Iris Runtime staging Worker ==="
put_secret "workers/iris-runtime" IRIS_MEMORY_SERVICE_TOKEN "$IRIS_MEMORY_SERVICE_TOKEN" staging
put_secret "workers/iris-runtime" TRINITY_HMAC_SECRET "$TRINITY_HMAC_SECRET" staging
cd "$ROOT/workers/iris-runtime"
npx wrangler deploy --env staging

echo
echo "=== Live gauntlet ==="
if [[ -z "${IRIS_STAGING_URL:-}" ]]; then
  read -r -p "Paste the iris-runtime-staging workers.dev URL from Wrangler (blank skips live checks): " IRIS_STAGING_URL
fi
if [[ -n "$IRIS_STAGING_URL" ]]; then
  IRIS_STAGING_URL="$IRIS_STAGING_URL" \
  IRIS_STAGING_SIGNING_SECRET="$TRINITY_HMAC_SECRET" \
  IRIS_STAGING_UNITY_ID="$IRIS_STAGING_UNITY_ID" \
  node verify-live.mjs
else
  echo "Live verification skipped. Re-run this stack script when ready; it rotates secrets and can run the live checks in the same session."
fi

echo
echo "Staging stack deployment sequence completed. Production was not touched."
echo "IMPORTANT: Identity, Trinity, and model services in this run are test doubles, not production-grade providers."
