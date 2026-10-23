#!/bin/sh
# Live /omni must answer before a deploy is called real.
# Does not claim DEPLOYED. Prints MEASURED only on HTTP 200 + no-store.
# Usage: ./scripts/verify_omni_match.sh [base]
set -e
BASE="${1:-https://dualiscapax.ai}"
code=$(curl -s -o /tmp/omni_body -w "%{http_code}" "$BASE/omni")
cc=$(curl -sI "$BASE/omni" | grep -i "^cache-control:" | tr -d '\r' || true)
echo "url $BASE/omni"
echo "http $code"
echo "cache $cc"
if [ "$code" != "200" ]; then
  echo "grade HYPOTHETICAL"
  echo "reason live /omni not 200"
  exit 1
fi
echo "$cc" | grep -qi "no-store" || {
  echo "grade HYPOTHETICAL"
  echo "reason missing no-store"
  exit 1
}
echo "grade MEASURED"
echo "evidence http 200 and no-store"
echo "note not a full deploy claim — other routes still need verify_live_routes.sh"
