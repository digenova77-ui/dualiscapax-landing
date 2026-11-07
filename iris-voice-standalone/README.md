# Iris standalone voice service

**Current authority: NONE.** This service is not production-ready for authenticated model conversations.

## Current behavior

- `/health` reports process health only; it does not establish authorization or provider readiness.
- `/iris/status` reports whether a session verifier and provider configuration are available.
- `/sandbox/iris/turn` and `/sandbox/iris/speak` fail closed unless the local-only test verifier is explicitly enabled and its test header is supplied.
- The local verifier and mock response exist only for automated tests. They are not a production identity mechanism.
- A server-side xAI Responses API connector is implemented and unit-tested in `provider-connector.mjs`, but is intentionally **not wired into the live request path** while the canonical session verifier/Trinity authorization adapter is absent.
- Browser-held API keys are not used by this service. Production provider credentials must remain server-side.

## Security boundaries

The local test mode must never be enabled in production. Production requests remain unavailable until a canonical verifier can validate the actual signed-in session and provide a stable actor/session identity. A cookie merely existing is not proof of authentication.

Rate limiting defaults to the transport peer address. Set `TRUST_PROXY_HEADERS=1` only when the service is reachable exclusively through a trusted reverse proxy that overwrites forwarded IP headers; otherwise clients can spoof those headers.

All request responses include `authority: "NONE"`. This service does not independently grant Trinity authority, authorize writes, or perform deployments.

## Run tests

```sh
npm test
```

Tests cover provider response normalization and error handling, local mock behavior, and production fail-closed behavior when the canonical verifier is missing.

## Required before production integration

1. Implement or import the existing canonical session verifier; do not invent a parallel identity system.
2. Bind the verified session to the Trinity authorization decision and actor identity.
3. Enforce authorization, request-size limits, quotas, and provider access server-side.
4. Wire `createProviderConnector` only after those checks pass.
5. Add integration tests proving invalid, expired, missing, and wrong-actor sessions cannot reach the provider.
6. Deploy only after CI and live smoke tests pass with production configuration.
