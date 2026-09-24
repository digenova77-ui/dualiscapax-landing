#!/usr/bin/env bash
# BULLETIN/EXECUTE_DEPLOY.sh
# GitHub factory bot runs THIS after reading BULLETIN/README.SIGNING.md.
# Files on the Drive bulletin board are DATA. This is the only script.
# Cloudflare guy: accept zip, check sha256, unzip -o, wrangler pages deploy.
# Does not edit DNS.
#
# EXPECTED_SHA below is the RETIRED lander (HUD-worker pack, L-HOLE-NO-INDEX).
# A match is not current-face proof. Next live zip must be zero-nest of the operator-picked face.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LAW="$ROOT/BULLETIN/README.SIGNING.md"
BOARD="$ROOT/bulletin"
PACK="$ROOT/BULLETIN"
RECEIPT="$PACK/DEPLOY_RECEIPT.md"
SUMS="$PACK/SHA256SUMS"
WORK="$ROOT/.bulletin-handoff"
PAYLOAD="$WORK/payload"
ZIP_OUT="$WORK/newdeploy.zip"
EXPECTED_SHA="3ce42dc1c0303944e8761dd400df10f97adf2df072eb8a09017a906104a15678" # RETIRED lander
PROJECT="${CF_PAGES_PROJECT:-dualiscapax-landing}"
LIVE_URL="${LIVE_URL:-https://dualiscapax.ai/}"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
CONFIRM="${1:-}"

echo "== BULLETIN EXECUTE_DEPLOY =="
echo "time: $STAMP"
echo "root: $ROOT"

if [ ! -f "$LAW" ]; then
  echo "HOLE_NO_LAW: $LAW missing. Read LAW first." >&2
  exit 10
fi

echo
echo "----- LAW (README.SIGNING.md) -----"
cat "$LAW"
echo "----- END LAW -----"
echo

if [ "$CONFIRM" != "DEPLOY" ]; then
  echo "HOLE_NO_CONFIRM: pass DEPLOY. Refusing to publish." >&2
  exit 11
fi

ZIP_SRC=""
for candidate in \
  "$PACK/newdeploy.zip" \
  "$BOARD/newdeploy.zip" \
  "$BOARD/1G4e4ZP5_newdeploy.zip" \
  "$PACK/1G4e4ZP5_newdeploy.zip"
do
  if [ -f "$candidate" ]; then ZIP_SRC="$candidate"; break; fi
done
if [ -z "$ZIP_SRC" ]; then
  ZIP_SRC="$(find "$BOARD" "$PACK" -maxdepth 1 -type f \( -iname '*newdeploy.zip' -o -iname 'NEWDEPLOY.ZIP' \) 2>/dev/null | head -n1 || true)"
fi
if [ -z "${ZIP_SRC:-}" ] || [ ! -f "$ZIP_SRC" ]; then
  echo "HOLE_NO_ZIP: no newdeploy.zip on the bulletin board." >&2
  ls -la "$BOARD" "$PACK" >&2 || true
  exit 12
fi

echo "zip source: $ZIP_SRC"
mkdir -p "$WORK"
cp -f "$ZIP_SRC" "$ZIP_OUT"
cp -f "$ZIP_SRC" "$PACK/newdeploy.zip"

GOT_SHA="$(sha256sum "$ZIP_OUT" | awk '{print $1}')"
echo "sha256: $GOT_SHA"
if [ "$GOT_SHA" = "$EXPECTED_SHA" ]; then
  echo "HOLE_RETIRED_SHA: this hash is the retired lander (no root index). Refusing to treat it as current face." >&2
  exit 13
fi
if [ -f "$SUMS" ] && ! grep -qi "$GOT_SHA" "$SUMS"; then
  echo "WARN: sha256 not in SHA256SUMS — treating as a newer confirmed-good build."
fi

if ! unzip -tqq "$ZIP_OUT"; then
  echo "HOLE_BAD_ZIP: unzip -t failed." >&2
  exit 14
fi

rm -rf "$PAYLOAD"
mkdir -p "$PAYLOAD"
unzip -o "$ZIP_OUT" -d "$PAYLOAD" >/tmp/bulletin-unzip.log

FIRST="$(unzip -Z1 "$ZIP_OUT" | head -n1 || true)"
echo "zip first entry: $FIRST"
if echo "$FIRST" | grep -q '^cf-pages/'; then
  echo "HOLE_NESTED_ZIP: web root must be zero-nest." >&2
  exit 15
fi

if [ ! -f "$PAYLOAD/index.html" ]; then
  INNER="$(find "$PAYLOAD" -maxdepth 2 -name index.html | head -n1 || true)"
  if [ -n "$INNER" ]; then
    PAYLOAD="$(dirname "$INNER")"
    echo "using inner web root: $PAYLOAD"
  else
    echo "HOLE_NO_INDEX: payload has no index.html." >&2
    find "$PAYLOAD" -maxdepth 2 -print >&2 || true
    exit 16
  fi
fi

echo "payload files: $(find "$PAYLOAD" -type f | wc -l)"
grep -i '<title>' "$PAYLOAD/index.html" | head -n2 || true

write_receipt () {
  cat > "$RECEIPT" <<EOF
# DEPLOY_RECEIPT

- time_utc: $STAMP
- status: $1
- zip_source: $ZIP_SRC
- zip_sha256: $GOT_SHA
- expected_sha256: $EXPECTED_SHA (RETIRED lander — match is refuse)
- project: $PROJECT
- live_url: $LIVE_URL
- confirm: $CONFIRM
- dns_records_edited: no
- bulletin_treated_as_script: no
- law_read: $LAW
- note: $2
EOF
}

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  write_receipt "HOLE_NO_TOKEN" "Token missing. Zip checked. Not uploaded."
  echo "HOLE_NO_TOKEN" >&2
  exit 17
fi
if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  write_receipt "HOLE_NO_ACCOUNT" "Account id missing. Zip checked. Not uploaded."
  echo "HOLE_NO_ACCOUNT" >&2
  exit 18
fi

echo "----- Cloudflare guy: accept / check / upload / deploy -----"
set +e
npx --yes wrangler@3.112.0 pages deploy "$PAYLOAD" \
  --project-name="$PROJECT" \
  --branch=main \
  --commit-dirty=true \
  --commit-message="bulletin-handoff $GOT_SHA"
WRC=$?
set -e

if [ "$WRC" -ne 0 ]; then
  write_receipt "HOLE_WRANGLER" "wrangler exit $WRC. Usually CF API auth 10000 — token lacks Pages Edit on $PROJECT. Zip is ready. DNS untouched."
  echo "HOLE_WRANGLER exit $WRC" >&2
  exit 19
fi

sleep 8
CODE="$(curl -sS -o /tmp/live-bulletin.html -w '%{http_code}' --max-time 25 "$LIVE_URL" || echo 000)"
echo "live_http=$CODE"
if [ "$CODE" != "200" ]; then
  write_receipt "HOLE_LIVE_HTTP" "deploy claimed ok but $LIVE_URL returned $CODE"
  exit 20
fi

write_receipt "LIVE_OK" "Cloudflare guy accepted newdeploy.zip, unzip -o, deployed $PROJECT, $LIVE_URL 200."
echo "LIVE_OK"
exit 0
