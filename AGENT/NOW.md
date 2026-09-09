# NOW — scan script for any AI agency

Stamp: 2026-09-09T17:22Z
Repo: digenova77-ui/dualiscapax-landing  branch main
Seat: David. Vault: CHECKOUT_OPEN must stay false.
If you did not deploy it, it is not live.

## 1. Read these first (spine bundle)

AGENT/SPINE.md — index  
AGENT/AUTONOMY.md — order 1–11  
AGENT/AUDIT-BEFORE-CHECKOUT.md — vault law  
AGENT/WATCHDOGS.md — floors  
AGENT/ROSTER.md — kinds  
AGENT/HANDOFF-CHAIN.md — persist  
AGENT/LINE.md — stations  
hall/AGENT-TRIGGER.md — hall must not be redesigned  
AGENT/work_lock.json — expired IN_USE is a hole

If a file fights AUTONOMY + AUDIT, those two win.

## 2. Validate by probe (do not take chat's word)

```bash
# Hall files exist
test -f hall/index.html && test -f hall/narrator-land.js && test -f hall/cuts-v1.json

# Gate carpenter files (landed b5ea2ad)
ls workers/dualis-gate/
# EXPECT: README.md dualis-bc.js stripe-hmac-verify.js timing-safe-equal.js d1-idempotency.js schema.sql wrangler.toml

# Foreman exists, not bound
test -f workers/agency-foreman/index.js

# Live surface — tour vs reroute
curl -sL -o /tmp/hall.html -w "%{http_code}" https://www.dualiscapax.ai/hall/
# PASS: 200 AND body has FIVE ROOMS or START THE TOUR or DualisNarrator
# FAIL: RE-ROUTING / Sovereign Router / merch lander

# Raw truth
curl -sL https://raw.githubusercontent.com/digenova77-ui/dualiscapax-landing/main/hall/index.html | head
```

Ring: `.github/workflows/residual-ring.yml` hashes hall/* and curls `/hall/` noon UTC + push.

## 3. Live vs paper (this stamp)

LIVE: hall/ files, residual-ring, Pages, secret-scan, this AGENT bundle, dualis-gate carpenter files (b5ea2ad).
PAPER: dualis-gate preview deploy, D1 dualis-unity bind, /u live, HMAC five greens, UnityFan, queue, PWA, chain.
RED: workers-live (iris-gateway). Do not hang new work on it.
CLOSED: /pay/intent. Do not flip CHECKOUT_OPEN.
OPEN HOLE: apex /hall/ still reroutes (Cloudflare bind). Seat order 1. Separate splice.

## 4. Colors (do not swap)

01 #ffb830  02 #3b82f6  03 #00e5ff  04 #c084fc  05 #00ffaa

## 5. Your job if you are the next agency

Name the floor. One splice. Hash it. Do not redesign the hall.
Do not dump merch, fuel, $1499, ALS.
Do not invent Dualis-L1 or bind /*.
Necessity now: Replay tester on preview.
Seat must: `npx wrangler d1 create dualis-unity` then dashboard bind DB; `npx wrangler secret put STRIPE_IDENTITY_SECRET` and `STRIPE_WEBHOOK_SECRET` (test `whsec_`); `npx wrangler deploy` from workers/dualis-gate. Never routes /*.
Then HMAC TEST: bad sig = 400 zero rows. Good `evt_` = one row. Same `evt_` again = 200 duplicate.
Then still not the vault.

Truth prevails. Leftover first.
