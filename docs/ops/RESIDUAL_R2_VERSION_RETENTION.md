# Residual R2 — Old Worker versions deployable

**Script:** `dualiscapax-stripe-fulfill-v2`  
**Serving (do NOT delete):** `5599c24d-0dd6-49fa-9837-a73d3551851e`
etag `60a7253b…` — `CHECKOUT_OPEN=false`, D1 bound.

## Inventory (2026-09-19 EDT observe)

| Version ID | # | CHECKOUT_OPEN | D1 | etag vs serving | Class |
|---|---|---|---|---|---|
| 5599c24d-0dd6-49fa-9837-a73d3551851e | 315 | false | yes | **serving** | KEEP |
| ba0df0b9-5452-4827-9e63-4303b0312a4e | 316 | false | no | same etag, no D1 | non-serving |
| 9f37097a-1bf6-4ddd-bb4a-efe017168e50 | 312 | false | yes | different (deb00932…) | parked earlier |
| ae26e1d8-b591-4a3a-b27e-f6a900a909f2 | 298 | **absent** | yes | 8adbe560… | **pre-park** |
| 82b030be / 5d845442 / 0d551d8e / 3b9a94c4 | 308–311 | **absent** | mixed | 84d4e2b4… | **pre-park** |

## Delete attempt

`DELETE .../workers/scripts/dualiscapax-stripe-fulfill-v2/versions/{id}`
→ **HTTP 405** `Method not allowed for this authentication scheme`
(error code 10405).

**Conclusion:** Safe API delete of non-serving versions is **unavailable**
with current auth. Do not attempt dashboard mass-delete without operator.
Mitigations: keep serving parked; R3 admit gate before redeploy; never
`versions deploy` a pre-park etag.

**Status:** Listed + delete unavailable documented = **VERIFIED** (observe).
Threat remains until CF allows delete or versions age out — residual
**OPEN at platform**, closed as ops documentation.
