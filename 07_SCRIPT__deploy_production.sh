#!/usr/bin/env bash
set -euo pipefail

echo "================================================================="
echo " DualisCapax: Master Production Deployment & Verification Script"
echo " Live Surface: https://dualiscapax.ai"
echo "================================================================="

# 1. Manifest Regeneration
echo "[1/4] Re-indexing SHA-256 integrity manifest..."
cd "$(dirname "$0")/../encyclopedia/crypto_tools"
python3 encrypt_archive.py
cd ../..

# 2. Git Commit & Push
echo "[2/4] Staging and pushing repository changes..."
git status
git add .
git commit -m "feat(production): master deployment - full multi-track release (infra, DAO governance, and enterprise intake dossiers)" || echo "No git changes to commit."
git push origin main || echo "Git push skipped or remote not configured."

# 3. Cloudflare D1 Database & Worker Deployment
echo "[3/4] Deploying Cloudflare Workers..."
if command -v wrangler &> /dev/null; then
  echo "Deploying iris-gateway worker..."
  (cd workers/iris-gateway && wrangler deploy)
  echo "Deploying stripe-fulfill worker..."
  (cd workers/stripe-fulfill && wrangler deploy)
else
  echo "Notice: wrangler CLI not found. Run 'npx wrangler deploy' inside workers/ directories."
fi

# 4. Live Telemetry Verification
echo "[4/4] Running live endpoint verification..."
python3 scripts/verify_live_endpoints.py

echo "================================================================="
echo " Production Deployment Workflow Complete. State Conserved."
echo "================================================================="
