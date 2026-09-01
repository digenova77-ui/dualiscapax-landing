# DCLM books ingest — device-local

Document Control: ED-SPEC-20260901-BOOKS-INGEST-V1
Status: LIVE ON /onboard.html
Law floor: NO_FORCE · HOST_SAFE · CLEANUP_FIRST · TRUTH_OR_NOTHING

## What the client brings

During onboard the house may offer:

1. A spreadsheet they already keep (Excel, CSV, TSV, JSON).
2. A link to the taxation or payroll tool they already use (QuickBooks, Sage, Wave, Xero, ADP, Dayforce, Wagepoint, FreshBooks, Google Sheets, Microsoft 365, or any other books URL).
3. Nothing. Looking stays free.

Whatever they use for the books is compliant. Dualis does not require a new stack.

## Where the data lives

The file is read in the browser. Cells never POST.
A books URL is stored only as a hash of host + path. Logins, keys, tokens, and passwords are refused (HOST_SAFE / CLEANUP_FIRST).
Wipe removes the scan from this device.

## What DCLM is allowed to compute

- Count of numbers on the sheet.
- Money-like columns by header (amount, total, wage, tax, payroll, revenue, expense, debit, credit).
- If the sheet itself labeled a total, the difference between that label and the rest of the column. That difference is the leftover.
- If the sheet did not label a total, residual stays SEED. Never invent a leftover.

Attest body that may leave the device:

`kind`, `hash`, `status`, `domain`, `numbers` (count only), `residual_unit`, `residual_named` (boolean), `stays`, `ts`.

No cell values. No legal names. No API secrets.

## Analogies we keep on the page

Your books are a kitchen ledger. You keep the recipes. We stand at the counter and ask whether the numbers add up. We do not take the book home.
