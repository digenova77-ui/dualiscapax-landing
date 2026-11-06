# Canonical Fuel ledger (staging-first)

This Worker is a private D1-backed ledger implementation. It is not yet connected to Iris Runtime, Stripe fulfillment, or crypto settlement. Do not deploy until a dedicated staging D1 database exists, `schema.sql` is applied, credentials are configured, and the concurrency/integration tests pass.

## Security boundaries

- All routes require `Authorization: Bearer <FUEL_LEDGER_SERVICE_TOKEN>`.
- `/v1/ledger/grant` additionally requires `x-ledger-grant-token: <FUEL_LEDGER_GRANT_TOKEN>`. Only a trusted settlement adapter should possess this token.
- Do not bind this service to a public route or call it from browser code.
- Grant authentication proves which adapter called, not that payment settled. The adapter must independently verify Stripe webhook signatures / crypto settlement before granting.
- The runtime must derive `principal_id` from verified identity and pass the exact Trinity-authorized request context. Client-supplied balance, email, or principal is not authority.
- No secrets or production identifiers belong in source control.

## Endpoints

All endpoints are POST with JSON.

- `/v1/ledger/health`: private storage health only.
- `/v1/ledger/balance`: `{ principal_id }`; returns the derived sum of ledger entries.
- `/v1/ledger/grant`: settlement-adapter-only grant with `principal_id`, positive `units`, `idempotency_key`, `source_rail`, `source_ref`, and `settlement_ref`.
- `/v1/ledger/reserve`: `{ principal_id, request_id, units, action, input_sha256, trinity_receipt_id, idempotency_key }`; conditional insert debits only if derived balance covers the request.
- `/v1/ledger/settle`: `{ principal_id, reservation_id, idempotency_key, outcome: "charge"|"release", outcome_ref }`. Release additionally requires `safe_failure: true`; UNKNOWN provider outcomes must remain reserved for reconciliation.

## Ledger invariants

- Entries are append-only; balance is derived from `SUM(units_delta)`.
- Idempotency conflicts are checked against principal, units, request, and context; a conflict is never automatically accepted as success.
- Reservation uses one conditional insert statement, rather than a separate balance read followed by a debit.
- Charge/release is guarded by a conditional insert that checks for an existing terminal settlement. Verify behavior under concurrent D1 requests before relying on it.
- The current implementation does not itself validate a Trinity receipt with the Trinity service; the trusted runtime integration must perform that verification before reserve.
- Settlement routes are still a staging service contract, not an end-to-end financial control plane.

## Required pre-enable gates

1. Create a dedicated staging D1 database and apply `schema.sql`.
2. Replace the placeholder database ID in `wrangler.toml`; configure both secrets through the secret manager.
3. Add D1-backed integration tests against concurrent reserve and concurrent charge-vs-release; verify exactly one terminal settlement.
4. Test duplicate grant, same idempotency key with changed principal/units, insufficient balance, request digest mismatch, unauthorized callers, and database outage.
5. Wire Iris Runtime only after its Trinity/receipt validation and Fuel reservation/settlement behavior are tested together.
6. Connect Stripe and crypto through separate settlement adapters; do not migrate email-keyed historical grants without verified Unity ID linking.
7. Keep paid/depth actions fail-closed until the entire staging gauntlet passes.

Production deployment, live payment activation, and database migrations are not performed by this source change.
