# DCLM domain isolation — 2026-08-26 21:40 EDT

One machine. Many dictionaries. No generic five-layer product.

## Law

1. A domain pack is loaded **before** any score.
2. Packs do not inherit each other's objects. Amazon logistics ≠ a school board.
3. Cross-domain only if the **same meter ID** exists in both dictionaries (e.g. `WAIT_STATE_DAYS`, `REKEY_COUNT`). Correlation of stories is graft.
4. Public pages never name a specific board. Internal pack id: `school_board`. Feed id stays vaulted.
5. Friction, affinity, acuity are first-class fields on every meter. A five-layer with those fields empty is not Dualis.
6. Status per instance: `seed` | `lifting` | `live` | `sealed`.
7. Empty pack constraints → `WAIT`. Do not score.

## Packs declared

| pack | object | Pole A | Pole B | until constraints load |
|------|--------|--------|--------|------------------------|
| oncology | indication / protocol | driver, HR, checkpoint | TME, host tox, access | literature P1 + vault M |
| neurological | phenotype / genotype | motor unit, gene gate | supportive care, trial graft | ALS is prototype |
| school_board | process + relationship | actor graph below | statute, shadow sheet, unread report | named feed WAIT |
| amazon_ops | node / SLA | inventory, path | last-mile, returns | no Dualis feed |
| real_estate | parcel / deal | title, rent roll | zoning, rate, vacancy | no Dualis feed |

## school_board actor graph (mandatory on load)

Edges that must exist before a score:

- parent — student
- parent — secretary
- student — secretary
- teacher — secretary
- secretary — principal
- principal — teacher
- principal — student
- teacher — student
- parent — teacher
- board — principal
- statute — process

Missing edge = incomplete pack, not a number.

Meters (board-shaped, not oncology-shaped):

- `SB.WAIT_STATE_DAYS`
- `SB.REKEY_COUNT`
- `SB.SHADOW_SHEET`
- `SB.UNREAD_REPORT`
- `SB.ENDPOINT_MOVED`
- `SB.INVERT_SECOND_RECORD`

## New object protocol

Someone names a cancer / a school / a warehouse:

1. Identify pack.
2. Load that pack's meters only.
3. Attach nearest sealed instances in **that** pack.
4. Fill P1. Label P2 as M.
5. If they ask to compare packs, show only shared meter IDs.

Truth prevails. Residual law is the only peg.
