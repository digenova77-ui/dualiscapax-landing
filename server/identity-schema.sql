-- Shared by dualiscapax-depth (.com verifier) and dualiscapax-origin-join (.ai receiver).
-- Keep this database private; it stores credential public keys and identity session metadata.

CREATE TABLE IF NOT EXISTS identity_challenge (
  challenge_hash TEXT PRIMARY KEY,
  purpose TEXT NOT NULL CHECK (purpose IN ('register', 'assertion')),
  subject_id TEXT NOT NULL,
  credential_id TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_identity_challenge_expiry
  ON identity_challenge(expires_at);

CREATE TABLE IF NOT EXISTS identity_credential (
  credential_id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  public_key_json TEXT NOT NULL,
  algorithm INTEGER NOT NULL CHECK (algorithm IN (-7, -257)),
  sign_count INTEGER NOT NULL DEFAULT 0,
  backup_eligible INTEGER NOT NULL DEFAULT 0 CHECK (backup_eligible IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_identity_credential_subject
  ON identity_credential(subject_id);

CREATE TABLE IF NOT EXISTS identity_handoff (
  jti_hash TEXT PRIMARY KEY,
  nonce_hash TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  consumed_at INTEGER,
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_identity_handoff_expiry
  ON identity_handoff(expires_at);

CREATE TABLE IF NOT EXISTS identity_session (
  session_hash TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_identity_session_expiry
  ON identity_session(expires_at);

CREATE TABLE IF NOT EXISTS iris_provider_consent (
  session_hash TEXT PRIMARY KEY REFERENCES identity_session(session_hash) ON DELETE CASCADE,
  granted_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL CHECK (expires_at > granted_at)
);

CREATE INDEX IF NOT EXISTS idx_iris_provider_consent_expiry
  ON iris_provider_consent(expires_at);

CREATE TABLE IF NOT EXISTS trinity_iris_policy_audit (
  receipt_id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('IRIS_CHAT_TURN', 'IRIS_SPEECH_SYNTHESIS')),
  decision TEXT NOT NULL CHECK (decision IN ('ALLOW', 'DENY')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS idx_trinity_iris_policy_audit_expiry
  ON trinity_iris_policy_audit(expires_at);

CREATE TABLE IF NOT EXISTS iris_trinity_receipt_use (
  receipt_id TEXT PRIMARY KEY CHECK (length(receipt_id) BETWEEN 8 AND 128),
  actor_session_binding TEXT NOT NULL CHECK (length(actor_session_binding) = 64),
  session_hash TEXT NOT NULL CHECK (length(session_hash) = 64),
  consent_granted_at INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('IRIS_CHAT_TURN', 'IRIS_SPEECH_SYNTHESIS')),
  target TEXT NOT NULL CHECK (
    (action = 'IRIS_CHAT_TURN' AND target = 'https://api.x.ai/v1/chat/completions') OR
    (action = 'IRIS_SPEECH_SYNTHESIS' AND target = 'https://api.x.ai/v1/tts')
  ),
  mutation_class TEXT NOT NULL CHECK (
    mutation_class = 'EXTERNAL_PROVIDER_EGRESS_NO_AUTHORITATIVE_WRITE'
  ),
  authorization_expires_at INTEGER NOT NULL,
  receipt_expires_at INTEGER NOT NULL CHECK (receipt_expires_at <= authorization_expires_at),
  consumed_at INTEGER NOT NULL CHECK (
    consent_granted_at <= consumed_at AND consumed_at < receipt_expires_at
  )
);
CREATE INDEX IF NOT EXISTS idx_iris_trinity_receipt_use_expiry
  ON iris_trinity_receipt_use(receipt_expires_at);
CREATE TRIGGER IF NOT EXISTS iris_trinity_receipt_use_immutable
  BEFORE UPDATE ON iris_trinity_receipt_use
  BEGIN
    SELECT RAISE(ABORT, 'IRIS_TRINITY_RECEIPT_USE_IMMUTABLE');
  END;

CREATE TABLE IF NOT EXISTS identity_rate_limit (
  rate_key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);

-- Staging-only Iris request idempotency and opt-in conversation memory.
CREATE TABLE IF NOT EXISTS iris_request_claim (
  subject_id TEXT NOT NULL CHECK (length(subject_id) BETWEEN 1 AND 200),
  request_id TEXT NOT NULL CHECK (length(request_id) BETWEEN 8 AND 128),
  session_hash TEXT NOT NULL CHECK (length(session_hash) = 64),
  state TEXT NOT NULL CHECK (state IN ('CLAIMED', 'AUTHORIZED', 'COMPLETED', 'FAILED')),
  claimed_at INTEGER NOT NULL CHECK (claimed_at > 0),
  updated_at INTEGER NOT NULL CHECK (updated_at >= claimed_at),
  expires_at INTEGER NOT NULL CHECK (
    expires_at > claimed_at AND expires_at <= claimed_at + 2592000000
  ),
  receipt_id TEXT,
  PRIMARY KEY (subject_id, request_id)
);
CREATE INDEX IF NOT EXISTS idx_iris_request_claim_expiry
  ON iris_request_claim(expires_at);

CREATE TABLE IF NOT EXISTS iris_memory_consent (
  subject_id TEXT PRIMARY KEY CHECK (length(subject_id) BETWEEN 1 AND 200),
  granted_at INTEGER NOT NULL CHECK (granted_at > 0),
  expires_at INTEGER NOT NULL CHECK (
    expires_at > granted_at AND expires_at <= granted_at + 2592000000
  ),
  revoked_at INTEGER CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);
CREATE INDEX IF NOT EXISTS idx_iris_memory_consent_expiry
  ON iris_memory_consent(expires_at);

CREATE TABLE IF NOT EXISTS iris_conversation_memory (
  subject_id TEXT NOT NULL CHECK (length(subject_id) BETWEEN 1 AND 200),
  request_id TEXT NOT NULL CHECK (length(request_id) BETWEEN 8 AND 128),
  user_text TEXT NOT NULL CHECK (length(user_text) BETWEEN 1 AND 2200),
  assistant_text TEXT NOT NULL CHECK (length(assistant_text) BETWEEN 1 AND 1200),
  created_at INTEGER NOT NULL CHECK (created_at > 0),
  expires_at INTEGER NOT NULL CHECK (
    expires_at > created_at AND expires_at <= created_at + 604800000
  ),
  PRIMARY KEY (subject_id, request_id)
);
CREATE INDEX IF NOT EXISTS idx_iris_conversation_memory_expiry
  ON iris_conversation_memory(subject_id, expires_at);
CREATE TRIGGER IF NOT EXISTS iris_conversation_memory_immutable
  BEFORE UPDATE ON iris_conversation_memory
  BEGIN
    SELECT RAISE(ABORT, 'IRIS_CONVERSATION_MEMORY_IMMUTABLE');
  END;

CREATE TABLE IF NOT EXISTS iris_staging_provider_usage (
  request_id TEXT PRIMARY KEY CHECK (length(request_id) BETWEEN 8 AND 128),
  subject_id TEXT NOT NULL CHECK (length(subject_id) BETWEEN 1 AND 200),
  receipt_id TEXT NOT NULL UNIQUE CHECK (length(receipt_id) BETWEEN 8 AND 128),
  decision_class TEXT NOT NULL CHECK (decision_class = 'IRIS_PROVIDER_TURN'),
  units INTEGER NOT NULL CHECK (units = 1),
  tariff_version TEXT NOT NULL CHECK (tariff_version = 'iris-xai-staging-turn-v1'),
  created_at INTEGER NOT NULL CHECK (created_at > 0)
);
CREATE INDEX IF NOT EXISTS idx_iris_staging_provider_usage_subject_created
  ON iris_staging_provider_usage(subject_id, created_at);
CREATE TRIGGER IF NOT EXISTS iris_staging_provider_usage_debit
  BEFORE INSERT ON iris_staging_provider_usage
  BEGIN
    UPDATE iris_decision_wallet
       SET balance = balance - NEW.units,
           updated_at = NEW.created_at
     WHERE subject_id = NEW.subject_id
       AND balance >= NEW.units;
    SELECT CASE WHEN changes() != 1
      THEN RAISE(ABORT, 'INSUFFICIENT_DECISION_CREDITS') END;
  END;
CREATE TRIGGER IF NOT EXISTS iris_staging_provider_usage_immutable_update
  BEFORE UPDATE ON iris_staging_provider_usage
  BEGIN
    SELECT RAISE(ABORT, 'IRIS_STAGING_PROVIDER_USAGE_IMMUTABLE');
  END;
CREATE TRIGGER IF NOT EXISTS iris_staging_provider_usage_immutable_delete
  BEFORE DELETE ON iris_staging_provider_usage
  BEGIN
    SELECT RAISE(ABORT, 'IRIS_STAGING_PROVIDER_USAGE_IMMUTABLE');
  END;
