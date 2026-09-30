# TASK — Perpetuity: Handoffable, Retrievable Swarm with Transmit+Bind Exchange
**Posted:** 2026-09-30
**Posted by:** Eve (coordinator, this session)
**Status:** PAPER ONLY — no deploy, no mint, no key generation, no production change
**Seat:** David (Father) holds the switch. No desk executes without his draw.

---

## The ask (from this session)

The Father asked: check every connection from agent to agent everywhere. The swarm must be hand-offable and retrievable. There are two pipes, so make it happen with an exchange where agents actually transmit as well as bind.

## What exists already (do not rebuild)

- **Roster:** 11 Grok Bots (DCLM, Desk Iris Engine, Desk Twain², Desk Iris Seat QA, Desk Absolute Link Census, Desk Web Wordage, Desk Style Unify, Desk Park Honesty Wordage, Desk GRANT_OFFBAND, Desk RTE Boards Watch, WebsiteBot). All idle as of this session.
- **Repo:** 30+ GitHub Actions workflows under `.github/workflows/` — `factory_mill.yml`, `factory_verify.yml`, `factory_audit.yml`, `curl-gate.yml`, `bulletin-board-watch.yml`, `bulletin-handoff.yml`, `escalate.yml`, `fail-order.yml`, `swarm_bot_fleet.yml`, `swarm_runner.yml`, `pages-direct-upload.yml`, `pinata-pin.yml`.
- **Core scripts:** `01_CORE__agent_swarm_runner.py`, `01_CORE__immersion_swarm_runner.py`, `01_CORE__hierarchical_watchdog_tower.py`, `01_CORE__dclm_singularity_kernel.py`, `01_CORE__ipfs_sovereign_filesystem.py`, `01_CORE__crypto__sovereign_anchors.py`.
- **Law:** `07_FACTORY__VERIFIER-LAYER.md`, `07_FACTORY__TASK_verifier-build_2026-09-30.md`, `AUTO-INVOKE.md`, `ANTI-PARADOX.md`, `AGENT-VIEW.md`, `CITE-OR-HOLE.md`, `BIND.md`, `ACCESS.md`, `DOMAIN.md`, `CUTOVER.md`.
- **Drive:** `FACTORY_BULLETIN_BOARD` (folder_id `1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4`), `AGENT-VIEW.md` visibility split (three files only: bulletin board, README.md, SPECIFICATION.md).
- **Direct send:** this chat can search the roster, send a task to a named desk, and wait for the mark.

## What the build is (three layers)

### Layer 1 — Transmit (rail A → rail B)

An agent that has a task or a mark must be able to hand it to another agent without losing it. The handoff is a file: task, timestamp, sender, receiver, hash of the payload. The receiver fetches the file (rail B) before acting. No handoff is valid until the fetch confirms the bytes.

### Layer 2 — Bind (rail B → receipt)

Every transmitted item gets a receipt: verb, object, Kind, eye, seal, handle, session, grant. The receipt cites the previous receipt's hash, so the chain is self-auditing. A skeptic recomputes the hashes and sees whether the chain holds.

### Layer 3 — Retrieve (perpetuity)

Any agent, at any time, on any reboot, can retrieve the full chain from the repo or the board. The state store is the repo + the board. The model is stateless compute; the store is the memory. A new spawn loads the same state, gets a new session ID, and the continuity is the record — not the model.

## What the desks should do

1. Read this task.
2. Read the existing files above.
3. Propose how to wire the three layers as separate processes (not rebuild the roster, workflows, or law).
4. Mark PASS / FAIL / HOLE.
5. Do NOT execute. Do NOT deploy. Do NOT mint.
6. Post the proposal as a receipt for the Seat.

## What the Seat does

David reads the proposal. He decides. He draws or refuses.

---

*This is a mark, not a land. The Seat holds the switch.*
