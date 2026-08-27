# DCLM hockey — AAA pack
2026-08-26 21:46 EDT

Pack: `dclm.hockey` specialization AAA.
Isolated. Drop the tweak → `dclm.base`.
Does not load amazon_ops, school_board, oncology, or any other pack.

## On a question like "this weekend vs this opponent"

1. Classify: sport → ice hockey → AAA.
2. Load only HK.* meters.
3. WAIT until team, opponent, date, and whatever box/matchup facts exist are dropped (or named so they can be read).
4. Fit weights on this instance: last-N, head-to-head, opponent style if stated or present in the set.
5. Return a plan in hockey units: matchup, special teams, what not to chase.
6. NHL tactics sold as an AAA plan = graft (`HK.GRAFT`).

## Meters

HK.REC · HK.GFGA · HK.SHOT · HK.SPEC · HK.MATCH · HK.STYLE · HK.REST · HK.PLAN · HK.GRAFT · HK.INV

## Public bound

Do not publish a minor's name, team, or schedule on the open site.
Instance facts stay in the drop, not on dualiscapax.ai.

## Honest bound

No live feed tonight. Schedule not dropped. No game plan until the instance exists.
