-- dualis-unity  DCLM Layer [0]  CHECKOUT_OPEN stays false
-- Append-only webhook_event. No entitlements. No fuel. No Dualis coin.

CREATE TABLE IF NOT EXISTS unity (
  unity_id   TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  role       TEXT NOT NULL DEFAULT 'person'
);

CREATE TABLE IF NOT EXISTS unity_fields (
  unity_id      TEXT PRIMARY KEY,
  declared_name TEXT,
  name_ok       INTEGER NOT NULL DEFAULT 0,
  locale        TEXT,
  last_room     TEXT,
  work_attested INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL,
  FOREIGN KEY (unity_id) REFERENCES unity(unity_id)
);

CREATE TABLE IF NOT EXISTS unity_session (
  session_hash TEXT PRIMARY KEY,
  unity_id     TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  FOREIGN KEY (unity_id) REFERENCES unity(unity_id)
);

CREATE TABLE IF NOT EXISTS unity_kyc (
  unity_id TEXT PRIMARY KEY,
  kyc      INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (unity_id) REFERENCES unity(unity_id)
);

CREATE TABLE IF NOT EXISTS webhook_event (
  event_id     TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  payload_hash TEXT,
  unity_id     TEXT,
  created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_unity ON unity_session(unity_id);
CREATE INDEX IF NOT EXISTS idx_session_exp ON unity_session(expires_at);
CREATE INDEX IF NOT EXISTS idx_webhook_type ON webhook_event(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_unity ON webhook_event(unity_id);
