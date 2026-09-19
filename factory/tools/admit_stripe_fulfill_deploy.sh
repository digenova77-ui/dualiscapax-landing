#!/usr/bin/env bash
# Residual R3: SOLE pre-deploy admit for stripe-fulfill.
# Dry-run -> expected-pre-stamp -> stamp --require-derivation -> admit --semantic-profile stripe.
# Does NOT open checkout. Does NOT run D1 SQL via API. Does NOT deploy.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

TOML=workers/stripe-fulfill/wrangler.toml
if ! grep -q 'CHECKOUT_OPEN = "false"' "$TOML"; then
  echo "refuse: CHECKOUT_OPEN=false missing from $TOML" >&2
  exit 1
fi
if grep -nE 'CHECKOUT_OPEN[[:space:]]*=[[:space:]]*"true"' "$TOML"; then
  echo "refuse: CHECKOUT_OPEN=true forbidden" >&2
  exit 1
fi
if [ "${CHECKOUT_OPEN:-}" = "true" ]; then
  echo "refuse: CHECKOUT_OPEN=true in env" >&2
  exit 1
fi

OUTDIR="${ADMIT_OUTDIR:-$(mktemp -d)}"
MANIFEST="${ADMIT_MANIFEST:-$(mktemp)}"
TIP="$(git rev-parse HEAD)"

npx --yes wrangler@4 deploy --dry-run --outdir="$OUTDIR" \
  --config workers/stripe-fulfill/wrangler.toml

python3 - "$OUTDIR" "$MANIFEST" <<'PY'
import hashlib, json, pathlib, sys
out = pathlib.Path(sys.argv[1])
manifest = pathlib.Path(sys.argv[2])
files = {}
for p in sorted(out.glob("*.js")):
    if p.name.endswith(".map"):
        continue
    body = p.read_text(encoding="utf-8")
    if 'DC_ARTIFACT_TIP = "UNSTAMPED"' not in body:
        sys.exit(f"refuse: {p.name} missing UNSTAMPED tip marker")
    files[p.name] = hashlib.sha256(body.encode("utf-8")).hexdigest()
if "worker.js" not in files:
    sys.exit("refuse: dry-run missing worker.js")
body = (out / "worker.js").read_text(encoding="utf-8")
for needle in ("PARKED_UNTIL_BIND_CONTINUE", "operational_authority", "CHECKOUT_OPEN"):
    if needle not in body:
        sys.exit(f"refuse: packaged worker missing {needle}")
manifest.write_text(json.dumps({"files": files}, indent=2) + "\n")
print("expected_pre_stamp_ok", len(files))
PY

node factory/tools/stamp_artifact_tip.mjs "$OUTDIR" "$TIP" \
  --expected-pre-stamp "$MANIFEST" \
  --source-inputs "workers/stripe-fulfill/worker.js,workers/stripe-fulfill/wrangler.toml" \
  --require-derivation

node factory/tools/admit_artifact_authority.mjs "$OUTDIR" \
  --expected-pre-stamp "$MANIFEST" \
  --semantic-profile stripe

echo "ADMIT_OK tip=$TIP outdir=$OUTDIR"
