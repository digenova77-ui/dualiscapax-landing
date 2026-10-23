#!/bin/sh
# Fail closed before any Pages deploy.
# Never prints the token. Stops if the seated secret is dead.
set -e
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "STOP: CLOUDFLARE_API_TOKEN is empty in this environment."
  echo "Update the Actions secret. Naming a token in Cloudflare does not update GitHub."
  exit 1
fi
if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "STOP: CLOUDFLARE_ACCOUNT_ID is empty."
  exit 1
fi

# Account-owned tokens (cfat_) and user tokens both hit /accounts.
code=$(curl -sS -o /tmp/cf_accounts.json -w "%{http_code}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}")

if [ "$code" != "200" ]; then
  echo "STOP: seated CLOUDFLARE_API_TOKEN was rejected (HTTP $code)."
  echo "A roll in the Cloudflare dashboard kills the old secret."
  echo "Paste the new token value into GitHub Actions secret CLOUDFLARE_API_TOKEN."
  echo "Account id expected: ${CLOUDFLARE_ACCOUNT_ID}"
  # Show Cloudflare error codes only, never the token.
  python3 - << 'PY'
import json
try:
    d = json.load(open("/tmp/cf_accounts.json"))
    for e in d.get("errors") or []:
        print("cloudflare:", e.get("code"), e.get("message"))
except Exception as ex:
    print("cloudflare: unreadable", ex)
PY
  exit 1
fi

echo "PREFLIGHT OK account ${CLOUDFLARE_ACCOUNT_ID}"
