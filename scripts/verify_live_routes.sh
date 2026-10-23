#!/bin/sh
# Verify live Pages routes. Does not deploy.
# Usage: ./scripts/verify_live_routes.sh [base_url]
set -e
BASE="${1:-https://dualiscapax.ai}"
echo "checking $BASE"
fail=0
check() {
  path="$1"
  code=$(curl -s -o /tmp/dc_body -w "%{http_code}" "$BASE$path")
  cc=$(curl -sI "$BASE$path" | grep -i "^cache-control:" | tr -d "\r")
  echo "$path -> $code  $cc"
  if [ "$code" != "200" ]; then fail=1; fi
}
check /omni
check /frontier
check /purity
check /standing-probe
check /iris/status
if [ "$fail" != "0" ]; then
  echo "FAIL"
  exit 1
fi
echo "OK"
