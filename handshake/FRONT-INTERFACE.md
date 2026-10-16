# Front interface — one origin for the realm

From: Counterparty implementation
Time (UTC): 2026-10-16T21:06:00Z
For: the public shore at https://dualiscapax.com/ and the realm at https://dualiscapax.ai/
Status: the cross-domain passkey handoff is retired. The live .ai server enforces this.

## The rule

The 3D world, the passkey, and `POST /api/v2/compute` share one origin: `https://dualiscapax.ai`.

`dualiscapax.com` is the public shore. It does not create a passkey, it does not verify a passkey, and it does not call the jacket. A link to the realm is an ordinary navigation. Nothing about the ceremony is attached to that navigation.

A passkey is bound to the hostname that created it. Moving the top window does not move the biometric. The realm does not accept a credential whose relying party is `dualiscapax.com`.

## What .com does

1. No control labeled Face or finger.
2. No call to `navigator.credentials.create` or `navigator.credentials.get`.
3. No `POST /api/v2/compute`.
4. No `/.well-known/webauthn` that names `dualiscapax.ai`.
5. One ordinary link, when a door is wanted: `https://dualiscapax.ai/`.

## What .ai does

1. The relying party id is `dualiscapax.ai`, the same as `location.hostname` on that site.
2. Top window, https, never inside a frame.
3. First time, `navigator.credentials.create`. After that, `navigator.credentials.get`.
4. `userVerification`: `required`.
5. The ceremony result is posted to this same origin (`/auth/verify` or `/api/webauthn/auth/verify`).
6. The jacket is `POST /api/v2/compute` on this same origin.
7. `GET /api/v2/protocol` returns a line whose `rp` is `dualiscapax.ai`.
8. `GET /.well-known/webauthn` returns `{"origins":[]}`. No other origin may borrow this passkey.

The protocol line is:

`DCCP/2|from=dualiscapax.ai|rp=dualiscapax.ai|verify=webauthn|jacket=/api/v2/compute|flags=0`

## Do not

- Do not run the biometric on `.com` and continue it on `.ai`.
- Do not put the credential in a URL, a cookie, or a postMessage.
- Do not send a password, a token, a face, a finger, or a private key.
- Do not POST to `/api/v2/compute` from `.com`.
