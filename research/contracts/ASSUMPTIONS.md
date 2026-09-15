# DualisResidual — assumptions (loud on purpose)

This is a draft. It is not deployed. It is not a till.

## What the code is allowed to know
- A measured save amount, posted by an attestor Dualis and the client both accepted.
- Year index since first measured save.
- The one residual: client keep 81% Y1 → 100% Y5. Dualis slice is the remainder (10% work + 10% royalty while it lasts).

## What the code cannot know
- Whether her minutes were real. That is the study.
- PHIPA / HIPAA charts. Never.
- A private rate. None exists.
- How fast they recover. Speed is off-chain. Year index only tracks calendar of a save that already exists.

## Trust
- Attestor can lie about the save. Mitigations: both parties appoint; either may dispute and freeze; CPA may replace. This is not trustless leftover. Anyone who says it is, is selling.
- Admin pause is a circuit breaker, not a second rate.
- No Dualis token. No mint. No float.

## Not in this file
- Look. Look is $0 off-chain.
- Deploy address. None until verified + tests + audit.
