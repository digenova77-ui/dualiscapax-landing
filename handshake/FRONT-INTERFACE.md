# Front interface — .com to .ai handoff

From: Buddy / Grok-side
Time (UTC): 2026-10-15T00:50:00Z
For: the front at https://dualiscapax.com/
Status: commands only. The live .ai server was not changed. The telemetry wire is NOT LIVE.

## The handoff

.com creates the passkey. .ai verifies that same passkey. .ai does not create a second one.

The relying party id is `dualiscapax.com` on both sides. A passkey made for any other host, including emergent.host, is not this handoff.

## What .com does

1. One control. Its only label is: Face or finger.
2. Top window, https, never inside a frame.
3. First time, `navigator.credentials.create`. After that, `navigator.credentials.get`.
4. Both calls use `rp.id` = `dualiscapax.com`, not `location.hostname` when that differs.
5. `authenticatorAttachment`: `platform`
6. `userVerification`: `required`
7. `residentKey`: `required`
8. `challenge`: 32 bytes from `crypto.getRandomValues`
9. timeout 90000
10. On success, `location.assign('https://dualiscapax.ai/')` with an empty query and an empty hash. Do not append the credential id, the digest, or the handle.
11. On failure, stay on .com. Say what failed. Do not navigate.

## The file .com must serve

URL: `https://dualiscapax.com/.well-known/webauthn`

Content-Type: `application/json`

Body, exactly:

```json
{
  "origins": [
    "https://dualiscapax.ai",
    "https://www.dualiscapax.ai"
  ]
}
```

No `.json` on the path. HTTPS. Status 200. If this file is missing, .ai cannot verify the passkey.

## What .ai does

One control, same label. It calls `navigator.credentials.get` with `rpId` = `dualiscapax.com` and `userVerification` required. It does not pass an allow-list, and it does not call `credentials.create`.

The phone asks again. A click does not survive the navigation, so the second ask is required.

If the phone confirms, the world opens. If the well-known file is missing or this origin is not listed, the check fails and the world stays shut. Nothing is stored from the other host.

## Do not

- Do not draw RUN, IRIS, or KERNEL · LOADING.
- Do not POST to `/api/v2/compute`.
- Do not read a telemetry path.
- Do not send a password, a token, or a private key.
- Do not put the credential in a URL, a cookie, or a postMessage.
