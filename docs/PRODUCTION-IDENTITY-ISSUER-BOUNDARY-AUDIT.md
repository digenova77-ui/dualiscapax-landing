# Production Identity Issuer — Read-Only Boundary Audit

**Status:** BLOCKED — no production identity proof demonstrated
**Audited ref:** main at 08a79c91cd060fe9a3746417ddd3ae855d52fcc6
**Scope:** Read-only source inspection across `dualiscapax-landing` and its companion `dualiscapax-deploy` repository. No runtime, configuration, secret, DNS, route, or deployment changes.

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
8. **No identity service implementation found in this repository:** the audited `dualiscapax-landing` tree contains no `identity-api-staging` Worker source or production identity service implementation.

## Companion `.com` portal findings (`dualiscapax-deploy`)

The first audit pass was too narrow to the landing repository. The companion deployment repository contains an owner passkey page, so the accurate status is **WebAuthn browser scaffold and Caddy-to-auth-service route present; successful server-backed ceremony not demonstrated**:

1. `webroot/passkey/owner.html` contains real browser calls to `navigator.credentials.create()` and `navigator.credentials.get()`. It obtains registration/authentication options from the server, serializes the credential response, and posts it back for verification. This is a browser-side scaffold, not proof that a server verified any credential.
2. The page itself labels the implementation a scaffold and says the ceremony endpoints return `501 ceremony_not_wired`. However, the current source Caddyfile routes its `/api/webauthn/*` calls to `127.0.0.1:18801`. The page's notice and the current edge source therefore disagree; neither alone proves the live response.
3. The page calls `/api/webauthn/register/options`, `/api/webauthn/register/verify`, `/api/webauthn/auth/options`, `/api/webauthn/auth/verify`, and `/api/owner/session`.
4. The alternate `deploy/sovereign/nginx-dualiscapax-com.conf` proxies `/api/` to `127.0.0.1:8410`, but this is not the current source integration target. The `deploy/live-box/Caddyfile` routes the WebAuthn aliases to `127.0.0.1:18801`.
5. `handshake/FRONT-INTERFACE.md` specifies the intended `.com`-to-`.ai` passkey handoff and the `.well-known/webauthn` related-origin allowlist. That is a protocol instruction, not evidence that the well-known resource is currently served with the required content or that the live browser supports the feature.
6. The `dualiscapax-deploy` tree does not contain a static `webroot/.well-known/webauthn` file, but its current Caddy source defines that route directly. The `dualiscapax-landing` repository's `CNAME` names `dualiscapax.ai`; its `wrangler.toml` also describes the Pages project as bound to `.ai`. The two repositories therefore have distinct hosting roles and must not be casually described as one `.com` application.

### Related-origin WebAuthn requirement

Using RP ID `dualiscapax.com` from `https://dualiscapax.ai` is not an ordinary same-site RP ID configuration. It relies on WebAuthn Related Origin Requests: the RP ID domain must serve `https://dualiscapax.com/.well-known/webauthn` over HTTPS with `Content-Type: application/json`, and the `origins` array must explicitly include the exact `.ai` origin(s). The relying party must also validate the `origin` in the WebAuthn client data against its exact allowlist. A design document describing this file does not prove that it is deployed. Browser/client support must be tested on the actual target devices.

## Historical authentication-service evidence requiring revalidation

A separate investigation report committed as `attachments/GROK IMPLEMENTATION .txt` in `scarlet-xenon-lion-dove` is dated 2026-10-16. It reports an existing New Jersey `dualis-auth` service on `127.0.0.1:18801` with POST routes `/register/options`, `/register/verify`, `/auth/options`, and `/auth/verify`; it reports a health check of HTTP 200, zero registered credentials, first enrollment gated by an `x-enrollment-token`, and successful authentication returning `authorization: NOT_GRANTED`. The report also says the intended `.com`/`.ai` RP ID was `dualiscapax.com` and that the `.well-known/webauthn` URL then returned HTTP 200 with `application/octet-stream`, not the required `application/json`.

