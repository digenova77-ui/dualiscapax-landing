# DualisCapax agent handoff — 2026-09-09 02:07 EDT

Read this before touching the lander, Worker, Drive, or money.
Supersedes older repo HANDOFF.md / LIVE.md if those still sell pay.html.

## LIVE vs PAPER

LIVE: `/` old merch lander. `/hall/` five rooms + tour + Skip + rails (commit da01d79).
PAPER: Worker + D1 + HMAC + outbox + saga. CHECKOUT_OPEN=false.
NOT LIVE: origin Worker, D1, webhooks, Bind-continue, any SKU sale.

Drive folder (empty; seat drops zip):
https://drive.google.com/drive/folders/1KhS8VGDSgrel4QOfSgoLW09nxH0u0FcK

## Do not

1. Flip CHECKOUT_OPEN.
2. Dump merch / fuel / 10k SKU onto `/` or `/hall`.
3. Put secrets in git, hall JS, or Drive.
4. Claim apex is the new hall until seat cutover.
5. Double-grant charge + checkout.session.
6. Auto-refund from a saga.
7. Invent Dualis-DirectX / SFN / HTML6 / MIC / public credit score.
8. Restyle the hall into a DCLM essay.

## Next

Confirm /hall → cut `/` if seat says yes → preview D1 + TEST HMAC → residual sentence → then Bind-continue.

Look is $0. Sales closed.
