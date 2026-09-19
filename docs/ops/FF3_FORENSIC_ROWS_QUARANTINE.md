# Residual R5 — Pre-existing ff3 forensic D1 rows

**Disposition: LEAVE IN PLACE.** Do not delete without an explicit operator order.

## What

D1 database `dualiscapax-fulfillments` holds baseline count `{e:1,ent:1,f:1,g:1}`
from P0 forensic rows (`evt_ff3_*` / `cs_ff3_*`) minted before the
`CHECKOUT_OPEN` park gate. Attack campaigns treat these as **baseline**, not
as live grant proof.

## Why leave

- Deleting without a signed quarantine receipt can erase evidence.
- Counts=1 are noise for delta measurement (probes assert Δ=0).
- Safer quarantine (if ever ordered): export SELECT → object store receipt →
  DELETE in one transaction → re-baseline health. Not authorized this campaign.

## Rule

Agents: **do not** `DELETE FROM entitlements/fuel_credits/grants/events` for
ff3 rows unless the user explicitly orders quarantine with a receipt path.
