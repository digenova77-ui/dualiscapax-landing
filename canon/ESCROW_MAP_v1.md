# ESCROW_MAP_v1

DCLM bind of 16 Sep 2026 EVM study onto Dualis eFuse.
Does not deploy. Does not smash Home. Look $0. checkout=false.

Parent: TONIGHT_LAW_v1 (`efuse=ESCROW→PURE→SPENT`).
Draft: `research/contracts/DualisResidual.sol`.
Measure: 32-bit AND. No third value.

## Rooms (1)

| eFuse | Residual | Survives the next block |
|---|---|---|
| ESCROW | `live` + `walk()` | client leaves; pot returns |
| PURE | `sign(endsAt)` then `open(save)` | storage clock |
| SPENT | `pay()` or `freeze` or past `endsAt` | anti_reuse |

`active = signed && live && !frozen && now ≤ endsAt`

## Split (1 only after open)

keepBps: 8100 if not opened; 8100+475*y for y<4; 10000 for y≥4.
y = floor((now-openedAt)/365d).
Not a SKU. Not on glass.

## Rooms for bits (1)

| Need | Location | Cite |
|---|---|---|
| Dualis payee | `immutable dualis` | Residual |
| sign/open/save/endsAt | persistent storage | Residual |
| optional nonReentrant on pay | EIP-1153 transient (kennel tweak) | 1153 Final; unused in draft |
| Look / dry-run | no chain | look=empty_until_row |

## Not this tree (0 if claimed as Dualis SoR)

- EIP-1153 T* = tx scratch. Cannot hold PURE.
- EIP-7609 = stagnant T* slope. Quote 100/100 until Final.
- EIP-2935 = 8191 parent hashes in state. Not endsAt.
- Verkle / EIP-6800 = not mainnet. Dualis Merkle under tipped root ≠ Ethereum Verkle ≠ MPT.
- rfc8693 = not PURE.

## Holes (named, do not fill with speech)

- awaiting_bytecode_verify of Residual
- awaiting_attestor (who may open)
- awaiting_mutual_zero two-key burn
- awaiting_unfreeze
- FOREST signed-contracts empty
- Stripe checkout closed

## Factory next (Clock A kennel)

1. Foundry: walk before sign refunds; sign disables walk; pay requires open; freeze blocks pay.
2. Do not add `transient` to Residual until pragma ≥ 0.8.28 and a cited lock need.
3. Plate face if a row exists: state · vintage · endsAt · receipt. No bps. No pot.
4. Clock B Pages ≥90 min. Additive only. Apex 200 do not smash.

## Collapse

Hygiene complete → 1 else 0.
Speech that treats Residual as live till is residual.
