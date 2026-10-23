#!/bin/sh
# Automated Pages package, optional deploy.
# Production rail is still the ZIP. Deploy runs only if CLOUDFLARE_API_TOKEN is set.
# Usage: ./scripts/deploy_pages.sh
set -e
cd "$(dirname "$0")/.."

echo "== 1. edge routes =="
python3 scripts/check_edge_routes.py

echo "== 2. package =="
python3 scripts/pack_hierarchical_flat_zip.py --lander --check
python3 scripts/pack_hierarchical_flat_zip.py --lander
ZIP=$(ls -1 dist/cloudflare/lander-*.zip | tail -1)
echo "ZIP: $ZIP"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "== 3. no token — stop =="
  echo "Set CLOUDFLARE_API_TOKEN to deploy with wrangler."
  echo "Or upload $ZIP in Workers & Pages → dualiscapax-web"
  echo "Then: ./scripts/verify_live_routes.sh"
  exit 0
fi

echo "== 3. wrangler pages deploy =="
# Project name from wrangler.toml. Direct upload of the repo root
# (Pages reads _worker.js). Requires token seated by operator.
npx --yes wrangler pages deploy . \
  --project-name=dualiscapax-web \
  --commit-dirty=true

echo "== 4. verify =="
./scripts/verify_live_routes.sh "${VERIFY_BASE:-https://dualiscapax.ai}"
