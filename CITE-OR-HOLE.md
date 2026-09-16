# CITE-OR-HOLE

**Floor ID:** `ED-LAW-20260916-CITE-OR-HOLE-V1`  
**Parent:** Layer [0] invariant 4 — `TRUTH_OR_NOTHING`  
**Status:** OPERATING FLOOR · not sealed theater  
**Live mouth:** `cf-pages/` via Git Connect on `main`

This is the closest floor we have. Everything above it is commentary.

---

## The law in one line

A fact is either tied to a checkable cite, or it is an explicit hole.  
Nothing in between. No invented player. No invented path. No invented save.

---

## Cite

A cite is a page a stranger can open.

Must carry:

- `url` — public page, not a bot’s memory
- `fetched_at` / `captured_at` — when we looked
- `ok` — true only if that fetch worked
- `source` — named system (OWHA RAMP, OHF bulletin, Pages deploy SHA)
- `page_title_echo` when the page titles itself

On the plate (`cf-pages/`):

- a path is cited by **one** real file
- `/ice` is cited by `ice.html` only
- `/` is cited by `index.html` only

---

## Hole

If the page does not contain the fact, write the empty in words:

```
Rosters = awaiting_player_cites
law: Echo team names + codes from cite only. No player invent.
```

A hole is valid output. A fill without a cite is a fail-closed.

On the plate, a hole is the 404 plate: *That plate is not here.* Honest. Not a fake rink.

---

## Fail closed

| Input | Verdict |
|---|---|
| URL + timestamp + fact on that URL | Cite — keep |
| URL failed (`ok: false`) | Hole — do not mark ok |
| Player / team / dollar not on the page | Hole |
| Two files for one path (`ice.html` + `ice/index.html`) | Hole the extra. One plate. |
| Redirect `Location` equals request path | Invalid. Self-loop. Delete the rule. |
| Drive / Piñata / zip with no git SHA on `main` | Not a cite for the live site |
| Dashboard template with 0 rules | Not a cite for a 308 |

---

## Two folders

| Tree | Who writes | Cite means |
|---|---|---|
| `src/` + harvest JSON | GitSwarm | Public league/network URL |
| `cf-pages/` | GitMerge | One file per public path |

Swarm does not paint the lander.  
Merge does not invent rosters.  
`main` is the only stamp Pages reads.

Collision in the same minute on the same path = veto. Fetch. Replay on current `main`. Fast-forward only.

---

## Amplitude

- 100% friction: ship the hole rather than the name.
- 100% acuity: the cite must be the same object the human would tap.
- +1 affinity: the next harvest may fill a hole when a new cite appears. It does not backfill from imagination.

---

## Tonight’s proof

- Home `/` 200 — cite exists (`index.html`).
- Ice `/ice` 308→`/ice` — two plates, then one plate restored (`ice.html` only). Await green deploy.
- Page Rules 0/3 — hole. The 308 was Pages pretty-URL, not a dashboard rule we invented.
- Harvest `[skip ci]` — book cite. Not a plate cite until Merge copies it.

---

## Bot standing order

After every push to `main`:

1. One file per public path in `cf-pages/`.
2. No `_redirects` line whose destination is its source.
3. No player invent in harvest JSON.
4. Do not add products.
5. Do not click Cloudflare Rules.

If a check fails: hole + stop. Do not decorate.
