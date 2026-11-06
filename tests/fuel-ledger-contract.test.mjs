import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workerPath = new URL("../workers/fuel-ledger/worker.mjs", import.meta.url);
const schemaPath = new URL("../workers/fuel-ledger/schema.sql", import.meta.url);
const wranglerPath = new URL("../workers/fuel-ledger/wrangler.toml", import.meta.url);

test("ledger remains private and staging-only until configured", async () => {
  const source = await readFile(workerPath, "utf8");
  const config = await readFile(wranglerPath, "utf8");
  assert.match(source, /FUEL_LEDGER_SERVICE_TOKEN/);
  assert.match(source, /FUEL_LEDGER_GRANT_TOKEN/);
  assert.match(config, /REPLACE_WITH_STAGING_DATABASE_ID/);
  assert.match(config, /workers_dev = false/);
});

test("ledger uses an append-only derived balance and conditional reservation", async () => {
  const source = await readFile(workerPath, "utf8");
  const schema = await readFile(schemaPath, "utf8");
  assert.match(schema, /idempotency_key TEXT NOT NULL UNIQUE/);
  assert.match(schema, /uq_fuel_grant_source/);
  assert.match(source, /SUM\(units_delta\)/);
  assert.match(source, /WHERE \(SELECT COALESCE\(SUM\(units_delta\), 0\)/);
  assert.match(source, /ON CONFLICT\(idempotency_key\) DO NOTHING/);
});

test("ledger refuses release without explicit safe-failure evidence", async () => {
  const source = await readFile(workerPath, "utf8");
  assert.match(source, /body\.outcome === "release" && body\.safe_failure !== true/);
  assert.match(source, /UNKNOWN provider outcomes must remain reserved/);
});

test("settlement is constrained to one terminal event per reservation", async () => {
  const source = await readFile(workerPath, "utf8");
  assert.match(source, /NOT EXISTS \(SELECT 1 FROM fuel_ledger_entries WHERE reservation_id = \?7 AND entry_type IN \('charge','release'\)\)/);
  assert.match(source, /reservation-already-settled/);
});

test("grant endpoint has a distinct adapter credential", async () => {
  const source = await readFile(workerPath, "utf8");
  assert.match(source, /x-ledger-grant-token/);
  assert.match(source, /settlement-adapter-auth-required/);
});
