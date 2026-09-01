-- DualisCapax D1 · encyclopedia gateway spec
-- Database: dualiscapax-fulfillments
-- events = accepted Stripe webhook (append-only)
-- entitlements = write-once grant (ON CONFLICT session_id DO NOTHING)

CREATE TABLE IF NOT EXISTS events (
  event_id     TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  session_id   TEXT,
  payload_hash TEXT,
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS entitlements (
  session_id       TEXT PRIMARY KEY,
  token_id         TEXT NOT NULL UNIQUE,
  email            TEXT NOT NULL,
  tier             TEXT NOT NULL DEFAULT 'UNRESOLVED',
  sku              TEXT NOT NULL DEFAULT 'unresolved',
  amount_cad_cents INTEGER,
  currency         TEXT,
  status           TEXT NOT NULL,
  created_at       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_token_id ON entitlements(token_id);
CREATE INDEX IF NOT EXISTS idx_email ON entitlements(email);
CREATE INDEX IF NOT EXISTS idx_sku ON entitlements(sku);
