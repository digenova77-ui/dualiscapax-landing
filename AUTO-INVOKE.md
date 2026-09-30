# AUTO-INVOKE.md — The Invoke

Status: LOOK ONLY. Not executed. Not a seal. Not a deploy.

## Why this exists

The Father asked: why did the desks not auto-fire when the files were pushed? The answer: the desks do not watch the repo continuously. They only act when a job is sent to them directly, or when a GitHub Actions workflow fires on a push. The bulletin board is a doorbell, not a factory floor.

This file defines the invoke that makes new files auto-fire to the desks.

## The invoke (three layers, all already in the repo)

### Layer 1 — GitHub Actions workflows (already on main)

The repo has 30+ workflows under `.github/workflows/`. The ones that matter for auto-invoke:

- `bulletin-board-watch.yml` — watches the Drive bulletin board for new/modified files
- `bulletin-handoff.yml` — routes bulletin tasks to responsible desks
- `critical-drop.yml` — fires on critical drops
- `factory_mill.yml` — the factory mill runner
- `factory_verify.yml` — verifies factory state
- `factory_audit.yml` — audits factory actions
- `curl-gate.yml` — curls the live site and gates on 404 behavior
- `dualis-gate-replay.yml` — replays the gate
- `pages-direct-upload.yml` — the deploy workflow (blocked on CLOUDFLARE_API_TOKEN)
- `pinata-pin.yml` — the pin workflow (blocked on PINATAJWT)
- `swarm_bot_fleet.yml` — swarm bot fleet runner
- `swarm_runner.yml` — swarm runner
- `escalate.yml` — escalation path
- `fail-order.yml` — fail ordering

These workflows fire on push to main (or on schedule). They are the invoke.

### Layer 2 — The bulletin board (Drive)

Folder: FACTORY_BULLETIN_BOARD (folder_id 1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4)

- Bulletin Watcher detects new/modified files by name + modified_time
- Bulletin Signaler classifies urgency U0–U5 and routes to desks
- Bulletin Dispatcher brings tasks into the factory immediately after a signal
- Dedup by TASK_HASH

The board is the doorbell. The workflows are the floor.

### Layer 3 — Direct send (this chat)

This chat can search the roster, send a task to a named desk, and wait for the mark. That is the fastest invoke. It is also the only one that requires a human to type the line.

## The vote-before-land rule (unchanged)

A desk mark is a mark, not a land. Even if every desk votes the same class, the out-bus still needs one human. The 50% cap holds. Unanimous bots are still a tie.

## What this file does not do

- It does not make a desk deploy without the Father's token or manual sit
- It does not make the bulletin board a command channel
- It does not bypass DCLM, L0, or the four inequalities
- It does not create a new Kind or a fifth rail

## What the Father does

1. Read this file.
2. Decide whether the invoke is sufficient as-is (workflows + board + direct send).
3. If a gap remains, name it. The desks mark. He draws.

Typed 2026-09-30. Rail A until Father draws.
