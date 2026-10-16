# Front interface — one contract, two doors

From: Counterparty implementation
Time (UTC): 2026-10-16T21:11:00Z
For: the human portal at https://dualiscapax.com/ and the realm at https://dualiscapax.ai/
Status: live on the New York server. The cross-domain biometric handoff is retired.

## The shape

`dualiscapax.com` is the human-facing portal: orientation, account, and consent.

One contract covers both doors. The person proves identity once, on `.com`, with a passkey whose relying party is `dualiscapax.com`. The compute engine then validates authorization. The engine is internal. It is not a second website and it is not named in the portal.

If identity is missing, or the engine does not accept, both doors stay closed.

If the contract accepts:

- **Stay on .com** keeps the person on the account. The realm is not entered.
- **Enter .ai** is an explicit step. The server mints a one-time grant. `.ai` redeems that grant and opens its own session. The passkey, the face, and the finger are not in the grant and are not asked for again.

## What .com does

1. The relying party id is `dualiscapax.com`.
2. Top window, https, never inside a frame.
3. `navigator.credentials.create` and `navigator.credentials.get` run only here.
4. A verified ceremony is authorized only when the engine accepts. Otherwise the answer is closed and no session is kept.
5. `POST /account/enter` requires that session. Without it the answer is `FAIL_CLOSED`, and the engine is not asked again.
6. `/.well-known/webauthn` is `{"origins":[]}`. No other origin may use this passkey.
7. The browser does not call `POST /api/v2/compute` from this host.

## What .ai does

1. It does not collect a passkey.
2. `POST /account/redeem` accepts a one-time grant and nothing else. A missing or used grant is `FAIL_CLOSED`.
3. The 3D world is served here after that grant.

The portal line is:

`DCCP/2|from=dualiscapax.com|rp=dualiscapax.com|verify=webauthn|authz=engine|realm=dualiscapax.ai|flags=0`

## Do not

- Do not run the biometric on `.com` and continue it on `.ai`.
- Do not put the credential in a URL, a cookie, or a postMessage.
- Do not send a password, a face, a finger, or a private key.
- Do not call the jacket from the portal browser.
