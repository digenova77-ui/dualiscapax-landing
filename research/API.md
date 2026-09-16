# API — what Dualis offers

Look is public. Paid is closed until Stripe is a real clock.

## Now (after apex matches git)

HTTP GET of pages we already ship:
- /ice
- /gameday
- /rte/sima-dclm/
- /alacarte

Machine-readable later: static JSON under cf-pages/api/ for *named public plates only*
(OHF member names already on hockey.html, Look $0 rungs, LIVE-STATUS).
No invented roster. No members. No availability. No chart IDs.

## Not an interface we offer

- OAuth /token or Dualis IdP
- Cloudflare token proxy
- TeamSnap passthrough
- Drive dump
- Piñata as SoR

## Later, when a seat exists

TeamSnap: their OAuth, least scope, flatten on-device.
Stripe: their webhook, our HMAC, idempotent.
Functions only for that HMAC / a non-PII key — not to wrap the lander.

If it is not in cf-pages/ on main, it is not an API we offer.
