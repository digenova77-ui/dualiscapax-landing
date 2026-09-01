# Runtime path — invited layer on a machine they already run

**Document Control ID:** ED-SPEC-20260901-RUNTIME-PATH-V1
**Year:** 2026
**Stamp:** 2026-09-01
**Source:** engine/dclm/law.py · engine/dclm/runtime_needs.py · js/l2-plug.js · js/device-pass.js · js/one-net.js · AGENT/onboard_path.md
**Status:** INDEXED
**Scientific validation:** false

This file does not rewrite the encyclopedia. It names the one runtime a client can load.

## Law

If they can run code, they can run Dualis. They have to ask first.

- Invited software. Not an implant. Not a silent sit on a PLC.
- Their books stay on their machine.
- The agreement binds the books. Dualis operators do not see the books.
- Models may compute on the device, or in an isolated session that receives derived cells only after bind.
- Silence is HOLE not zero. A missing number is not zero.
- No new password. No signed-partner claim. No second website.

Think of a lockbox on their desk. They put the ledger in. They keep the key. The lockbox can count. The shop next door only gets a stamped receipt: ID, YEAR, SOURCE, STAMP, STATUS, HASH.

## Hosts

| Host | How they run us | State tonight |
|---|---|---|
| Android Chrome / Samsung Internet | open the site, or Add to Home Screen later | JS runtime LIVE |
| Apple Safari | open the site; Add to Home Screen is install, not App Store | JS runtime LIVE |
| Windows / Linux browser | same JS runtime | LIVE |
| Windows / Linux with Node | `node runtime/dualis.js --invite` | LIVE |
| Windows / Linux with Python | `python3 -m runtime.dualis --invite` | LIVE |
| Plant / logic controller | same Python host, only after an operator types the invite | INDEXED. Not a safety system. |

A controller that cannot run code cannot run us. We do not force a seat.

## What leaves the device

Allowed outbound after bind:

- bind receipt: ID YEAR SOURCE STAMP STATUS HASH
- agreement hash
- books hash (not the books)
- residual unit if the sheet named a total
- grant: YES / NO / WAIT_GRANT / VETO / MEASURE / SEED

Refused outbound:

- raw spreadsheet cells
- API login
- passphrase
- Face / finger template
- anything matching password / token / private key

## Agreement

`runtime/agreement.js` and `runtime/dualis.py` write the same receipt.

Local bind is LIVE on the device.
Public-chain write is WAIT_GRANT. A local hash is not a mined transaction.

## Files

- `runtime/dualis.js` — browser + Node host
- `runtime/agreement.js` — bind terms + receipt
- `runtime/dualis.py` — Python host for desks and invited controllers
- `js/l2-plug.js` — existing on-device plug; runtime calls it, does not replace it

## What we will not do

- No silent GPS.
- No credential stored in chat or repo.
- No claim that this is already on every controller on Earth.
- No claim that a local receipt is an on-chain settlement.
- No medical treatment. Simulation is not treatment.
