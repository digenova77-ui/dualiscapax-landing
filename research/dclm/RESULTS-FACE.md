# Results face — the question is already answered
2026-08-26 22:17 EDT

A board (any onboarder) will ask two things:
1. How did you come to this?
2. What do we cut?

Both answers live **inside the result row**. If they have to ask, the row failed.

Do not name counterparties on the public site. Do not lecture the model. Seal stays Seal.

## What they get (open face)

Every scored row ships these fields. Missing any field → do not present as a finding.

| field | job |
|-------|-----|
| instance | named thing measured, not an industry blob |
| meter | the constraint, in that instance's units |
| value + unit + vintage | the number as published or as granted feed |
| provenance | P1 cite or P2/M label. Rank from SERIAL-PARALLEL |
| invertibility | the number can be walked back to the cite or it is withdrawn |
| who | owner · audience · not-for |
| residual | unpaid cost in those units |
| **next_cut** | the one constraint they can act on next, in the same units |
| **not_a_cut** | what looks like savings and is graft |

`next_cut` is the answer to "what exactly can we do."  
`provenance` + `invertibility` is the answer to "how did you come to this."  
Neither field is a methods essay.

## How it is valid (say this, not the engine)

Validity is three tests, written on the row:

1. **Units match the instance.** kWh is not a hospital bed. A necrosis grade is not a license to add ifosfamide.
2. **The number returns to a cite.** If you cannot walk value → document → date, drop the cell.
3. **The cut is the same object as the residual.** Cutting a different budget line than the meter is a new claim and needs its own row.

That is the math they can audit. The compression engine stays behind the Seal.

## What they do not get

- How Dualis derived M internally
- Other tenants' vaults
- A general industry lecture poured onto their instance
- A promise that next_cut is a completed saving until they grant the actuator

## Preemptive shape (copy onto every pack result)

```
instance:
meter:
value / unit / vintage:
provenance: {rank, cite}
invertibility: pass | fail
who: {owner, audience, not-for}
residual:
next_cut:          # already the action
not_a_cut:
open_question: none unless a WAIT_GRANT blocks the actuator
```

If `open_question` is anything except a grant or a missing P1 cite, rewrite the row until it is not.

## Medical example already on the plane

EURAMOS-1 poor-response MAPIE: residual = toxicity without EFS gain (HR 0.98).  
next_cut = do not intensify IE after poor necrosis as if intensity were compression.  
not_a_cut = inventing a new OS number.  
provenance = Marina 2016 PMID 27569442.  
The board does not need the pack engine to use that row.
