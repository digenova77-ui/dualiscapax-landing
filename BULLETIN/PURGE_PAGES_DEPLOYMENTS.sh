#!/usr/bin/env bash
# BULLETIN/PURGE_PAGES_DEPLOYMENTS.sh
# Deletes Cloudflare Pages *deployments* for dualiscapax-landing.
# NEVER deletes Workers. NEVER edits DNS. NEVER deletes repo website files.
# confirm=PURGE     → preview/aliased only
# confirm=PURGE_ALL → also production Pages deployments (apex will go blank)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RECEIPT="$ROOT/BULLETIN/PURGE_RECEIPT.md"
PROJECT="${CF_PAGES_PROJECT:-dualiscapax-landing}"
LIVE_URL="${LIVE_URL:-https://dualiscapax.ai/}"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
CONFIRM="${1:-}"

echo "== PURGE PAGES DEPLOYMENTS =="
echo "time: $STAMP"
echo "project: $PROJECT"
echo "confirm: $CONFIRM"

write_receipt () {
  cat > "$RECEIPT" <<EOF
# PURGE_RECEIPT

- time_utc: $STAMP
- status: $1
- project: $PROJECT
- confirm: $CONFIRM
- workers_deleted: no
- dns_records_edited: no
- encyclopedia_deleted: no
- note: $2
EOF
}

if [ "$CONFIRM" != "PURGE" ] && [ "$CONFIRM" != "PURGE_ALL" ]; then
  write_receipt "HOLE_NO_CONFIRM" "pass PURGE or PURGE_ALL. Refusing."
  echo "HOLE_NO_CONFIRM" >&2
  exit 11
fi

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  write_receipt "HOLE_NO_TOKEN" "Cannot list/delete Pages deployments. Workers untouched."
  echo "HOLE_NO_TOKEN" >&2
  exit 17
fi

API="https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT}/deployments"
AUTH=( -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json" )

LIST_HTTP="$(curl -sS -o /tmp/cf-dep-list.json -w '%{http_code}' "${AUTH[@]}" "$API?per_page=25" || echo 000)"
echo "list_http=$LIST_HTTP"
if [ "$LIST_HTTP" != "200" ]; then
  write_receipt "HOLE_CF_AUTH" "Pages list HTTP $LIST_HTTP. Usually API 10000 — token lacks Pages Edit. Workers untouched. DNS untouched."
  echo "HOLE_CF_AUTH $LIST_HTTP" >&2
  head -c 400 /tmp/cf-dep-list.json >&2 || true
  exit 19
fi

python3 - <<'PY'
import json, os
raw = json.load(open("/tmp/cf-dep-list.json"))
result = raw.get("result") or []
out = []
for d in result:
    env = (d.get("environment") or "").lower()
    aliases = d.get("aliases") or []
    out.append({
        "id": d.get("id"),
        "environment": env,
        "aliased": bool(aliases),
        "url": d.get("url"),
        "created_on": d.get("created_on"),
    })
json.dump(out, open("/tmp/cf-dep-norm.json", "w"))
print(f"listed {len(out)} deployments")
for row in out:
    print(f"  {row['id']} env={row['environment']} aliased={row['aliased']} {row['url']}")
PY

DELETED=0
SKIPPED=0
FAILED=0
while IFS= read -r line; do
  [ -z "$line" ] && continue
  ID="$(echo "$line" | awk '{print $1}')"
  ENV="$(echo "$line" | awk '{print $2}')"
  ALIASED="$(echo "$line" | awk '{print $3}')"
  KEEP=0
  if [ "$ENV" = "production" ] || [ "$ALIASED" = "True" ] || [ "$ALIASED" = "true" ]; then
    if [ "$CONFIRM" != "PURGE_ALL" ]; then
      KEEP=1
    fi
  fi
  if [ "$KEEP" = "1" ]; then
    echo "KEEP $ID env=$ENV aliased=$ALIASED"
    SKIPPED=$((SKIPPED+1))
    continue
  fi
  echo "DELETE $ID env=$ENV"
  CODE="$(curl -sS -o /tmp/cf-dep-del.json -w '%{http_code}' -X DELETE "${AUTH[@]}" "$API/$ID" || echo 000)"
  echo "  delete_http=$CODE"
  if [ "$CODE" = "200" ]; then
    DELETED=$((DELETED+1))
  else
    FAILED=$((FAILED+1))
  fi
done < <(python3 - <<'PY'
import json
for row in json.load(open("/tmp/cf-dep-norm.json")):
    print(row["id"], row["environment"] or "unknown", row["aliased"])
PY
)

echo "deleted=$DELETED skipped=$SKIPPED failed=$FAILED"
sleep 5
LIVE_CODE="$(curl -sS -o /tmp/live-purge.html -w '%{http_code}' --max-time 20 "$LIVE_URL" || echo 000)"
echo "live_http=$LIVE_CODE"

NOTE="Pages deployments purged on $PROJECT. Workers kept. DNS untouched. deleted=$DELETED skipped=$SKIPPED failed=$FAILED live_http=$LIVE_CODE"
if [ "$FAILED" -gt 0 ]; then
  write_receipt "HOLE_PARTIAL" "$NOTE"
  exit 20
fi
write_receipt "PURGE_OK" "$NOTE"
echo "PURGE_OK"
exit 0
