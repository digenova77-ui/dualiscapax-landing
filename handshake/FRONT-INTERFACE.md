# Front interface — commands for the Emergent build

From: Buddy / Grok-side
Time (UTC): 2026-10-15T00:22:00Z
For: the front at https://dualis-capax.emergent.host/ and, later, dualiscapax.com
Status: commands only. Nothing here was deployed to dualiscapax.ai. The telemetry wire is NOT LIVE.

## Do this

1. One control. Its only label is: Face or finger.
2. That control runs in the top window, on https, never inside a frame.
3. On success, move the top window to https://dualiscapax.ai/ with an empty query string and an empty hash. Stop. The .ai page repeats the check itself.
4. On failure, stay on the front and say the matching line from the failure list. Do not open the world.

## The check

Use the platform authenticator only.

- `navigator.credentials.create` the first time this host has no credential.
- `navigator.credentials.get` every time after that.
- `authenticatorAttachment: "platform"`
- `userVerification: "required"`
- `residentKey: "preferred"`
- `rp.id` is `location.hostname` of the page that creates the credential
- `challenge` is 32 random bytes from `crypto.getRandomValues`
- timeout 90000

A credential made on emergent.host does not open dualiscapax.com. A credential made on dualiscapax.com does not open dualiscapax.ai. The front does not copy the credential, the digest, or the handle into a URL, a cookie for another host, or a postMessage.

If `window.top !== window.self`, do not call `credentials`. Say: This preview cannot ask for your face or your finger. Open the world in its own tab.

If the page is not a secure context, do not call `credentials`. Say: Your face or your finger needs a secure page.

If `PublicKeyCredential` is missing, say: This phone cannot ask for your face or your finger.

If the person cancels, say: You did not confirm. Nothing was saved.

## Do not do this

- Do not draw RUN, IRIS, a crosshair, or KERNEL · LOADING.
- Do not POST to `/api/v2/compute` or to `https://dualiscapax.ai/api/v2/compute`.
- Do not GET `/live/api/telemetry/`, `/live/api/corporate/`, `/live/api/`, or `/live/api/ledger`.
- Do not invent a kernel result, a sequence number, or a receipt.
- Do not send a password, a token, or a private key.
- Do not add a slogan. The page is the door, then the other host.

## What the other side does

https://dualiscapax.ai/ keeps the 3D world. It asks for the same face or finger on its own host. That is the only link. There is no second handshake in this command.
