#!/usr/bin/env bash
# DualisCapax · Codespace production deploy
# Path: scripts/deploy_production_live.sh
# Run from repo root: digenova77-ui/dualiscapax-landing
# Encyclopedia: encyclopedia/ai_systems_internal/turnkey_production_deployment_bundle_and_code.md
# Secrets stay interactive. Nothing is echoed. Nothing is committed.

set -euo pipefail

echo "== DualisCapax deploy_production_live =="
echo "cwd: $(pwd)"
echo "host: $(hostname 2>/dev/null || true)"
echo "time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [ ! -d workers/iris-gateway ] || [ ! -f workers/iris-gateway/index.js ]; then
  echo "STOP: workers/iris-gateway/index.js missing. git pull origin main, then retry."
  exit 3
fi
if [ ! -f workers/stripe-fulfill/schema.sql ]; then
  echo "STOP: workers/stripe-fulfill/schema.sql missing."
  exit 3
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "STOP: Node/npx missing in this Codespace."
  exit 2
fi

echo "node: $(node -v)"
echo "npx wrangler probe..."
npx wrangler --version

echo
echo "[0] Cloudflare auth"
if ! npx wrangler whoami; then
  echo "Not logged in. Opening wrangler login."
  npx wrangler login || {
    echo "STOP: wrangler login failed. In Codespace use: npx wrangler login --browser=false"
    exit 4
  }
fi

echo
echo "[1] D1 dualiscapax-fulfillments"
set +e
CREATE_OUT="$(npx wrangler d1 create dualiscapax-fulfillments 2>&1)"
CREATE_RC=$?
set -e
echo "$CREATE_OUT"
DB_ID="$(echo "$CREATE_OUT" | sed -n 's/.*database_id *= *\"\([0-9a-f-]*\)\".*/\1/p' | head -n1)"
if [ -n "${DB_ID:-}" ] && [ -f workers/stripe-fulfill/wrangler.toml ]; then
  echo "binding database_id=$DB_ID"
  sed -i "s/database_id = \".*\"/database_id = \"$DB_ID\"/" workers/stripe-fulfill/wrangler.toml
fi

echo
echo "[2] Apply schema.sql"
npx wrangler d1 execute dualiscapax-fulfillments --remote --file=workers/stripe-fulfill/schema.sql

echo
echo "[3] Secrets (paste, do not echo)"
( cd workers/iris-gateway && npx wrangler secret put XAI_API_KEY )
( cd workers/stripe-fulfill && npx wrangler secret put STRIPE_WEBHOOK_SECRET )

echo
echo "[4] Deploy workers"
( cd workers/iris-gateway && npx wrangler deploy )
( cd workers/stripe-fulfill && npx wrangler deploy )

echo
echo "[5] Pages source — commit only if you staged files yourself"
git status -sb
echo
echo "Dashboard leftovers:"
echo "  CF → dualiscapax-iris-gateway → route dualiscapax.ai/api/iris*"
echo "  Stripe webhook → dualiscapax-stripe-fulfill.<account>.workers.dev"
echo "  Fund xAI credits or Iris returns 429 INSUFFICIENT_QUOTA"
echo "DONE."
