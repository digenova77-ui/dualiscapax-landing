import test from "node:test";
import assert from "node:assert/strict";
import ledgerWorker, { PaymentTransaction } from "./worker.mjs";

class MemoryStorage {
  constructor() { this.data = new Map(); }
  async get(key) { return this.data.get(key); }
  async put(key, value) { this.data.set(key, structuredClone(value)); }
  async transaction(fn) { return fn(this); }
}

const TOKEN = "test-ledger-token-with-at-least-thirty-two-characters";
const OP = {
  contract: "dualis.x402.transaction.v1",
  unity_id: "unity_user_123",
  request_id: "request-test-12345678",
  action: "iris.compute.deterministic",
  input_sha256: "a".repeat(64),
  payment_sha256: "b".repeat(64),
};
const PAYMENT = {
  exchanged: true,
  scheme: "exact",
  amount: "10000",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  payTo: "0x0adC5f2Dcb239DAAF3eeB3cc34b3F1BFF5AFBBc4",
  payer: "0x" + "c".repeat(40),
  network: "eip155:8453",
  transaction: "0x" + "d".repeat(64),
  explorer: "https://basescan.org/tx/" + "d".repeat(64),
};
const EXECUTION = {
  receipt_id: "receipt-123",
  receipt_sha256: "e".repeat(64),
  result_sha256: "f".repeat(64),
};

async function call(object, path, body) {
  const response = await object.fetch(new Request("https://ledger.internal" + path, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  }));
  return { status: response.status, body: await response.json() };
}

test("payment transaction progresses atomically from reserve through settled to executed", async () => {
  const object = new PaymentTransaction({ storage: new MemoryStorage() });
  const claim = await call(object, "/v1/payments/claim", OP);
  assert.equal(claim.body.state, "RESERVED");
  assert.equal(claim.body.claimed, true);
  assert.equal(typeof claim.body.claim_token, "string");

  const attempting = await call(object, "/v1/payments/attempting", { ...OP, claim_token: claim.body.claim_token });
  assert.equal(attempting.body.state, "PAYMENT_ATTEMPTED");

  const record = await call(object, "/v1/payments/record", { ...OP, payment_receipt: PAYMENT });
  assert.equal(record.body.state, "SETTLED");
  assert.equal(record.body.transaction, PAYMENT.transaction);

  const complete = await call(object, "/v1/payments/complete", { ...OP, payment_receipt: PAYMENT, execution_receipt: EXECUTION });
  assert.equal(complete.body.state, "EXECUTED");

  const replay = await call(object, "/v1/payments/claim", OP);
  assert.equal(replay.body.state, "EXECUTED");
  assert.equal(replay.body.payment_receipt.transaction, PAYMENT.transaction);

  const completeAgain = await call(object, "/v1/payments/complete", { ...OP, payment_receipt: PAYMENT, execution_receipt: EXECUTION });
  assert.equal(completeAgain.body.state, "EXECUTED");
});

test("same request with a different payment digest cannot replace a settled payment", async () => {
  const object = new PaymentTransaction({ storage: new MemoryStorage() });
  const claim = await call(object, "/v1/payments/claim", OP);
  await call(object, "/v1/payments/attempting", { ...OP, claim_token: claim.body.claim_token });
  await call(object, "/v1/payments/record", { ...OP, payment_receipt: PAYMENT });
  const conflict = await call(object, "/v1/payments/claim", { ...OP, payment_sha256: "9".repeat(64) });
  assert.equal(conflict.body.state, "CONFLICT");
});

test("operation binding cannot change under an existing request ID", async () => {
  const object = new PaymentTransaction({ storage: new MemoryStorage() });
  await call(object, "/v1/payments/claim", OP);
  const conflict = await call(object, "/v1/payments/claim", { ...OP, input_sha256: "9".repeat(64) });
  assert.equal(conflict.body.state, "CONFLICT");
});

test("payment cannot be recorded before an attempt or with a malformed receipt", async () => {
  const object = new PaymentTransaction({ storage: new MemoryStorage() });
  const claim = await call(object, "/v1/payments/claim", OP);
  const premature = await call(object, "/v1/payments/record", { ...OP, payment_receipt: PAYMENT });
  assert.equal(premature.body.state, "CONFLICT");

  await call(object, "/v1/payments/attempting", { ...OP, claim_token: claim.body.claim_token });
  const malformed = await call(object, "/v1/payments/record", {
    ...OP, payment_receipt: { ...PAYMENT, amount: "999999" },
  });
  assert.equal(malformed.body.state, "CONFLICT");

  const valid = await call(object, "/v1/payments/record", { ...OP, payment_receipt: PAYMENT });
  assert.equal(valid.body.state, "SETTLED");
});