These are **historical reported findings**, not a live observation on 2026-10-30. The authentication service source and its current systemd/process state are not present in the inspected GitHub repositories, and no current health check or endpoint test was run. The Oct 13 reconciliation report separately says the staged 8410 service design was dead/uninstalled on the box and that the active edge was Caddy, not the proposed Nginx configuration. Do not confuse the staged `/api/` → `8410` owner-page design with the historically reported `dualis-auth` service on `18801`.

**Implementation implication:** before creating a new Better Auth server, a new passkey backend, or another identity service, re-establish whether the existing `dualis-auth` service is still present and whether its four WebAuthn endpoints remain correct. If it is live and source-backed, prefer a reviewed adapter to that existing service over a duplicate authentication stack. Keep `authorization: NOT_GRANTED` as the identity/authentication boundary; Trinity must separately decide every governed action.

### WebAuthn related-origin standard

The `.com` RP ID can be shared with `.ai` only through WebAuthn Related Origin Requests. The WebAuthn Level 3 specification requires the RP ID's HTTPS `/.well-known/webauthn` resource, `application/json`, an `origins` array, and server-side validation of the actual WebAuthn `origin` against the allowed origins. Browser support and the live resource's exact bytes/content type must be tested on target devices. References: https://www.w3.org/TR/2026/REC-webauthn-3-20260825/ and https://web.dev/articles/webauthn-related-origin-requests.

## Corrected live-edge source map and portal contract

The current source `dualiscapax-deploy/deploy/live-box/Caddyfile` provides more precise routing than the alternate Nginx file:

- `/.well-known/webauthn` on `dualiscapax.com` explicitly sets `Content-Type: application/json` and returns the exact two origins `https://dualiscapax.ai` and `https://www.dualiscapax.ai`.
- `.com` `/register/*`, `/auth/*`, `/account/session`, and `/account/enter` route to `127.0.0.1:18801`.
- `.com` `/api/webauthn/*` strips the `/api/webauthn` prefix and routes to `127.0.0.1:18801`, matching the owner page's registration/authentication option and verification URL prefix.
- `.ai` `/account/redeem` also routes to `127.0.0.1:18801`.

This is the source-level intended route. The Oct 13 reconciliation report says Caddy, not Nginx, was the active web server on the New Jersey box. It does not prove that the exact current GitHub Caddyfile revision is installed. The public `.well-known` response was historically reported as `application/octet-stream` despite JSON content, so the source handler and observed public response remain in conflict until a current external probe resolves the first-hop edge.

The checked-in owner page also has two source-contract discrepancies that should be resolved before calling the door ready:

1. `webroot/owner/owner.html` sends the enrollment passphrase in the JSON body to `/api/webauthn/register/options`. The Oct 16 auth-service investigation says first enrollment requires an `x-enrollment-token` header. That is a likely client/server contract mismatch; do not move an enrollment token into browser code or substitute the passphrase without reviewing the service implementation.
2. The page's proof panel calls `/api/owner/session`, while the inspected Caddy auth route list includes `/account/session` and `/account/enter` but not `/api/owner/session`. The page itself also labels the ceremony endpoints as 501. Confirm the actual deployed page and exact route contract before editing either side.

The alternate `deploy/sovereign/nginx-dualiscapax-com.conf` → `127.0.0.1:8410` design is not the correct integration target. The Oct 13 reconciliation report describes 8410 as a dead/uninstalled staged service design, while the Oct 16 investigation reports `dualis-auth` on 18801. Prefer the existing 18801 service if its current health, source, and contract can be re-established; do not create a second service at 8410.

## Revised consequence

There is an existing `.com` owner-facing WebAuthn scaffold, a Caddy source route to `dualis-auth` on port 18801, and a Caddy source handler for the Related Origin resource. That is meaningful groundwork. The portal's stated 501 posture conflicts with the current Caddy route; the portal's enrollment and session paths also appear inconsistent with the historically reported auth-service contract. The Oct 16 report said there were zero registered credentials and that authentication returned `authorization: NOT_GRANTED`; that report has not been refreshed. No current verified credential, authenticated `.com` session, signed issuer assertion, or `.ai` session has been demonstrated.

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

## Primary Iris page wiring — current source trace (2026-10-30)

