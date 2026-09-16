-- Additive. Does not rename events / entitlements / fuel_credits.
-- atom = dc:{sku}:{host}:{window}:{payer}  OR  cs:{session_id} fallback.
-- Apply: wrangler d1 execute dualiscapax-fulfillments --remote --file=workers/stripe-fulfill/schema-atom.sql

CREATE TABLE IF NOT EXISTS grants (
  atom       TEXT PRIMARY KEY,
  event_id   TEXT NOT NULL,
  session_id TEXT,
  sku        TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grants_event ON grants(event_id);
CREATE INDEX IF NOT EXISTS idx_grants_session ON grants(session_id);
