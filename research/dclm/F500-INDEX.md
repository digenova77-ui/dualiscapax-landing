# Fortune 500 name-index — seed 2026-08-26 22:00 EDT

List first. Numbers later. Scores WAIT until a firm filing is read.

Source: Fortune 500 2026 (FY ended on or before 2026-03-31). Amazon #1 revenue $716.9B; Walmart $713.2B.

## Order of work

1. Index names under Fortune sectors.
2. Attach public facts only when a filing is opened.
3. Mint `tweak.business.<sector>.<firm>` from that firm’s record.
4. Sector object rises from filled children — not beforehand.
5. Dualis homepage does not list 500 names.

## Sector slots (company count on the 2026 list)

Financials 95 · Energy 61 · Technology 53 · Health Care 47 · Retailing 41 · Food/Bev/Tobacco 24 · Industrials 20 · Wholesalers 18 · Business Services 18 · Transportation 17 · Materials 17 · Other 89

Thin parents already named: `amazon_ops`, `retail.walmart` (template only). No 10-K ingest tonight.

## Dualis packs that can receive a first child

- retailing (Amazon template, Walmart slot)
- health_care (oncology is NOT a payer 10-K)
- technology
- energy
- financials

A Dualis oncology leaf does not score UnitedHealth. Different pack.
