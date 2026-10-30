# Isolated WebAuthn identity transfer and transactional issuance

## Provenance and scope

Transferred from the reviewed Replit baseline
`80cea706fcd8fe3b56204c06ff5d2d2cda36d8dd` onto landing main
`08a79c91cd060fe9a3746417ddd3ae855d52fcc6`.
Only the custom identity handler, its staging configuration helper, schema,
v2 migration, browser identity client, two focused test suites and local
fetch-denial guard were transferred. No app pages, release manifests, Worker
entrypoints, Wrangler/environment configuration or generated assets are imported.
The schema contains the baseline's existing Iris tables; no new authority or
runtime connection is introduced. Migration files are supplied, never applied.

## Atomic issuance

The handler requires a D1-compatible `batch()` and submits the conditional
one-time consume and guarded session INSERT as a single transaction.
The insert selects only the consumed row matching this attempt's random session
hash and all request/principal/assertion bindings. A zero-row consume is not an
SQL error: guarding the insert is necessary to prevent a losing contender from
issuing a session. An insert SQL error rolls back the consumption under the
documented D1 batch contract.

Both result entries must exist, report `success === true` and have numeric
`meta.changes === 1`. Missing/malformed/failed/zero-change results never produce
GRANTED, a cookie or a successful redirect. Missing batch support returns 503.
A metadata validation failure occurs after the batch; it cannot roll back a
transaction already committed. Uncertainty is denied rather than called success.
An ambiguous response loss after commit can still strand the user; consumed
proofs are never reopened and a new ceremony is required.

Preserved: origin/RP/signature checks, assertion ownership, 30-second proof
lifetime, body-only handoff, expiry/revocation and single-use predicates.
Identity is not Trinity authorization, Father authority, or permission to act.
Browser-local Unity/iris identifiers do not establish verified identity.

## Local checks

Use Node 22, with explicit ESM default because this minimal transfer deliberately
does not import the broad original package.json or dependency lockfile:

```sh
node --experimental-default-type=module --import ./learning/no-egress-guard.mjs \
  --test --test-concurrency=1 \
  tests/identity-webauthn-cryptographic.test.mjs \
  tests/identity-handoff-lifecycle.test.mjs
python3 -B tests/test_identity_transaction_sqlite.py -v
```

No npm installation is needed. The JavaScript transaction fixture serializes
operations and models rollback; it is not proof of D1 isolation. Python tests
execute the exact handler SQL against temporary SQLite databases, including
two competing connections, rollback, collision and replay. They do not contact
D1 or apply anything to a user database. Test signing material is fixture-only.
The original cryptographic and handoff tests remain; only their database
fixtures gain batch behavior and new denial tests are additive.

## Not wired or verified

No Worker route is activated by these files. Integration still requires a
reviewed entrypoint and D1 binding, base schema plus v2 migration, compatible
issuer/receiver signing configuration, and verified domain route attachment.
Do not run a production migration or reuse checked-in fixture signing values.
No live browser ceremony, Cloudflare D1 batch, deployment, provider connectivity,
whole-app regression or identity-to-Iris integration is claimed.
Counter-zero/backup-authenticator edge tests and complete credential/session
revocation management remain separate work.
