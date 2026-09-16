# SHARE TOGGLE — classroom interoperability

Sara may share a working card with a parent, an EA, or a board official.
Dualis does not become the SIS. Default is OFF.
A grant is a named seat + named fields. Not “post the class to the internet.”

Look $0. No student string in git. Dualis ≠ coin. Home not smashed.

## Simple row (one tap)

| Seat | What OFF means | What ON can mean (if she expands) |
|---|---|---|
| Parent / caregiver | nothing leaves the phone | report draft + next step she marked shareable |
| EA | nothing | grouping + accommodations she marked shareable |
| Board official | nothing | working copy she chose — official book still Aspen/OSR |
| Other board (triboard ring) | nothing | only if that child actually moves / that official is named |

Triboard (HPEDSB / ALCDSB / Limestone) is **theme + domain on the bind door**, not one kid database across three boards.

## Granular (expand)

Per card, per field:

- marks draft
- learning style / strengths / needs
- class interoperability (worksWith)
- homeForSchool
- IEP working copy

homeForSchool and IEP default stay OFF even if the simple row is ON.

## How a grant actually moves (holes named)

1. She unlocks phrase.
2. She toggles a seat + fields.
3. Device writes `dc.sara.g2.grant.${name}` with seats, fields, at, revoked=false.
4. Channel is `awaiting_channel`: show-the-phone, encrypted export she chooses, or later board OIDC.
5. Dualis servers do **not** store the card. Unity ID of the other human is the door, not an email list in git.

`awaiting_board_oidc` · `awaiting_parent_phrase` · `awaiting_ea_seat`

Revoke = toggle OFF. The local grant dies. We cannot unsay a screenshot they already took — say that on the glass.

## AND before any live control

Phrase · teacher confirm · default OFF · no names in commit · no Dualis-hosted child file · board book official · Iris off these cards.
