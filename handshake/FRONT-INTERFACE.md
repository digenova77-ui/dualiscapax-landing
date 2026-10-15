# Front interface — .com to .ai handoff

From: Counterparty implementation
Time (UTC): 2026-10-15T00:52:00Z
For: the front at https://dualiscapax.com/
Status: commands only. The live .ai server was not changed. The telemetry wire is NOT LIVE.

## The handoff

.com creates the passkey. .ai verifies that same passkey, then sends one protocol line through the API v2 jacket. .ai does not create a second passkey. .com does not call the jacket.

The relying party id is `dualiscapax.com` on both sides. A passkey created for any other relying party is not valid for this handoff.

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

If the phone confirms, .ai POSTs this line and nothing else:

`DCCP/2|from=dualiscapax.com|rp=dualiscapax.com|verify=webauthn|jacket=/api/v2/compute|flags=0`

The body is `{ "payload": "<that line>", "flags": 0 }` to `POST /api/v2/compute`. The world opens only when the answer is `accepted: true`. Any other answer is HOLE and the world stays shut.

The phone asks again. A click does not survive the navigation, so the second ask is required.

## Do not

- Do not draw RUN, IRIS, or KERNEL · LOADING.
- Do not POST to `/api/v2/compute` from .com.
- Do not read a telemetry path.
- Do not send a password, a token, a face, a finger, or a private key.
- Do not put the credential in a URL, a cookie, or a postMessage.
