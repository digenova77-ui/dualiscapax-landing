# Unity ID → real-world KYC

Stamp: 2026-09-23T13:57Z
Law with AGENT/UNITY-ID-CARD.md

We do not invent a licence. We do not store a SIN in git.
We do bind Unity ID to an attestation from a real KYC agency when a contract exists.

## Levels (not live until issuer + vendor session exist)

0 guest sitting on this device
1 self-assert name + jurisdiction
2 vendor KYC bound (attestation id, not the picture)
3 agency-grade (repeatable audit of that attestation)

Bots and swarms never pass human KYC. Kind tag stays bot|swarm.

## Bind, not copy

Vendor proves the card. Unity stores:
- vendor name
- session / verification id
- result (pass/fail/review)
- which document types were shown (DL, health, passport)
- expiry of the check
- jurisdiction

Unity never stores:
- the photo of the card
- the raw licence / health / SIN digits
- a selfie dump in the repo

Dark ledger may hold a hash of those digits later, in a vault, not on Pages.

## Agencies to link toward (not partners today)

Canada-useful, FINTRAC-aware names:
- Trulioo (Vancouver) — data + KYB
- Entrust IDV (Onfido) — document + biometric
- Jumio — enterprise IDV + digital ID rails
- Persona — configurable bilingual flows
- Sumsub — crypto-native stack
- Veriff — fast document decision
- Stripe Identity — if the till is already Stripe
- Interac Verified / bank eID — Canadian wallet direction

Do not print “partnered with” until a signed contract and a 200 from their sandbox.

## What Iris may say

"Unity ID is our seat. A KYC agency can attest the government card. We keep the proof, not the number."
She never reads a health number or SIN.

## Next floor

1. Issuer mints unity:human.
2. One vendor sandbox (start Stripe Identity or Trulioo — pick one, don't list ten as live).
3. Webhook writes attestation onto the seat.
4. Rapport attaches to that unity id.

Until then this file is the agency map. Guest- is still the waiting room.
