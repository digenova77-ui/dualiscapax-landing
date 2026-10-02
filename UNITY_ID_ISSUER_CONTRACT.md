# Unity ID Issuer Contract

**Status:** registration-preparation contract only; no production issuer is deployed.

## Required identity properties

A production Unity ID must be minted by an independently operated issuer after a verified WebAuthn/passkey ceremony. The browser may hold a credential reference and public key metadata, but DualisCapax must never receive or store a seed phrase, private key, passphrase, or biometric data.

The issuer-created record must contain an opaque subject identifier, issuer identifier, credential key reference, audience, issuance time, expiry, nonce, capability scope, and revocation reference. It must not contain raw government identifiers, wallet private keys, or unredacted connector credentials.

## Registration sequence

1. Client requests a registration challenge from the issuer.
2. Issuer returns a short-lived, single-use challenge and RP/origin metadata.
3. User completes a platform passkey ceremony.
4. Issuer verifies the attestation and stores only the public credential record.
5. Issuer mints an opaque `unity:subject:<id>` identifier.
6. Client presents the issuer-signed subject assertion to API v2.
7. API v2 binds capabilities only after issuer, audience, expiry, nonce, and revocation checks pass.
8. Wallet binding, if later approved, remains non-custodial and separate from identity issuance.

## Current boundary

The local bootstrap may prepare a challenge-shaped response for development testing, but it must label the result `LOCAL_PREPARATION_ONLY`. It must not claim that the challenge was issued by a production Unity issuer, and it must not mint a production Unity ID.

## Fail-closed conditions

Unknown issuer, wrong origin, expired challenge, reused challenge, invalid signature, missing audience, missing expiry, revoked subject, or missing Father/kernel grant must produce `HOLE` or `WAIT_GRANT`; none may produce an entitlement or machine write.
