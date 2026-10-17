# Front interface — .com to .ai handoff

From: DualisCapax engineering remediation
Time (UTC): 2026-10-17
Status: PROPOSED CORRECTION — specification only; not implemented or live-tested.

## Required user experience

The visitor performs one passkey ceremony on the identity page. After the passkey assertion is verified by the server, the application automatically transfers the authenticated state to the 3D site. Do not send the visitor back to the identity page and require a separate manual link to the 3D site. Do not ask for a second biometric ceremony merely because the first page navigated.

A biometric/passkey prompt by itself is not server authentication. The server must validate the WebAuthn assertion before authorizing the handoff. The 3D receiver must validate the handoff and establish its own protected session before unlocking the world.

## Proposed secure handoff protocol

1. The identity page starts one WebAuthn ceremony from a clear user action.
2. The browser sends the full WebAuthn assertion to the identity backend over HTTPS. The backend verifies the challenge, origin, relying-party ID, signature, user-verification flag, credential status, and replay protection. A client-side success message is not sufficient.
3. After verification, the backend creates a cryptographically random, single-use handoff code with a short expiry (target: 60 seconds), bound to the destination audience and the verified session. Store only its hash server-side where practical.
4. The browser automatically submits that opaque code to the 3D site's HTTPS handoff endpoint in a cross-origin POST body—not in the URL, query string, fragment, local storage, or referrer-bearing link.
5. The receiving backend atomically consumes the code once, checks expiry, audience, and replay status, and establishes a secure host-only session cookie (Secure, HttpOnly, and an appropriate SameSite policy). It then returns a 303 redirect to the clean 3D entry URL.
6. The 3D app opens automatically only after the receiver confirms the authenticated session / accepted gate. All failures fail closed and show a useful error with a retry path.
7. Never transmit raw biometric data, a private key, or a reusable bearer token. Apply strict Origin checks, CSRF protections where applicable, rate limits, short expiry, one-time consumption, and audit-safe logging that excludes secrets.

The cross-origin POST must be explicitly tested on supported mobile and desktop browsers. If the two domains cannot securely support this flow, stop and resolve the backend/session design; do not fall back to an unverified redirect or silently weaken the gate.

## Acceptance criteria

- One biometric/passkey ceremony for the normal sign-in flow.
- No manual second link to reach the 3D site.
- No second passkey prompt solely because of navigation.
- Server-verified WebAuthn assertion and server-verified, single-use handoff.
- Clean final URL; no credential/assertion/code in URL or browser storage.
- The 3D scene remains locked if assertion validation, handoff exchange, session establishment, or API authorization fails.
- Automated tests cover success, cancellation, invalid signature, wrong origin/RP ID, expired/replayed code, cross-origin rejection, and API unavailable.

## Implementation status

This document is a proposed protocol correction, not evidence of implementation. Current repository inspection did not locate the complete end-to-end WebAuthn assertion verification and handoff implementation. The live telemetry wire was previously documented as not live. Do not claim the one-ceremony flow works until both backends and the receiving UI are implemented and tested in staging.

## Legacy handoff spec — superseded; forensic reference only

**Do not implement the old flow below.** It is preserved to document the behavior that caused the extra prompt and manual handoff. Its second-ceremony requirement, navigation assumptions, and API line are superseded by the proposed secure single-ceremony protocol above. The old API contract is not proof that a backend exists or that the server verifies WebAuthn assertions.

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
