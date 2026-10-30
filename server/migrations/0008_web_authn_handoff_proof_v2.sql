-- Versioned proof records extend the existing D1 identity/handoff flow without
-- trusting legacy bearer rows. CHALLENGE rows are created with server-owned
-- ceremony context; only a verified assertion can transition one to ISSUED.
CREATE TABLE IF NOT EXISTS identity_handoff_proof_v2 (
  request_id TEXT PRIMARY KEY,
  proof_version INTEGER NOT NULL CHECK (proof_version = 2),
  challenge_hash TEXT NOT NULL UNIQUE,
  subject_id TEXT NOT NULL,
  issuer_origin TEXT NOT NULL,
  rp_id TEXT NOT NULL,
  target_origin TEXT NOT NULL,
  target_path TEXT NOT NULL,
  action TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('CHALLENGE', 'ISSUED', 'CONSUMED', 'REVOKED')),
  created_at INTEGER NOT NULL,
  challenge_expires_at INTEGER NOT NULL,
  assertion_digest TEXT,
  jti_hash TEXT UNIQUE,
  nonce_hash TEXT,
  session_binding_hash TEXT,
  issued_at INTEGER,
  expires_at INTEGER,
  consumed_at INTEGER,
  revoked_at INTEGER,
  session_hash TEXT UNIQUE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_identity_handoff_proof_v2_nonce
  ON identity_handoff_proof_v2(nonce_hash)
  WHERE nonce_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS identity_handoff_contract_version (
  version INTEGER PRIMARY KEY CHECK (version = 2),
  installed_at INTEGER NOT NULL
);
INSERT INTO identity_handoff_contract_version (version, installed_at)
VALUES (2, CAST(strftime('%s', 'now') AS INTEGER) * 1000)
ON CONFLICT(version) DO NOTHING;
