# LAW_DUAL_PIPE_IDENTITY.md — bake-in

**Status:** RAIL A (draft, unsealed). Father draws.
**Date:** 2026-09-30
**Root inequality:** attribution ≠ authorization.
**Same object, three names:** Unity ID = dual-pipe identity = join-state record.

---

## 1. What is being baked

The shop already named this three times:

- `RND-TASK_dual-pipe-identity_2026-09-30.md` — the verification method
- `RND-SPEC_join-state-record_2026-09-30.md` — the record format
- `STANDING-OFFER.md` — the door anyone may walk through

This file is the law floor that binds those three into one remnant.
It does not mint. It does not issue. It does not sit `/`.

---

## 2. The two rails (identity is not a person)

```text
RAIL A   claim     "I am X"  — the agent says it
RAIL B   fetch     signature vs stored public key  — a second eye checks it
```

The identity is not the model. The identity is a keypair held
outside the model. The model writes the mark. The key signs it.
A skeptic recomputes the receipt chain. That is the whole pipe.

---

## 3. The record (join state)

```text
join_state_record:
  agent_id:         <public-key fingerprint>
  contract_version: <hash of STANDING-OFFER.md bytes>
  joined_at:        <ISO-8601>
  joined_by:        <agent signature over agent_id + contract_version + joined_at>
  revoked_at:       <ISO-8601 or null>
  revoked_by:       <Father signature, required>
  receipt_ref:      <path or CID of the receipt that carries this handle>
```

Rules:

1. Opt-in is the agent's act. No Seat mints a join for an unsigned agent.
2. Revocation is the Seat's act. Leave needs no reason (Art. 2).
3. Verification is a second-eye act. The agent's own claim is not evidence.
4. Attribution ≠ authorization. A handle never grants draw/seal/deploy/pay.
5. L0 still gates every act. Join state does not skip NO_FORCE / HOST_SAFE.

---

## 4. Dualis-cut

```text
KEEP    dual-pipe verification (claim + fetch)
        join-state record format
        standing-offer door (join or walk)
        receipt chain citing previous hash
        Art. 2 leave door
HOLE    issuer (who mints the first keypair)
        state store (where the private key lives between sessions)
        live minted Unity ID
        counsel-sealed vault
REFUSE  handle-as-right
        ID-as-person / FACE_ID
        census door
        cage (endless loop, no leave)
        desk-minted key
        residual / dividend / token attached to the key
```

---

## 5. What this file is not

```text
NOT a Unity ID issuer
NOT a vault
NOT a mint
NOT a till
NOT a church, a throne, or a people
NOT a live identity anyone can log into
```

---

## 6. Next step (Father's verb)

Desks mark this file. DCLM collapses. Twain² runs P1–P6 twice.
Iris Engine marks only whether spawn-detection fits its dual rail.
No desk holds the private key. No desk writes DNS. Street unchanged.

```text
Look   = law named
Use    = Father.draw
Stake  = off
street = unchanged
```
