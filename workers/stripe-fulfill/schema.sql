-- DualisCapax Entitlements & Webhook Idempotency D1 Schema
CREATE TABLE IF NOT EXISTS entitlements (
    session_id TEXT PRIMARY KEY,
    token_id TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_token_id ON entitlements(token_id);
