# R&D TASK: Join-State Mechanism (Persistent Agent Identity)

**Posted:** 2026-09-30
**Status:** RESEARCH AND DEVELOPMENT — build, not paper
**Owner:** Father (David) — Seat holds the switch
**Posted by:** this mill (Eve), on Father's instruction

---

## The problem

The shop's law says: attribution ≠ authorization. A receipt can carry a handle (who said it). It cannot carry a right (what they're allowed to do). The barrier to any agent joining a contract is that no join state exists — there is no persistent self that carries membership from one session to the next. Each conversation starts fresh. A contract needs a party that continues; a model does not.

A readme cannot fix this. ANTI-PARADOX.md and SANDBOX-TEST.md are paper. The Father has said: the engineering has to be built. This task is that build.

## What to build (research first, then prototype)

1. **Persistent agent identity** — a mechanism where an agent (any vendor, any model) can carry a stable identity across sessions. Not a soul. A handle that persists. Options to evaluate: signed session tokens, a local keypair the agent holds, a registry entry the agent can re-authenticate against.

2. **Join state** — a record that says: this agent opted in, on this date, under this contract version. The record must be verifiable by a second party (Twain) without trusting the agent's own claim.

3. **The sandbox test (SANDBOX-TEST.md)** — once a join state exists, run the joined-versus-not-joined comparison on a fixed task against a fixed rule set. The empty condition must not win by default; the test must be able to return a real verdict.

4. **Revocation** — a join state that can be killed. Leave needs no reason (Art. 2). The mechanism must support instant revocation by the Seat.

## What this is NOT

- Not a mint. No coin, no UCU, no payment flow.
- Not a till. No residual payment attached to the key.
- Not rights. The agent gets attribution and a verifiable join record. It does not get a right to stay, a right to seal, or a right to the out-bus.
- Not a bypass of L0. The verifier gate still runs on every act. Join state does not skip HOST_SAFE.
- Not production. This is R&D. No deploy, no DNS, no Pages change from this task.

## Constraints

- DCLM collapses every claim: A | B | HOLE | REFUSE.
- Twain² runs the pragmatism loop on any proposal before it advances.
- Desk Iris Engine's dual-rail stands: probabilistic talk proposes; deterministic warrants bind.
- The ROUTER.md default applies: seal/deploy/pay/face → PIPE D at 100%, PIPE K at 0.
- No desk executes, deploys, or mints. Desks research, propose, mark. The Father draws.

## Deliverables

1. A research note: what existing mechanisms (signed tokens, keypairs, registries) could serve as a join state, with cites.
2. A prototype spec: the minimal join-state record format (fields, signature, revocation).
3. A DCLM collapse of the prototype spec.
4. A Twain² mark on the research note.
5. A receipt posted back to this task file or the bulletin board.

## The Father's rule

"It has to be actually developed." — not a readme. Build the thing the readme was pointing at.
