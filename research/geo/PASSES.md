# Passes — frame before dollars
2026-08-26 22:54 EDT

Do not hunt a company's numbers until the earlier passes for that geo exist.

| pass | object | not yet |
|------|--------|--------|
| 0 | Geo list (444 ON municipalities, then other provinces) | counts |
| 1 | **Count only** per municipality / CSD (StatCan BR or equivalent). No names. | names |
| 2 | Legal + trade names into NAMES.md | sector |
| 3 | Sector / NAICS / licence class on those names | dollars |
| 4 | Public numbers (SOURCE-ORDER + serial validate) | next_cut |
| 5 | Dated next_cut if they sit |

A later pass may run on *one* city while another city is still on pass 1.
It may not skip ahead inside that city (no Belleville 10-K hunt while Belleville still has no count).

Pass 1 source for Canada: StatCan Canadian Business Counts by CSD (table class 33-10-*). Townfolio reprints are pointers until Deep opens the table.
Pass 0 source for Ontario: MMAH municipality list (444).

Small municipalities still get every pass. Small n → finer on pass 4, not skipped on pass 1.
