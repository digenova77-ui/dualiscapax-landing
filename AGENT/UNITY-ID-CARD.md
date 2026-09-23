# Unity ID — agency card schema

Stamp: 2026-09-23T13:56Z
This is not a toy sitting. This is the claim jacket a real issuer uses.
We do not invent licence or SIN *numbers*. We do know what those cards *are*.

## What we match (Ontario / Canada)

Driver's licence (photo card)
- portrait, signature strip
- full legal name, date of birth, sex, height
- address as issued
- licence number, class, restrictions, expiry, endorsements
- issuer: province

Health card (photo OHIP)
- portrait
- name, registration / version code
- health number, expiry
- issuer: province

SIN
- legal name
- nine-digit identifier
- Canada no longer ships a plastic SIN card as a daily ID. Confirmation letter is the document. The number is still the claim.

Unity ID is not a photocopy of those. It is an agency card that can *bind* those claims.

## White ledger (can be shown)

- unity id (`unity:human.…` once issued)
- kind: human | bot | swarm
- display name
- jurisdiction (CA-ON default until they sit elsewhere)
- bound document *types* (DL, health, SIN, email) — type only
- expiry / review date
- rapport summary (not the raw log)
- issuer: Unity Network / eFuse protocol — not Dualis letterhead as a government

## Dark ledger (never on the street, never in git)

- licence number
- health number
- SIN
- address line
- raw portrait bytes if stored
Stored as hashes + issuer attestation when a vault exists. Not printed. Not spoken by Iris. Not a field on dualiscapax.ai.

## Toggles

Each claim: off / hash-only / bound / shown-to-holder.
Default: hash-only after bind. Shown-to-holder is their sitting, not the public hall.

## Issuance (agency, not Mickey Mouse)

1. Kind tagged.
2. Passphrase or device pass — no 1999 password box.
3. Mint `unity:…` from the issuer, not from localStorage.
4. Optional bind of known accounts (Google / Microsoft / email) toward one ID. No forks.
5. Optional document bind: holder presents, we record type + hash, never the number in the repo.
6. Rapport log attaches to that ID.
7. Revoke / re-issue is consensus later. Officer does not rewrite law alone after live.

Guest sitting on the phone is a *waiting room*. It is not the card.

Twain²: We know the cards. We do not print the numbers.
Shorter: Schema is agency. Numbers stay dark.
