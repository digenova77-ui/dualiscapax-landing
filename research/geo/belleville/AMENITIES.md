# Belleville amenity layer — depth law
2026-08-26 23:09 EDT

The point is itemization, not a finished café census tonight.
When the layer is full, Dualis can answer: how many coffee shops, how many of those are Tim Hortons, which one is busy at 07:00, which pump is cheapest this hour, which brand, which is open now. That is a later sensor sitting on named items. It is not a vibe.

## Denominator (for later ratios)

- Census 2021 CSD: **55,071**
- City housing-needs forecast (Watson 2025, includes undercount): **61,150** in 2025 → **67,800** in 2035
Always say which denominator a per-capita uses.

## One seed (brand locator, not YellowPages)

Official Tim Hortons Canada city list for Belleville: **11** pins — 161 Bridge; 165 College E; 169 North Front; 218 Bell; 390 North Front; 455 Dundas W; 470 Dundas E; 48 Dundas W; 6521 Hwy 62 N; 902b Wallbridge-Loyalist; Belleville General Hospital. Hospital may be a kiosk. Do not mix Trenton pins into this city count.

## Shelves for the rest (not opened)

- Restaurants / bakeries / coffee: municipal business licence + public health food-premise list + chain locators. Count + NAICS + hours.
- Fuel: TSSA / Ontario fuel-tax registrant list + brand locators + live price boards (GasBuddy-class is a pointer, not a book).
- Open-now / busy-now: requires a live feed or user-submit ledger. That is APIv2 on top of the item list. It does not exist until the item list exists.
- Per capita: seed count ÷ chosen denominator. Not before both sides are locked.

Same mask for every later city.
