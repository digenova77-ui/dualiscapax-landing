# CURL VERIFY

Do **not** use `-L` on the first pass. `-L` hides 308.

## Pass / fail

- **Pass:** `HTTP/2 200` and **no** `location:` header.
- **Fail:** `308` + `location:` (especially location pointing at itself).
- **Not green:** two measurers disagree, or git has the file and apex 404s.

## Commands (phone Termux / any shell)

```sh
BASE=https://dualiscapax.ai

curl -sI --max-redirs 0 "$BASE/"
curl -sI --max-redirs 0 "$BASE/portal"
curl -sI --max-redirs 0 "$BASE/js/modules.json"
curl -sI --max-redirs 0 "$BASE/ice"
curl -sI --max-redirs 0 "$BASE/ice.html"
curl -sI --max-redirs 0 "$BASE/look"
curl -sI --max-redirs 0 "$BASE/hockey"
curl -sI --max-redirs 0 "$BASE/rte/easthill/"
curl -sI --max-redirs 0 "$BASE/rte/easthill"
curl -sI --max-redirs 0 "$BASE/sara"
```

Read only the first lines: status + `location`.

Wait 60s after a Pages deploy (308 cache). Then a private window.
If `/ice` is still 308 after swallow, the leftover is the zone Worker — not another git file.
