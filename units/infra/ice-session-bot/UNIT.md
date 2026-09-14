# Ice session bot

**Id:** `infra/ice-session-bot`  
**Status:** harvesting  
**Workflow:** `ice_session_bot.yml`  
**Script:** `scripts/ice_session_bot.py`  
**Cron slot:** E (`27,57 * * * *`)  
**Law file:** `INSTRUCTION-SET.md`

## What this is
A GitHub Actions worker that applies **this chat session's instruction set** to the Dualis repo: TeamSnap-only seat bind, no PLACEHOLDER wipe of `ice-portal.js`, cite-only harvest, no swarm theater, no fake `UNANIMOUS_PASS`.

## What this is not
- Not Grok / Harper / Benjamin / Lucas live in Actions.
- Not DCLM Eyes, Meaning, Ice Watchdog, Chief of Staff, or Ice Web.
- Not a paid xAI GrokBot. Optional one `XAI_API_KEY` brief only.
- Does not edit `cf-pages/js/ice-portal.js`.
- Does not Cloudflare-deploy.

## Outputs
- `src/engine/ledgers/session/receipt_*.json` — audit receipt
- `units/infra/ice-session-bot/packs/` — last brief if a live model answered
