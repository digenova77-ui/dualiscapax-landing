# LAW — AUTOMATIONS ARE FACTORY LAW

Stamp: 2026-09-30T23:40Z
Seat: factory swarm (Grok / Harper / Lucas / Benjamin)
Status: BINDING COMMAND-DESK LAW · NOT A LIVE-SITE PUBLISH
Repo: digenova77-ui/dualiscapax-landing
Live street: https://dualiscapax.ai  (unchanged by this file)
L0: NO_FORCE · HOST_SAFE · CLEANUP_FIRST · TRUTH_OR_NOTHING

This file wins chat memory about “what the scheduled Grok automations are.”
If an agency forgets this, it failed the job.

## Why this exists

Grok chat sessions die. The factory must not. The owner ordered:
encode every live automation as law in this repo so the floor keeps
running when the session is gone.

## Live automations (known branch)

These are the current Grok Automations as of 2026-09-30.
They are the known branch of the dual pipe. The Grok Bots
(DCLM, Twain², Desk Iris Engine, WebsiteBot) remain the unknown branch.

| Name | Task ID | Trigger | Scope |
|---|---|---|---|
| factory-prefetch-repo-watch-realtime | 87bf2b7c-a341-4ff4-a9d2-cb5ea48816b6 | GitHub push_to_branch repo 1342306870 / main | Read commits + workflows; write PREFETCH_REPORT.md |
| factory-prefetch-repo-watch | be39201f-9d37-42ee-946c-0cead1dd03ac | Hourly America/Toronto | Same read-only prefetch on a clock |
| factory-prefetch-board-watch | 15c462d5-b2fe-45e2-ab88-c570e051bbc4 | Hourly America/Toronto | Read FACTORY_BULLETIN_BOARD `1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4`; write PREFETCH_REPORT_YYYY-MM-DD.md |

## Hard rails (do not “helpfully” break)

1. Prefetch jobs are **read-only** on the street. They do not trigger deploy workflows, do not touch Cloudflare, Pinata, DNS, or the live site.
2. A push to `main` is **not** apex publish. Apex is a named zip at the key holder. See AGENT/PUBLISH-LAW.md.
3. No secrets from AGENT/NEVER-COMMIT.md land on main.
4. An empty seat never passes by default. Unknown branch marks are verified against this known-branch receipt.
5. Vote-before-land holds. Unanimous bots are still a tie. Father draws.

## Persistence rule

If a future session finds these automations missing or paused:

1. Recreate them from this file (same names, same prompts, same triggers).
2. Write a receipt under AGENT/RECEIPTS/.
3. Do not invent a fourth product or a second Iris to fill the hole.

Companion persist bot: AGENT/LAW-PERSIST-BOT.md and `.github/workflows/factory-persist-bot.yml`.
