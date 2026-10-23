#!/bin/sh
# Live /omni match. Grades via scripts/omni_match.py.
# MEASURED only on 200 + no-store. Else HYPOTHETICAL and exit 1.
# Usage: ./scripts/verify_omni_match.sh [base]
set -e
BASE="${1:-https://dualiscapax.ai}"
cd "$(dirname "$0")/.."
code=$(curl -s -o /tmp/omni_body -w "%{http_code}" "$BASE/omni")
cc=$(curl -sI "$BASE/omni" | grep -i "^cache-control:" | tr -d '\r' || true)
echo "url $BASE/omni"
echo "http $code"
echo "cache $cc"
python3 - << PY
import sys
sys.path.insert(0, "scripts")
from omni_match import grade, odds
g = grade(int("$code"), """$cc""")
o = odds(int("$code"), """$cc""")
print("grade", g["grade"])
print("odds", o["odds"])
print("reason", g.get("reason", ""))
sys.exit(0 if g["pass"] else 1)
PY