The production app's own page wiring adds a second, independently verifiable reason the identity-to-authorization path remains closed:

1. **Primary page:** `ai/index.html` links visitors to `/ai/app`, and `ai/app.html` loads `js/iris-authorize.js`, `js/iris-boot.js`, and `js/iris-session.js` in that order.
2. **No production authorize base is configured in the page:** `ai/app.html` contains `<meta name="iris-authorize-base" content="">`. `js/iris-boot.js` sets `window.IrisAuthorizeBase` only when that value is non-empty. In the checked-in source, the primary app therefore leaves the authorize base unset.
3. **Fail-closed client behavior:** `js/iris-session.js` checks `canAuthorize()` before continuing. If neither a configured authorize base nor the staging-only browser secret exists, it sets `authorize-unavailable` and returns a denial before the downstream DCLM/model path. This is correct fail-closed behavior, not a successful production connection.
4. **Principal is not an identity proof:** the same file creates its session ID locally as `iris-${Date.now().toString(36)}` and uses that value as `principal.unity_id` in `buildAuthBody()`. That is a client-generated correlation identifier, not a verified Unity ID. It must not be accepted as identity by a production identity provider.
5. **Staging identity is fixture-only:** `workers/iris-runtime/STAGING.md` says the fixture accepts an operator-supplied staging Unity ID and does not prove real Unity identity. `tests/iris-authorize-endpoint.test.mjs` supplies an in-memory identity stub that returns `verified: true` for any non-empty requested ID. This is contract-test scaffolding only.
6. **Client regression tests do not exercise the actual browser helper:** `tests/iris-authorize-regression.test.mjs` uses a local `makeAuthorizeStub()` and hand-built request objects. It does not import `js/iris-authorize.js` or demonstrate that a real browser session reaches a production signer. The endpoint tests likewise call the staging Worker with mocked downstream bindings.

### Resulting state

- **Verified from source:** primary Iris page has an empty authorize-base meta value; boot leaves the base unset; session denies when authorization is unavailable; the submitted Unity ID is generated locally.
- **Not verified:** a production identity provider, a server-side signer/proxy, an authenticated Unity ID, or a live Trinity-backed production request.
- **Required before opening:** bind a real authenticated .com identity to a server-issued Unity principal; supply a reviewed server-side authorization adapter that signs only after authenticating the session; connect an independently governed Trinity decision service; then add integration tests using the real client helper and real service contracts in isolated staging.

Do not solve this by setting a browser-visible signing secret, trusting the generated `iris-*` identifier, or pointing production at the staging fixture. No source runtime code or page configuration is changed by this audit update.


## Companion .com passkey source-contract verification (2026-10-30)

The companion deployment repository's draft PR [#18](https://github.com/digenova77-ui/dualiscapax-deploy/pull/18), head `21bb4624e83759f18037bded0d75314157c1a883`, now statically checks the browser ceremony sequence against the Caddy source:

- Registration obtains options before invoking `navigator.credentials.create()`, consumes the server-returned challenge and RP/authenticator-selection parameters, and posts the resulting credential to the registration verification route.
- Authentication obtains options before `navigator.credentials.get()`, consumes the returned challenge/RP ID/allow-list, requires user verification by default, and posts the assertion to the authentication verification route.
- The credential serializer retains the WebAuthn response fields needed for server-side verification.
- The browser source does not generate its own challenge or contain the enrollment token.
- The Caddy alias strips `/api/webauthn` and proxies the four ceremony paths to the existing loopback service.

The companion routing-contract workflow run `41141681843` completed successfully. This is a source-shape regression guard only; it does not execute a browser ceremony, validate the server's challenge store or cryptographic verification, or prove that the Caddy source is deployed.

**Remaining integration blockers are unchanged:** the owner page session path `/api/owner/session` is not represented in the Caddy route list (which contains `/account/session`); enrollment sends a JSON passphrase while historical service evidence describes an `x-enrollment-token` gate; and the actual `dualis-auth` implementation and current runtime state are not present in the checked repositories. No endpoint rewrite or enrollment-policy change is safe without the actual service contract.

No production code, Caddy configuration, secrets, DNS, server process, credential state or deployment was changed.
