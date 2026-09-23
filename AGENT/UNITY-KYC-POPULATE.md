# Unity ID — populate from KYC (known only)

Stamp: 2026-09-23T13:59Z
After a vendor pass, copy *attested* attributes onto the seat.
Empty means unknown. Never invent a field to look complete.

## Rule

If the vendor did not return it, Unity does not have it.
If they returned it, it lands on the matching slot with `source=vendor` and `at=checked_at`.
Holder can toggle white/dark. Defaults below.

## Slot map (vendor → Unity)

| Unity slot | Ledger | From typical KYC payload |
|---|---|---|
| legal_name | white | first + last / full_name |
| date_of_birth | dark → holder-only | dob / date_of_birth |
| sex | dark → holder-only | sex / gender if present |
| nationality | white | nationality / issuing_country |
| jurisdiction | white | issuing_state / document_issuing_country |
| address | dark | address_line, city, region, postal |
| portrait | dark | we do **not** copy the selfie or card image. Optional: vendor-hosted url expiry |
| doc_type | white | driving_licence, national_id, passport, residence_permit |
| doc_country | white | issuing_country |
| doc_number | dark | number — store hash only |
| doc_expiry | white | expiry_date |
| liveness | white | pass/fail |

SIN / health number: only if that vendor actually checked that document. Most will not. Slot stays empty.

## Stripe Identity → slots

verified_outputs.name → legal_name
verified_outputs.dob → date_of_birth (dark)
verified_outputs.address → address (dark)
last_verification_report.document.type → doc_type
last_verification_report.document.issuing_country → doc_country / jurisdiction

## Persona / Onfido / Jumio / Sumsub / Veriff / Trulioo

Same slots. Adapter normalizes their names into the table above.
If a vendor omits DOB, date_of_birth stays empty. Watchdog holes a seat that filled DOB with a guess.

## What Iris may say

She may use white slots ("the name on the sitting is …").
She may not recite DOB, address, or document number.
She may say a type is bound ("a driver's licence was attested") without the digits.

## Write path

webhook pass → normalize → foreach slot if value present → set claim {value or hash, source, vendor_session, at}
no pass → do not wipe a better older claim

Twain²: Known lands. Unknown stays empty.
Shorter: Fill what they proved.
