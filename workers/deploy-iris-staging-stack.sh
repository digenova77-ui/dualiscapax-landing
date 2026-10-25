#!/usr/bin/env bash
# Deploy a complete isolated Iris staging stack: memory + explicit dependency fixtures + runtime.
# Never deploys Pages, production routes, or production Workers.
# The runtime URL is discovered from Wrangler's deploy output unless explicitly supplied.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

for command in node npm npx openssl grep tail mktemp; do
  command -v "$command" >/dev/null 2>&1 || { echo "Missing required command: $command" >&2; exit 1; }
done

# Local operators may supply the URL, but GitHub Actions no longer asks users to find it.
# In CI, discover the URL from the runtime deployment output below.
if [[ -n "${IRIS_STAGING_URL:-}" ]]; then
  if ! node workers/iris-runtime/staging-url.mjs "$IRIS_STAGING_URL"; then
    echo "IRIS_STAGING_URL must be the exact HTTPS iris-runtime-staging workers.dev origin." >&2
    exit 1
  fi
fi

npx wrangler whoami >/dev/null

if [[ -z "${IRIS_STAGING_UNITY_ID:-}" ]]; then
  if [[ -t 0 ]]; then
    read -r -s -p "Registered staging-only Unity ID (input hidden): " IRIS_STAGING_UNITY_ID
    echo
  else
    echo "IRIS_STAGING_UNITY_ID is required; nothing deployed." >&2
    exit 1
  fi
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

echo "=== Deploy Iris Runtime staging Worker and discover its URL ==="
put_secret "workers/iris-runtime" IRIS_MEMORY_SERVICE_TOKEN "$IRIS_MEMORY_SERVICE_TOKEN" staging
put_secret "workers/iris-runtime" TRINITY_HMAC_SECRET "$TRINITY_HMAC_SECRET" staging
cd "$ROOT/workers/iris-runtime"

deploy_log="$(mktemp)"
if ! npx wrangler deploy --env staging 2>&1 | tee "$deploy_log"; then
  rm -f "$deploy_log"
  exit 1
fi

if [[ -z "${IRIS_STAGING_URL:-}" ]]; then
  IRIS_STAGING_URL="$(grep -Eo 'https://iris-runtime-staging\.[a-z0-9-]+\.workers\.dev' "$deploy_log" | tail -n 1 || true)"
fi
rm -f "$deploy_log"

if [[ -z "${IRIS_STAGING_URL:-}" ]]; then
  echo "Runtime deployed, but Wrangler did not print its workers.dev URL; live gauntlet cannot safely run." >&2
  echo "Check that workers.dev is enabled for this Cloudflare account, then rerun with IRIS_STAGING_URL set." >&2
  exit 1
fi
if ! node staging-url.mjs "$IRIS_STAGING_URL"; then
  echo "Discovered runtime URL did not match the staging-only URL policy; refusing live verification." >&2
  exit 1
fi
echo "Discovered Iris staging runtime URL; proceeding with live verification."

echo
echo "=== Mandatory live gauntlet: health -> deny -> authorize -> infer -> receipt verification ==="
IRIS_STAGING_URL="$IRIS_STAGING_URL" \
IRIS_STAGING_SIGNING_SECRET="$TRINITY_HMAC_SECRET" \
IRIS_STAGING_UNITY_ID="$IRIS_STAGING_UNITY_ID" \
node verify-live.mjs

echo
echo "Staging stack deployed AND live gauntlet passed. Production was not touched."
echo "IMPORTANT: Identity, Trinity, and model services in this run are test doubles, not production-grade providers."