test("attempting requires the exact live reservation token", async () => {
  const object = new PaymentTransaction({ storage: new MemoryStorage() });
  await call(object, "/v1/payments/claim", OP);
  const bad = await call(object, "/v1/payments/attempting", { ...OP, claim_token: "wrong-token" });
  assert.equal(bad.body.state, "CONFLICT");
});

test("known unpaid reservation can be released and retried with a new payment digest", async () => {
  const object = new PaymentTransaction({ storage: new MemoryStorage() });
  const claim = await call(object, "/v1/payments/claim", OP);
  await call(object, "/v1/payments/attempting", { ...OP, claim_token: claim.body.claim_token });
  const released = await call(object, "/v1/payments/release", { ...OP, reason: "invalid_signature" });
  assert.equal(released.body.state, "RELEASED");
  const retry = await call(object, "/v1/payments/claim", { ...OP, payment_sha256: "9".repeat(64) });
  assert.equal(retry.body.state, "RESERVED");
  assert.equal(retry.body.claimed, true);
});

test("ambiguous payment cannot be silently reset to a fresh charge", async () => {
  const object = new PaymentTransaction({ storage: new MemoryStorage() });
  const claim = await call(object, "/v1/payments/claim", OP);
  await call(object, "/v1/payments/attempting", { ...OP, claim_token: claim.body.claim_token });
  const doubtful = await call(object, "/v1/payments/in-doubt", { ...OP, reason: "facilitator_timeout" });
  assert.equal(doubtful.body.state, "IN_DOUBT");
  const retry = await call(object, "/v1/payments/claim", { ...OP, payment_sha256: "9".repeat(64) });
  assert.equal(retry.body.state, "IN_DOUBT");
});

test("ledger Worker requires the service token and routes authenticated requests to the Durable Object", async () => {
  const objects = new Map();
  const env = {
    LEDGER_TOKEN: TOKEN,
    TRANSACTIONS: {
      idFromName(name) { return name; },
      get(id) {
        if (!objects.has(id)) objects.set(id, new PaymentTransaction({ storage: new MemoryStorage() }));
        return objects.get(id);
      },
    },
  };
  const denied = await ledgerWorker.fetch(new Request("https://ledger.test/v1/payments/claim", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(OP),
  }), env);
  assert.equal(denied.status, 401);

  const allowed = await ledgerWorker.fetch(new Request("https://ledger.test/v1/payments/claim", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + TOKEN },
    body: JSON.stringify(OP),
  }), env);
  assert.equal(allowed.status, 200);
  assert.equal((await allowed.json()).state, "RESERVED");
});

test("ledger refuses a receipt whose token asset does not match its network", async () => {
  const object = new PaymentTransaction({ storage: new MemoryStorage() });
  const claim = await call(object, "/v1/payments/claim", OP);
  await call(object, "/v1/payments/attempting", { ...OP, claim_token: claim.body.claim_token });
  const response = await call(object, "/v1/payments/record", {
    ...OP,
    payment_receipt: { ...PAYMENT, asset: "0x" + "a".repeat(40) },
  });
  assert.equal(response.body.state, "CONFLICT");
});

test("concurrent duplicate claim cannot start a second payment attempt", async () => {
  const object = new PaymentTransaction({ storage: new MemoryStorage() });
  const first = await call(object, "/v1/payments/claim", OP);
  const second = await call(object, "/v1/payments/claim", OP);
  assert.equal(first.body.claimed, true);
  assert.equal(second.body.state, "RESERVED");
  assert.equal(second.body.claimed, false);
  assert.equal(second.body.claim_token, undefined);
});

test("releasing a known-unpaid payment reservation is idempotent", async () => {
  const object = new PaymentTransaction({ storage: new MemoryStorage() });
  const claim = await call(object, "/v1/payments/claim", OP);
  await call(object, "/v1/payments/attempting", { ...OP, claim_token: claim.body.claim_token });
  const first = await call(object, "/v1/payments/release", { ...OP, reason: "invalid_signature" });
  const second = await call(object, "/v1/payments/release", { ...OP, reason: "retry" });
  assert.equal(first.body.state, "RELEASED");
  assert.equal(second.body.state, "RELEASED");
});

test("retry after release clears prior settlement fields without undefined durable values", async () => {
  const storage = new MemoryStorage();
  const object = new PaymentTransaction({ storage });
  const claim = await call(object, "/v1/payments/claim", OP);
  await call(object, "/v1/payments/attempting", { ...OP, claim_token: claim.body.claim_token });
  await call(object, "/v1/payments/release", { ...OP, reason: "invalid_signature" });
  const retry = await call(object, "/v1/payments/claim", { ...OP, payment_sha256: "9".repeat(64) });
  assert.equal(retry.body.state, "RESERVED");
  const record = await storage.get("transaction");
  assert.equal(Object.hasOwn(record, "payment_receipt"), false);
  assert.equal(Object.hasOwn(record, "execution_receipt"), false);
  assert.equal(Object.hasOwn(record, "transaction"), false);
});
