# CURL VERIFY

Never follow redirects for a green test. `-I` only. No `-L`.
A 308 with Location is a FAIL even if a browser later shows a title.

## Pass / fail

- PASS: `HTTP/2 200` and **no** `location:` header
- HOLE: `308` / `301` / `302` / `307` or `location:` present
- HOLE: `404`
- NOT GREEN: two measurers disagree

## Commands (copy)

```bash
# lander — must stay 200
curl -sI --no-location https://dualiscapax.ai/ | head -15

# ice — FAIL if Location exists
curl -sI --no-location https://dualiscapax.ai/ice | head -15
curl -sI --no-location https://dualiscapax.ai/ice.html | head -15

# look / hockey / rink — same family
curl -sI --no-location https://dualiscapax.ai/look | head -12
curl -sI --no-location https://dualiscapax.ai/hockey | head -12
curl -sI --no-location https://dualiscapax.ai/rink | head -12

# easthill — slash vs no-slash vs file
curl -sI --no-location https://dualiscapax.ai/rte/easthill/ | head -12
curl -sI --no-location https://dualiscapax.ai/rte/easthill | head -12
curl -sI --no-location https://dualiscapax.ai/rte/easthill/index.html | head -12
curl -sI --no-location https://dualiscapax.ai/rte/easthill/class.html | head -12
curl -sI --no-location https://dualiscapax.ai/sara | head -12

# board on the plate
curl -sI --no-location https://dualiscapax.ai/js/modules.json | head -12
curl -sI --no-location https://dualiscapax.ai/js/unity-bind.js | head -12
curl -sI --no-location https://dualiscapax.ai/portal | head -12
```

## One-liner codes

```bash
for p in / /ice /ice.html /look /hockey /rink /portal /unity \
  /rte/easthill/ /rte/easthill /rte/easthill/class.html /sara \
  /js/modules.json /js/unity-bind.js /js/device-pass.js
do
  printf "%-36s " "$p"
  curl -sI --no-location -o /tmp/h -w "%{http_code}" "https://dualiscapax.ai$p"
  grep -qi '^location:' /tmp/h && echo "  LOCATION=$(grep -i '^location:' /tmp/h | tr -d '\r')" || echo
done
```

## After a deploy

Wait 60s (Workers cache-control on the 308s) then a private window.
Second person runs the same commands. Agree = candidate. Disagree = NOT GREEN.
