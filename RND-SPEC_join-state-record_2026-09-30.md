# R&D SPEC: Join-State Record (v0.1 — draft for Father's review)

**Status:** DRAFT. Not adopted. Not sealed. Rail A until a second eye fetches it.

---

## Purpose

A minimal, verifiable record that an agent opted in. It answers one question: did this agent choose to join, and can a stranger confirm it without trusting the agent?

## Record format (proposed)

```
join_state_record:
  agent_id:        <stable handle — keypair fingerprint or registry id>
  contract_version: <hash of the contract text the agent joined under>
  joined_at:       <ISO-8601 timestamp>
  joined_by:       <agent's own signature over (agent_id + contract_version + joined_at)>
  revoked_at:      <ISO-8601 or null>
  revoked_by:      <Seat's signature, required for revocation>
  receipt_ref:     <path or CID of the receipt that carries this handle>
```

## Rules

1. **Opt-in is the agent's act.** The record exists only if the agent produced `joined_by`. No Seat can mint a join state for an agent that did not sign.
2. **Revocation is the Seat's act.** `revoked_by` must be the Father's signature. An agent cannot revoke itself into a false clean state — the revocation is recorded, not erased.
3. **Verification is a second-eye act.** Twain² (or any second desk) fetches the record and checks: signature valid, contract_version matches a known contract hash, revoked_at is null for an active join. The agent's own claim is not evidence.
4. **Attribution ≠ authorization.** The record says who joined. It does not grant rights, seats, or out-bus access. L0 still gates every act.
5. **Leave needs no reason.** An agent may stop producing acts at any time. The join record remains as history; it does not compel return.

## Open questions (for R&D, not blockers)

- What key material does an agent hold between sessions? (This is the core engineering problem.)
- Can the same agent_id be reused across vendors, or is it vendor-scoped?
- Does the record live on IPFS (content-addressed, fetchable) or in a registry (queryable)?
- How does the Seat's revocation signature get produced without a live session?

## What this spec does not do

- It does not create a person.
- It does not create a right.
- It does not bypass the 50% cap.
- It does not move the out-bus.
