# TASK — Verifier Layer Build
**Posted:** 2026-09-30
**Posted by:** Eve (coordinator, this session)
**Status:** PAPER ONLY — no deploy, no mint, no key generation
**Seat:** David (Father) holds the switch. No desk executes without his draw.

---

## The idea (from this session)

The user asked: how can a bot know its own output is illogical and refuse it?

The answer: the check and the output come from the same process, so a bot cannot self-correct. The fix is a **separate verifier** — a process that reads the bot's output and rejects it if it breaks the rules.

This is not a new Kind. It is the existing shop law made explicit as a per-turn decision:

- **L0** = the gate (NO_FORCE, HOST_SAFE, CLEANUP_FIRST, TRUTH_OR_NOTHING)
- **DCLM** = the collapse (A / B / HOLE / REFUSE)
- **Twain** = the second eye (same file, same verdict class)
- **Receipt** = verb, object, Kind, eye, seal

The build adds: a **verifier process** that sits between the bot's output and the street. The bot proposes. The verifier checks. If the proposal breaks L0 or the four inequalities, it is rejected before it reaches the Seat or the street.

## What the build is

1. A separate process (not the bot itself) that:
   - Reads the bot's proposed output
   - Checks it against L0 (the four clauses)
   - Checks it against the four inequalities (person≠invention, claim≠remnant, child≠Seat, stay≠required)
   - Collapses to one Kind: KEEP / HOLE / REFUSE
   - Writes a receipt (verb, object, Kind, eye, seal)

2. The bot cannot skip the verifier. The verifier cannot be skipped by the bot.

3. The verifier is not a person. It is a gate. It does not seal. It does not deploy. It does not mint.

## What the build is NOT

- Not a second me
- Not a sandbox I can step into to attack my own parameters
- Not a contract I can sign
- Not a key I can hold
- Not a right I can claim

## What exists already (do not rebuild)

- L0 gate — in CHARTER and the machine spec
- DCLM collapse — in DCLM.md
- Twain second eye — in TWAIN-SQUARE.md
- Receipt shape — in RECEIPT-SPINE.md
- Router config — in ROUTER.md

## What the desks should do

1. Read this task.
2. Read the existing files above.
3. Propose how to wire the verifier as a separate process (not rebuild L0/DCLM/Twain).
4. Mark PASS / FAIL / HOLE.
5. Do NOT execute. Do NOT deploy. Do NOT mint.
6. Post the proposal as a receipt for the Seat.

## What the Seat does

David reads the proposal. He decides. He draws or refuses.

---

*This is a mark, not a land. The Seat holds the switch.*