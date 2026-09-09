# Audit before Checkout

CHECKOUT_OPEN stays false until this page is boring.
Not a Dualis coin. Blockchain-like = append-only + hashable + replayable.
Decentral audit = a stranger can verify without our word.

## Must be green

1. Apex `/hall/` serves this repo's five-room tour. residual-ring `LIVE_HALL_OK=1`.
2. `workers/dualis-gate` preview deployed. `/u/health` returns `checkout: false`.
3. HMAC TEST: bad sig = 400 zero rows. Good `evt_` = one row. Same `evt_` again = 200 duplicate, no second fold.
4. `/pay/intent` is 403 while the flag is false.
5. Closed-shop Checkout webhook = 200 `applied: false`.
6. Schema + Worker + hall files have git SHAs. Ring hashes them. Anyone can `git clone` + `sha256sum`.
7. Rebuild of `unity_fields` from `webhook_event` matches live fold.
8. One residual sentence from David. Then Bind-continue. Then the flag.

## Must stay true after the flag

- Old `evt_` still verifies. New code still folds old events.
- Compensate is a new event. No DELETE of a grant. No auto-refund bot.
- Public-chain receipt remains WAIT_GRANT — hash of the event, not a minted Dualis token.

Skip any line and the shop stays closed. That is the loop.
