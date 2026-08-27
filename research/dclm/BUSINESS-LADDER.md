# DCLM business ladder — sector packs, firm instances
2026-08-26 21:49 EDT

Once `dclm.base` is declared and invertibility holds, the important object is the **tweak index**.
Forbes/Fortune-scale companies are instances dropped onto a sector tweak. They are not 500 bases.

## ID

`tweak.business.<sector>.<subsector>`
Instance (usually vaulted): `tweak.business.<sector>.<subsector>#<firm>`

Do not mint a live score for a firm with n = 0. Name on a public page is not required to have the pack.

## Sector tweaks (seed — GICS-shaped, not a Forbes scrape)

| id | examples of sub-tweaks |
|----|------------------------|
| tweak.business.energy | upstream, midstream, downstream, utilities |
| tweak.business.materials | chemicals, metals, packaging |
| tweak.business.industrials | aerospace, machinery, logistics |
| tweak.business.consumer_discretionary | auto, retail, restaurants, lodging |
| tweak.business.consumer_staples | food, beverage, household |
| tweak.business.health_care | pharma, devices, managed care, services |
| tweak.business.financials | bank, insurance, asset_mgmt, payments |
| tweak.business.information_technology | software, semis, hardware, IT_services |
| tweak.business.communication | telecom, media, interactive |
| tweak.business.utilities | electric, gas, water |
| tweak.business.real_estate | REIT, brokerage, development |
| tweak.business.marketplace | amazon_seller already seeded under commerce |

Sub-tweaks mint on first real drop (Walmart → consumer_discretionary.retail, not a new Dualis).
A bank does not inherit restaurant labor meters. Same isolation as AAA vs NHL.

## Why the index becomes the work

Base is small and must not move.
Every new firm, league, board, or argument adds a row or an instance suffix.
That list will outrun anyone's head. That is expected.
The discipline is: new row still drops to base, still has units, still WAIT until n exists.

## Forbidden

- One "Forbes 500 model" that scores all firms with empty units
- Publishing a 500-row vanity table as if Dualis operates those companies
- Copying Amazon marketplace meters onto a hospital because both are "big"
