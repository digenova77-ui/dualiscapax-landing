# Unity ID numbering

Backwards compatible with `unity.id.v1` packets that have no `unity` block.

## Seats

| Seat | Public | Human | Status |
| --- | --- | --- | --- |
| Founder reserved | `DC0-Z0-0000` | U0 | NOT verified. Cannot hatch. |
| Operator first | `DC1-H1-0001` | U1 | David John Di Genova. Can hatch. |

U1 does not wait on U0. Lineage note only: founder seat exists; it has not passed Unity verification.

## Hatch

- Format: `DC{scheme}-H{seed}-{serial4}` plus a check nibble.
- Scheme `1` is this document.
- Seed `1` = operator / person bind. Seed `2` = shop. Seed `3` = school. Seed `4` = firm chair.
- Serial is decimal under the hood, padded in the public string.
- First hatch under U1 is `DC1-H1-0001.01` (path `1/1`). Old readers that only know `U1` still match the parent.
- A v1 packet without a number keeps working. Runtime may attach a number later. That is hatch, not a rewrite.

## KYC

Dualis does not run government KYC. The same fields an obliged firm in Canada would ask are collected as a **self-declaration** on the device and handed to a firm when one sits. SIN, licence numbers, and card numbers are not stored in this repo and must not be pasted into public pages.
