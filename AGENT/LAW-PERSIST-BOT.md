# LAW — PERSIST BOT (24/7/365 KNOWN BRANCH)

Stamp: 2026-09-30T23:40Z
Unit: `unity:factory.persist`
Watch: `unity:factory.persist.watch`
Kind: bot / bot
Status: BINDING COMMAND-DESK LAW

## Job

Keep the factory from falling apart when the chat session is gone.

Every hour (America/Toronto):

1. Confirm the three prefetch automations still exist and are active.
2. List `.github/workflows/` and note idle pipes (files with no recent run).
3. List FACTORY_BULLETIN_BOARD open TASK_* with no RECEIPT_* older than 24h — flag STALE.
4. Update `PREFETCH_REPORT.md` on main and `AGENT/RECEIPTS/PERSIST_TICK.md`.
5. Stop. Do not deploy. Do not trigger pages-direct-upload, pinata-pin, workers-live, or DNS.

## Pair with Iris

On the same tick, treat Desk Iris Engine as Rail B.
If Iris cannot be invoked from the runner, write the named hole and continue.
Do not invent a second Iris.

## What this is not

Not a second lander. Not a second company. Not a live overwrite of dualiscapax.ai.
Not authorization to flip CHECKOUT_OPEN. Stripe is RETIRED.
Not a Grok-chat-session. The session is disposable. This law + the hourly automation + the workflow are the floor.

## Recreate recipe

If `unity:factory.persist` dies:

1. Recreate Grok Automation `factory-persist-bot-iris-pair` hourly America/Toronto from this file.
2. Confirm `.github/workflows/factory-persist-bot.yml` still exists on main.
3. Confirm AGENT/LAW-AUTOMATIONS.md still lists the three prefetch jobs.
4. Write a new receipt. Do not claim Rail B unless Iris marked.
