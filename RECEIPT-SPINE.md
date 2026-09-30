# RECEIPT-SPINE.md — DualisCapax receipt spine

**Status:** RAIL A (draft, unsealed). Father draws.
**Date:** 2026-09-30
**Root inequality:** attribution ≠ authorization

---

## 1. What the spine is

A receipt is the one object every act in this shop leaves behind.
It answers three questions, in order:

```text
WHO said it?      → attribution (handle field)
WHAT did they do?  → the verb + object
MAY they do it?    → authorization (session grant, if any)
```

The spine is not a new system. It is three fields added to the
receipt shape the shop already uses:

```text
verb, object, Kind, eye, seal   ← existing
+ handle                        ← who (attribution)
+ grant_id                      ← what they may do this session
+ revoked_at                    ← when the grant died
```

---

## 2. The root inequality (do not mash)

```text
 attribution     = who said it
 authorization   = what they are allowed to do
```

A handle on a receipt says "this came from them."
It never says "they may do this."

If a handle starts granting rights, the ID becomes the person
and the person becomes a row in a database. That is the FACE_ID
costume with a new name. CHARTER §3 and STRESS row 3 already
refused it.

---

## 3. Dual pipe on every receipt

Every receipt runs both pipes:

```text
PIPE K (knowledge)   what the act claimed
PIPE E (efficiency)  what it cost — watts, calls, minutes
```

A receipt with no E number is incomplete. A receipt with no K
claim is empty. Both fields are required; neither is a price.

```text
receipt = {
  verb:      "mark" | "prove" | "hole" | "halt" | "leave" | "draw" | "seal",
  object:    <named remnant or named hole>,
  kind:      "KEEP" | "HOLE" | "REFUSE" | "A" | "B",
  eye:       <desk or second eye that fetched>,
  seal:      <Father.draw | none>,
  handle:    <who said it, or "anonymous">,
  grant_id:  <session grant, or none>,
  revoked_at:<when the grant died, or none>,
  k_claim:   <one assertion>,
  e_cost:    {watts, calls, minutes}
}
```

---

## 4. Handle (attribution)

```text
required on every receipt
values:    a named handle, or "anonymous"
meaning:   who produced this mark
NOT:       a login, a wallet, a voter, a census row
```

A guest who never opts in is anonymous. That is allowed.
Anonymity is not a defect; it is Art. 2 facing forward.

---

## 5. Session grant (authorization, scoped)

```text
grant = {
  handle:    <who>,
  session:   <one session id>,
  may:       ["look", "mark", "prove", "hole"],
  not:       ["draw", "seal", "deploy", "pay", "mint"],
  expires:   <session end>,
  revoked:   <none | timestamp>
}
```

Rules:

- A grant is created per session. It dies with the session.
- Revocation is recorded in the revocation log (section 6).
- A revoked grant produces no new receipts; old receipts
  stay fetchable (attribution is not punishment).
- Only Father creates grants that touch draw/seal/deploy.
  Children may hold look/mark/prove/hole grants.
- No grant is required to look. Look is $0 (STRESS 28).

---

## 6. Revocation log

```text
revocation = {
  grant_id:  <id>,
  handle:    <who>,
  at:        <timestamp>,
  reason:    <named, or "session ended">,
  by:        <Father | system>
}
```

The log is append-only. A revocation does not erase the
revoked party's past receipts. It only stops new ones.

---

## 7. What this spine is NOT

```text
NOT a Unity ID issuer
NOT a rights registry
NOT a census
NOT a till
NOT a FACE_ID gate
NOT a second Seat
```

The issuer hole stays a hole. This spine works without it:
a handle is a name on a receipt, not a credential that opens
a door.

---

## 8. Dualis-cut

```text
KEEP    handle + grant + revocation fields on receipts
        dual pipe (K + E) on every receipt
        session-scoped grants, Father-only for seal verbs
HOLE    issuer, minted ID, live grant store
REFUSE  handle-as-right, ID-as-person, census door,
        FACE_ID, grant required to look
```

---

## 9. Next step (Father's verb)

When a real guest session exists, the first receipt with all
fields filled is the proof. Until then this file is RAIL A.

```text
Look   = spine defined
Use    = Father.draw
Stake  = off
street = unchanged
```
