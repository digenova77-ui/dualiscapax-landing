#!/bin/sh
# Dualis plate verify. No -L. 200 + no Location = pass.
set -eu
base="${1:-https://dualiscapax.ai}"
fail=0
for p in / /ice /ice.html /look /hockey /portal /rte/easthill/ /sara /js/modules.json; do
  code=$(curl -sI --no-location -o /tmp/dc_h -w "%{http_code}" "$base$p" || echo 000)
  loc=$(grep -i '^location:' /tmp/dc_h | tr -d '\r' || true)
  printf '%-28s %s %s\n' "$p" "$code" "$loc"
  case "$p" in
    /|/portal)
      [ "$code" = 200 ] && [ -z "$loc" ] || fail=1
      ;;
    /ice|/ice.html|/look|/hockey|/rte/easthill/|/sara|/js/modules.json)
      if [ "$code" != 200 ] || [ -n "$loc" ]; then fail=1; fi
      ;;
  esac
done
exit "$fail"
