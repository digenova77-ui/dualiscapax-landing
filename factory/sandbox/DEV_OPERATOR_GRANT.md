# DEV OPERATOR GRANT — public handle only

David granted factory bots use of **his Unity ID for testing** until revoked.

## What that can mean (cite)

Live `unity-id.js` `mintU1()` already prints:

- human: `U1`
- public: `DC1-H1-0001`
- seat: `operator_first`
- founder reserved: `U0` / `DC0-Z0-0000` / `unity_verification: NOT_PASSED`

That public stamp is the same on every device. It is a **label**, not an API key.
There is no Unity HTTP API that accepts U1 and returns control of Cloudflare, Drive, or a classroom.

## What bots may use until revoke

```json
{
  "grant": "david.operator.test",
  "human": "U1",
  "public": "DC1-H1-0001",
  "seat": "operator_first",
  "scope": ["factory/sandbox", "local vault tests", "hatch ice|teacher|sima doors in sandbox"],
  "revoked": false
}
```

Use this fixture in `factory/sandbox/` tests instead of inventing a second identity.

## What bots must never bake

- The eight-word phrase (knowledge class K — Dualis never receives it)
- Cloudflare / GitHub / Stripe / Pinata tokens
- Board passwords or `hpedsb.on.ca` mail
- Student names, class lists, IEP text
- A fake "Unity API" that pretends U1 opens Pages deploy

If David pastes a phrase in chat: treat as accidental, do not commit, tell him to rotate words on the phone.

## Revoke

Set `revoked: true` in `factory/sandbox/DEV_OPERATOR.json`.
Idle bots stop using the fixture. Plate files do not contain the grant.

## Apply gate (unchanged)

Test receipt `UNITY_SECURITY_TEST.md` still says DO NOT APPLY vault v2 until T20.
This grant does not skip that gate.
