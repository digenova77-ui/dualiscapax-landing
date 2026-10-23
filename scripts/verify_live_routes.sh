#!/bin/sh
# Verify live Pages routes. Retry with exponential backoff. Does not deploy.
# Usage: ./scripts/verify_live_routes.sh [base_url]
set -e
BASE="${1:-https://dualiscapax.ai}"
echo "checking $BASE"
fail=0
get_code() {
  url="$1"
  delay=1
  code="000"
  i=0
  while [ "$i" -lt 3 ]; do
    code=$(curl -s -o /tmp/dc_body -w "%{http_code}" --max-time 20 "$url" || echo 000)
    echo "$url try $((i+1)) -> $code"
    if [ "$code" = "200" ]; then
      return 0
    fi
    i=$((i+1))
    if [ "$i" -lt 3 ]; then
      sleep "$delay"
      delay=$((delay * 2))
    fi
  done
  return 1
}
check() {
  path="$1"
  if get_code "$BASE$path"; then
    cc=$(curl -sI "$BASE$path" | grep -i "^cache-control:" | tr -d "\r" || true)
    echo "$path OK  $cc"
  else
    echo "$path FAIL"
    fail=1
  fi
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
