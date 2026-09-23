# Unity KYC — many vendors, one attestation

Stamp: 2026-09-23T13:58Z
One Unity seat. Many jackets. Same record after a pass.
A jacket with no sandbox key is a map, not a pipe.

## Record we write (every vendor)

```
unity_id
vendor            stripe | persona | onfido | jumio | sumsub | trulioo | veriff | interac
vendor_session    their id
result            pass | fail | review
types             [dl, health, passport, id_card]
jurisdiction      CA-ON | …
level             2
checked_at
expires_at
```

Never written: card image, SIN, licence digits, selfie bytes.

## Jackets

| Vendor | Create session | Result lands |
|---|---|---|
| Stripe Identity | POST /v1/identity/verification_sessions | webhook identity.verification_session.verified |
| Persona | POST /api/v1/inquiries | webhook inquiry.completed |
| Onfido / Entrust | POST /v3.6/workflow_runs | webhook check.completed |
| Jumio | POST /api/v1/portal/account | callback / workflow |
| Sumsub | POST /resources/applicants | webhook applicantReviewed |
| Trulioo | POST /verifications | callback |
| Veriff | POST /v1/sessions | webhook |
| Interac / bank eID | when a Canadian wallet seat exists | their assertion |

## How a piper calls us

`POST /api/kyc/start` `{ unity_id, vendor }`
→ `{ ok, url }` hosted flow at that vendor.

`POST /api/kyc/hook/:vendor` raw vendor webhook
→ normalize → write the record above → level 2 if pass.

Missing vendor secret → 503 `JACKET_UNBOUND`. Fail closed. Do not fake a pass.

## Order of binding (not all at once on the street)

1. Stripe Identity test — till already lives here
2. Persona sandbox — self-serve if we want a second jacket this month
3. Trulioo — Canada data + KYB when a company sitting exists
4. Onfido / Jumio / Sumsub / Veriff — when a contract exists
5. Interac — Canadian wallet direction

Watchdog: a page that lists a vendor as live without a 200 from that sandbox is a hole.

Twain²: Many doors. One stamp on the seat.
Shorter: Pick a jacket. Same record.
