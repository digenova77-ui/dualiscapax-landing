-- Canonical append-only Fuel ledger (design migration; not yet bound to runtime).
-- Existing stripe-fulfill fuel_credits remains the historical grant source until migration.
-- Apply only in a dedicated staging D1 database after review.

CREATE TABLE IF NOT EXISTS fuel_ledger_entries (
  entry_id TEXT PRIMARY KEY,
  principal_id TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('grant','reserve','charge','release','adjustment','refund_reversal')),
  units_delta INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_id TEXT,
  reservation_id TEXT,
  source_rail TEXT NOT NULL CHECK (source_rail IN ('stripe','crypto','operator','runtime')),
  source_ref TEXT,
  sku TEXT,
  currency TEXT,
  amount_minor INTEGER,
  pricing_version TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fuel_ledger_principal_time
  ON fuel_ledger_entries(principal_id, created_at);
CREATE INDEX IF NOT EXISTS idx_fuel_ledger_request
  ON fuel_ledger_entries(principal_id, request_id);
CREATE INDEX IF NOT EXISTS idx_fuel_ledger_reservation
  ON fuel_ledger_entries(principal_id, reservation_id);
CREATE INDEX IF NOT EXISTS idx_fuel_ledger_source
  ON fuel_ledger_entries(source_rail, source_ref);

-- Balance is derived, never a mutable counter:
-- SELECT COALESCE(SUM(units_delta), 0) FROM fuel_ledger_entries WHERE principal_id = ?;
-- Grant = positive units_delta.
-- Reserve = negative units_delta; it immediately removes units from available balance.
-- Charge = zero delta receipt/audit event tied to a reservation.
-- Release = positive units_delta exactly once, only when the reservation is safely releasable.
-- Adjustments/reversals must be separately authorized, append-only, and reconciled.
--
-- A reservation must be one atomic conditional insert (not SELECT-then-INSERT):
-- INSERT INTO fuel_ledger_entries (...)
-- SELECT ... WHERE (SELECT COALESCE(SUM(units_delta), 0)
--   FROM fuel_ledger_entries WHERE principal_id = ?1) >= ?2
-- ON CONFLICT(idempotency_key) DO NOTHING;
-- Check changes===1 to confirm a new reservation. A duplicate key must be looked up and
-- validated against principal_id, request_id, and units_delta; never treat any conflict as success.
--
-- IMPORTANT: validate the exact SQL/D1 transaction semantics with concurrent integration tests
-- before enabling runtime use. This file is a reviewed design artifact, not a deployment migration.
