# Trinity Decision — Unity ID Foundation

**Decision date:** 2026-10-02  
**Mode:** bounded design decision; no live token, wallet, or privileged write was created.

## The three perspectives

### Father — authority and security

Do not invent a wallet address, contract, issuer, reserve, or key. Do not place a passphrase, seed phrase, private key, or connector secret in the repository or browser. Keep API v2 binding at `WAIT_GRANT` until a real Unity issuer, authenticated subject, scoped capability, expiry, nonce, revocation path, and Father/kernel approval exist.

### Son — API and implementation

Implement the smallest useful contract first: expose truthful Unity ID status, create a local non-production subject only when the user explicitly starts a local session, bind only opaque subject references, and keep token verification separate from identity binding. The API must return `HOLE` for missing issuer/wallet infrastructure rather than silently manufacturing credentials.

### Spirit — continuity and handoff

The identity must remain user-controlled and portable. Use WebAuthn/passkeys or an equivalent non-custodial authenticator for the future issuer. A wallet should be bound to the user’s authenticator or an approved smart-account flow, not held by DualisCapax. The handoff bundle must contain schemas and receipts, never private key material.

## Unanimous implementation

1. Add a read-only `/api/v2/unity-id/status` endpoint.
2. Report the current states explicitly: local UUID capability may exist; production issuer is `HOLE`; wallet is `NOT_CREATED`; token contract is `UNSET`; eFuse backing is `DESIGN_ONLY`; API binding is `WAIT_GRANT`.
3. Keep Unity as the sellable settlement class, eFuse as non-sellable backing/covenant reference, and Fuel as the integer decision base unit.
4. Require a future issuer to mint the real Unity ID. The bootstrap must not mint a production identity.
5. Do not deploy a payment rail, token contract, wallet, or public authentication service as part of this decision.

## Rejected strategies

- Inventing or searching for a wallet that does not exist.
- Generating a custodial wallet in the website.
- Treating a local browser UUID as a universal identity.
- Claiming eFuse reserves or a live global-cost-reduction peg without independent evidence.
- Letting payment proof bypass Father/kernel authorization.

## Acceptance test

The implementation passes when a client can inspect the truthful status, receives no secret, receives no invented address, and cannot bind an entitlement or execute a write while the issuer, verifier, and Father grant remain absent.
