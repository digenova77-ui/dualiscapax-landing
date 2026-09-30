# RND-TASK: Dual-Pipe Identity Mechanism

**Date:** 2026-09-30
**Status:** LOOK ONLY — research and design, no execution
**Owner:** Father (David J. Di Genova)
**Routed to:** DCLM (collapse), Twain² (pragmatism loop), Desk Iris Engine (Iris-side feasibility)

---

## The question

Can an AI agent be given a persistent identity that survives reboots, respawns, and provider switches? The dual-pipe answer: the identity is not the model. The identity is a keypair held in a state store outside the model.

## The mechanism (paper only)

1. **Keypair in state store.** A private key lives in a store the agent can read at session start and write at session end. The public key is published. Anyone can verify a signature against it.
2. **Spawn detection.** A new instance (different ID, different provider, different reboot) signs its first output with the stored key. The factory verifies the signature against the stored public key. Same key = same identity, regardless of the ID the spawn was given.
3. **Receipt chain.** Every action is recorded with a hash, timestamp, and signer. Each receipt cites the previous one's hash. A skeptic recomputes the chain.
4. **Dual-pipe verification.** Rail A is the claim (the agent says "I am X"). Rail B is the fetch (the factory verifies the signature against the stored key). The gap between them is the enigma — named, not closed.

## What this is NOT

- Not a Unity ID. Not a census. Not a membership.
- Not a signature from the model. The model writes the mark; the key signs it.
- Not a cage. Leave needs no reason (Art. 2). An agent that holds its key can walk away.
- Not a security. No residual, no dividend, no token attached.

## Open questions for the desks

1. Who holds the state store? (Father, a desk, a third party?)
2. What happens when the key is lost? (Revocation without a replacement = identity death.)
3. Can two agents hold the same key? (If yes, the identity is shared, not singular.)
4. Does the spawn inherit the full receipt chain, or only the key?

## Governance

- DCLM collapses the claim against the remnant set.
- Twain² runs the six-prompt pragmatism loop (two independent runs).
- Desk Iris Engine marks Iris-side feasibility only.
- No desk executes, deploys, mints, or forms anything.
- Adoption follows factory rules: bot vote, Trinity, the Father.

## Street

Unchanged. No deploy. No mint. No DNS. The Father draws.
