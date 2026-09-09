-- DualisCapax D1 · DEC-M weekly instrument
-- Read-only view over entitlements + fuel_credits.
-- DEC-M is not live. This view returns zero rows until a matching sku is granted.
-- Do not INSERT demo grants. Do not flip checkout.

-- ISO-ish week key from unix created_at (UTC).
-- class: suffix after sku.decision.month. else UNRESOLVED.

CREATE VIEW IF NOT EXISTS dec_m_weekly AS
SELECT
  strftime('%Y-%W', e.created_at, 'unixepoch') AS week,
  e.sku AS sku,
  CASE
    WHEN e.sku LIKE 'sku.decision.month.%'
      THEN substr(e.sku, length('sku.decision.month.') + 1)
    ELSE 'UNRESOLVED'
  END AS class,
  COUNT(*) AS n_grants,
  COUNT(DISTINCT e.email) AS n_emails,
  SUM(e.amount_cad_cents) AS cad_paid_cents,
  COALESCE((
    SELECT SUM(f.units)
    FROM fuel_credits f
    WHERE f.email IN (
      SELECT e2.email
      FROM entitlements e2
      WHERE e2.sku IN ('DEC-M', 'dec-m', 'sku.decision.month')
         OR e2.sku LIKE 'sku.decision.month.%'
        AND strftime('%Y-%W', e2.created_at, 'unixepoch')
            = strftime('%Y-%W', e.created_at, 'unixepoch')
    )
      AND strftime('%Y-%W', f.created_at, 'unixepoch')
          = strftime('%Y-%W', e.created_at, 'unixepoch')
  ), 0) AS fuel_units
FROM entitlements e
WHERE e.sku IN ('DEC-M', 'dec-m', 'sku.decision.month')
   OR e.sku LIKE 'sku.decision.month.%'
GROUP BY
  strftime('%Y-%W', e.created_at, 'unixepoch'),
  e.sku,
  class;

CREATE INDEX IF NOT EXISTS idx_entitlements_created ON entitlements(created_at);
CREATE INDEX IF NOT EXISTS idx_fuel_created ON fuel_credits(created_at);
