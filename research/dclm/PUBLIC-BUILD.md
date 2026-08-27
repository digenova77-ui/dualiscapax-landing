# DCLM public build — know it before you score it
2026-08-26 21:54 EDT

Running a model against a firm whose mechanism Dualis has not read is futile.
Do not score. WAIT. Read. Then mint the tweak.

## Compare is an ask, not a default

If Walmart asks "how do we compare to X" → load X as a second instance and smash only shared operated meters.
If they did not ask → do not run vs Amazon. Use the Amazon tweak only as **template shape** (control split, department rows, intent gate).

## Build a public firm (NYSE / Nasdaq / SEDAR class)

P1 sources, in order:
- audited filings (10-K / 10-Q / AIF / MD&A)
- 8-K material events
- described segments and how they say they make money
- what they say they do **not** operate

Investor-deck color is P2/M until it matches a filing.
Press is not a segment map.

Mint `tweak.business.<sector>.<subsector>.<firm>` only after that read can name: segments, A/B control split, absent Amazon-only (or peer-only) functions.

## Bottom-up, not top-down industry fiction

1. Firm tweaks from public record + any instance feed they grant.
2. Other firms in the same kind of work, each from their own record.
3. Shared meters that survived smash → sector tweak.
4. Shared meters across sectors → industry tweak.

Do not start with an "industrials model" and pour Walmart into it.

## Honest bound tonight

Amazon pack is a skeleton + control split. Dualis has not ingested Amazon's 10-K into a scored run. "Understand everything about Amazon" is the target for that pack, not a completed fact.
Same for Walmart: no scored Walmart tweak until the filing read exists.
