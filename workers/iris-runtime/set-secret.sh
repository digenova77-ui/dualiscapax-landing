#!/usr/bin/env bash
# Set the TRINITY_HMAC_SECRET on the staging Worker.
# The secret is stored by Cloudflare as a Worker secret and is never written to source.
#
# Usage:
#   cd workers/iris-runtime
#   ./set-secret.sh
#
# You will be prompted to enter the secret value (input is hidden).
set -euo pipefail

cd "$(dirname "$0")"

echo "=== Set TRINITY_HMAC_SECRET (staging only) ==="
echo "This writes the secret to the Cloudflare Worker secret store."
echo "It does not appear in source, logs, or the browser."
echo

npx wrangler secret put TRINITY_HMAC_SECRET --env staging

echo
echo "Secret set. Verify with: npx wrangler secret list --env staging"
