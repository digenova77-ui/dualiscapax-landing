# Iris handoff status

**Status:** lander client handoff **IMPLEMENTED 2026-09-12** in pages deploy (`js/iris-handoff.js`).

## Ladder (client)

1. **house** — firm KB / canned match (persona unchanged)
2. **fuel-gate** — heavy compute triage; no free Grok
3. **Grok** — BYOK (`DCByok.chat` · `grok-4-fast`) or gateway `POST /api/iris` / `https://dualiscapax.ai/api/iris` when funded
4. **free-ai** — `https://text.pollinations.ai/` GET, Iris system prefix, ~500 char cap, max **8** calls / browser session (`sessionStorage` `dc.iris.free.llm`)
5. **exhausted** — house default + badge: OPEN free scope / BYOK or Fuel for Grok depth

Return shape: `{ answer, badge, badgeColor, followUps, rail }` with `rail` ∈ `house|grok-byok|grok-gateway|free-ai|fuel-gate|exhausted`.

## Product law pointers

- `research/IRIS-CAPABILITY.md` — Fuel scales engine, not persona; OPEN = Fuel 0
- `docs/FUEL.md` — settlement faces / packs
- `workers/iris-gateway/FALLBACK.md` — worker-side rail handoff
- `ACCESS.md` — access layers

## Voice (lander)

- Loads `js/dsap-engine.js` + `js/iris-av.js` (same stack as `ai/app.html`)
- `speakText()` prefers `IrisAV.speak` + `DSAP.unlock` on user gesture; falls back to `speechSynthesis`
- Respects `SENSOR_STATE.voice` mute / **NO_FORCE** (no autoplay)

## Fuel floor

- `js/fuel-ledger.js` **START = 0** (OPEN truly free-floor; packs add later)

## Operator note

Worker secrets remain operator-side (`wrangler secret`). House key default **off**. No API keys in git/zip.

## Deploy surface

Cloudflare Pages slim zip: `dualiscapax-pages-slim.zip` from `build/pages-slim/`.
