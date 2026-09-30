#!/usr/bin/env bash
# Pack the named Dualis lander. Does not wrangler. Does not pin. Does not cut @.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/artifacts/named-lander.zip}"
mkdir -p "$(dirname "$OUT")"
cd "$ROOT"
files=(
  index.html
  styles.css
  _headers
  404.html
  design-law.html
  data-law.html
  authority.html
  consultation.html
  rite.html
  unity-id.html
  clone.html
  civic/rte-civic.html
)
missing=0
for f in "${files[@]}"; do
  if [ ! -f "$f" ]; then
    echo "MISSING $f" >&2
    missing=1
  fi
done
if [ "$missing" -ne 0 ]; then
  echo "refuse: named zip incomplete" >&2
  exit 1
fi
rm -f "$OUT"
zip -q -9 "$OUT" "${files[@]}"
echo "zip $OUT"
echo "bytes $(wc -c < "$OUT")"
sha256sum "$OUT"
unzip -Z1 "$OUT"
