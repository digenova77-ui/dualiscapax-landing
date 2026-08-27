# Canada firm index — Agent A
2026-08-26 22:04 EDT

Goal: one Dualis asset ID per Canadian business Dualis can actually name from a public source.
Not 5 million scored tweaks tonight. Framework first. Pick away by source.

## How big the country is (public counts)

Statistics Canada Business Register (Canadian business counts, June 2026):
- **1.37 million** employer businesses
- **3.78 million** non-employer businesses with annual revenue > $30,000
- ~**5.15 million** active locations in that snapshot

Inclusion on the Register: payroll remittance, or ≥ $30k revenue, or incorporated and filed a T2 in the last three years.
Location ≠ enterprise. One firm can be many locations.

ISED employer **enterprises** (Dec 2024, NAICS-classified): **1.10 million** (98.2% small, 1.5% medium, 0.3% large).
Goods-producing ~23.4% of those employer enterprises; services ~76.6%.

CRA T2 corporations by jurisdiction (tax year 2023, assessed by 2025-06-30): **2,747,670** corporation returns. Ontario 1,108,730; Quebec 553,570; BC 413,630; Alberta 365,890.
That is **legal corporations that filed T2**, not the same cut as StatCan locations.

Sole proprietorships and partnerships do not have one national named directory equivalent to T2. Non-employer counts are the closest public mass; names for those come from provincial registries and directories, not from Dualis invention.

Federal CBCA open data is a named list (hundreds of thousands of active federal corps). Provincial registries (ON, QC, BC, AB, …) are separate crawls.

## Legal form

| form | public name source |
|------|--------------------|
| corporation (federal) | Corporations Canada open data |
| corporation (provincial) | provincial registrar |
| partnership | provincial partnership / extra-provincial filings |
| sole proprietorship | provincial business-name / master business licence |

Employer vs non-employer is a **payroll** cut, not a legal-form cut. Do not treat "non-employer" as "sole prop."

## Industry / sector spine

NAICS Canada 2022 — 20 sectors. Sector = 2-digit (or 31-33, 44-45, 48-49). Industry group = 3–4 digit. Firm tweak sits under the finest NAICS Dualis can support from a filing or directory.

11 ag · 21 mining/oil · 22 utilities · 23 construction · 31-33 manufacturing · 41 wholesale · 44-45 retail · 48-49 transport · 51 information · 52 finance · 53 real estate · 54 professional · 55 holdco · 56 admin/waste · 61 education · 62 health · 71 arts · 72 accommodation/food · 81 other services · 91 public admin

## Asset ID

`ca.<src>.<native_id>`

Examples:
- `ca.cbca.1234567` federal corporation number
- `ca.on.bn.XXXXXXXXX` Ontario / BN when Dualis is allowed to store it
- `ca.sedar.issuer.<ticker-or-filer>` reporting issuer
- `ca.statcan.cell.<naics>.<geo>.<size>` **count cell**, not a firm

Never mint `ca.invented.*`. If Dualis cannot point at a public record, there is no asset ID.

## Agent A tasks (pick in this order)

| id | task | output |
|----|------|--------|
| A0 | this framework + ID | done in this file |
| A1 | StatCan count spine: employer / non-employer × province × NAICS-2 | count cells, not names |
| A2 | CRA T2 jurisdiction totals as corporation-form ceiling | counts |
| A3 | Corporations Canada active-business dump → named federal corps | first named IDs |
| A4 | Ontario registrar crawl (Dualis home) | named ON corps / business names Dualis can legally store |
| A5 | other provinces one at a time | same |
| A6 | SEDAR+ reporting issuers | public-firm deep-tweak queue |
| A7 | DualisCapax as `ca.on.corp.*` first owned row | one named firm Dualis already is |

A3 is the first bot job that produces **names**. A1–A2 produce the size of the haystack.

## What this is not

Not a scored tweak per Canadian business.
Not scraping personal sole-prop households onto the Dualis website.
Not mixing F500 US rows into this index.
Named minors and sealed KYC stay out.
