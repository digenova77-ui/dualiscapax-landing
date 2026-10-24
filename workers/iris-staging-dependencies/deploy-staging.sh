#!/usr/bin/env bash
# Deploy the three explicitly fake contract fixtures for a live staging gauntlet.
# This does NOT deploy a real identity provider, real Trinity policy engine, or real model.
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v npx >/dev/null 2>&1 || ! command -v openssl >/dev/null 2>&1; then
  echo "Requires Node/npm and openssl." >&2
  exit 1
fi
npx wrangler whoami >/dev/null

read -r -s -p "Registered staging-only Unity ID (input hidden): " STAGING_UNITY_ID
echo
if [[ -z "$STAGING_UNITY_ID" ]]; then
  echo "A registered staging-only Unity ID is required; nothing deployed." >&2
  exit 1
fi

put_secret() {
  local env_name="$1" key="$2" value="$3"
  printf '%s' "$value" | npx wrangler secret put "$key" --env "$env_name" >/dev/null
}

for env_name in identity trinity model; do
  echo "Configuring fail-closed fixture secrets for $env_name..."
  put_secret "$env_name" STAGING_UNITY_ID "$STAGING_UNITY_ID"
  put_secret "$env_name" STAGING_FIXTURE_ENABLED "true"
done

for env_name in identity trinity model; do
  echo "Deploying $env_name fixture..."
  npx wrangler deploy --env "$env_name"
done

echo
echo "Staging fixtures deployed. These are contract-test doubles, NOT production services."
echo "Identity accepts only the supplied staging Unity ID; Trinity allows only iris.turn.look with a matching digest."
echo "Model fixture returns a deterministic marker and does not call an external AI provider."
