# Production Identity Issuer — Read-Only Boundary Audit

**Status:** BLOCKED — no production identity proof demonstrated
**Audited ref:** main at 08a79c91cd060fe9a3746417ddd3ae855d52fcc6
**Scope:** Source inspection only. No runtime, configuration, secret, DNS, route, or deployment changes.

## Executive finding

The repository contains authorization machinery, but the inspected production Pages Worker does not establish that the caller controls the claimed Unity identity. The current /v1/authorize handler validates an HMAC over the request and then reads body.principal.unity_id; the inspected handler does not verify an authenticated user session, passkey ceremony, issuer assertion, or identity-provider response before evaluating its local action policy.

A valid HMAC proves possession of the HMAC key for that request. It does not independently prove that the browser user is the named Unity principal. A client-controlled unity_id must not be treated as authenticated identity.

## Source-backed observations

1. **Production Pages authorization route:** _worker.js, /v1/authorize (around lines 396–555). It calls verifySignature(request, env.SIGNING_SECRET), parses body.principal.unity_id, applies rate limits and evaluatePolicy, then atomically claims request_id. No session-cookie validation, WebAuthn verification, or trusted identity binding appears in this handler.
2. **Policy function:** _worker.js, evaluatePolicy (around lines 228–240). It checks action/lane/memory compatibility. It is not an identity verifier or an independently governed Trinity decision service.
3. **Production browser client:** js/iris-authorize.js, authorizeProduction. It posts JSON to IrisAuthorizeBase + /v1/authorize with credentials: same-origin, but does not attach x-timestamp or x-signature.
4. **Pages Worker request contract:** _worker.js, verifySignature (around lines 243–270) requires both x-timestamp and x-signature, and verifies them against SIGNING_SECRET. If IrisAuthorizeBase points directly at this Worker, the inspected production client and Worker contracts do not match. If a separate signer/backend is intended, its implementation was not found in this repository tree.
5. **Staging runtime:** workers/iris-runtime/worker.mjs has an IDENTITY_API service binding and calls /check with the requested Unity ID. workers/iris-runtime/wrangler.toml points this at a placeholder service named identity-api-staging.
6. **Staging identity tests:** tests/iris-authorize-endpoint.test.mjs supplies a mock IDENTITY_API that returns verified: true for any non-empty Unity ID. This tests the Worker binding contract only; it is not identity evidence.
7. **Staging documentation:** workers/iris-runtime/STAGING.md explicitly says the fixtures do not prove real Unity identity, real Trinity policy, or real model inference, and that real staging services are still required.
8. **No issuer implementation found:** the audited repository tree contains no identity-api-staging Worker source, WebAuthn/passkey implementation, or production identity service implementation.

## Consequence

The existing HMAC + action-policy + durable-claim path must not be described as authenticated-user authorization. It is a request-signing and policy/claim mechanism whose principal is supplied in the request. The staging fixture cannot close that gap.

The separate .com-to-.ai signed handoff prototype is useful protocol work, but it does not supply a real .com passkey ceremony, issuer key, authenticated source session, or durable .ai redemption.

## Required design before implementation

- **Identity origin:** approve the exact .com WebAuthn relying-party ID and allowed origins. The passkey ceremony must occur in the .com top-level context.
- **Authenticator ceremony:** choose and implement a maintained WebAuthn server library; verify challenge, origin, RP ID hash, signature, credential ownership, user presence/verification policy, and credential counter semantics server-side.
- **Account binding:** define how a verified .com account maps to a Unity ID. Never accept the mapping from browser input.
- **Issuer authority:** independently govern the .com assertion signing key, key ID, rotation and revocation. No private key in browser code or repository.
- **Relying party:** .ai must create and store its own pending state/nonce, verify issuer/audience/callback and exact challenge binding, and atomically consume state/JTI before issuing its own host-only session.
- **Transport:** return the assertion through a bounded cross-origin POST; never place it in a URL, fragment, localStorage or referrer-bearing navigation.
- **Authorization:** identity evidence only establishes who signed in. It does not authorize compute, writing, deployment or payment. Trinity remains the sole authorization gate.
- **Operations:** separate staging and production keys, origins, databases and service bindings; prove revocation, replay rejection, account recovery, rate limiting, audit privacy and multi-instance behavior.

## Explicit non-actions

This audit does not change _worker.js, js/iris-authorize.js, Wrangler bindings, any auth provider, HMAC secrets, Cloudflare routes, DNS, production Pages, or live services. It does not select an issuer key, appoint an identity authority, or authorize any Trinity decision.