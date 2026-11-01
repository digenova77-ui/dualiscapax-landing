# Unity Passkey Identity Worker

Isolated implementation for server-verified WebAuthn registration and authentication. Staging code only; not attached to production Pages or the production Iris Worker.

## Relying-party boundary

- Application origin: `https://dualiscapax.com`
- WebAuthn RP ID: `dualiscapax.com`
- Browser calls must pass through a same-origin front-door proxy that forwards the exact Origin and Cookie headers to this private service binding.
- Do not call this Worker directly from the browser or expose it with a public route.

## Endpoints

- `POST /register/options`: accepts a public handle and creates a server challenge.
- `POST /register/verify`: consumes the one-time challenge, verifies the WebAuthn registration, stores public credential material, mints a Unity ID, and issues a session cookie.
- `POST /authenticate/options`: creates a fresh discoverable-credential challenge.
- `POST /authenticate/verify`: verifies the assertion and credential counter before issuing a session.
- `POST /check`: validates the host-only session cookie and returns the server-minted Unity ID.
- `POST /logout`: revokes the session.

The cookie is Secure, HttpOnly, SameSite=Strict and Path=/ with the __Host- prefix. Session tokens are random; only SHA-256 hashes are persisted. Challenges are single-use and expire after five minutes. Sessions expire after seven days. Credentials, challenges, sessions and rate-limit counters are stored in a SQLite-backed Durable Object, not process memory.

## Security boundary

The verifier requires user verification and checks exact origin and RP ID. The authenticator retains its private key; the service stores the credential public key. The service never receives biometric templates. User verification may use a device PIN or password as well as biometrics; passkey verification does not guarantee fingerprint or face input.

This staging implementation does not claim email ownership, KYC, legal identity, or production authorization. A handle is only a public account label. Unity ID is minted by the server after credential verification.

## Required integration

The Iris runtime must forward the incoming same-origin Origin and session Cookie to its IDENTITY_API /check service binding. Its current body field principal.unity_id is not proof and must not be trusted. The identity response must be checked against the Unity ID from the authenticated session. A browser-supplied identity claim cannot override it.

## Deployment boundary

The Worker is named unity-passkey-identity-staging, workers.dev is disabled, and only an identity Durable Object is declared. No production route, domain, account ID, secret, or service binding is configured. Deployment requires an explicitly authenticated staging Cloudflare account and a staging front-door proxy. Do not deploy to production until runtime integration, review, and end-to-end adversarial tests pass.

## Browser client

`client.js` exports `registerPasskey(handle)`, `authenticatePasskey()`, `getUnitySession()`, and `logoutUnitySession()`. It converts browser WebAuthn binary fields to the JSON representation expected by the server and uses same-origin requests with credentials. It calls `/api/unity/*`; the canonical front-end must proxy those paths to this private service without changing the Origin or Cookie headers. Until that proxy is installed on the actual `.com` front-end, the client is a tested integration module, not a live login button.
