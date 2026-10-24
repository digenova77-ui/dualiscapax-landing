import test from "node:test";
import assert from "node:assert/strict";
import {
  AMOUNT, PAY_TO, decodeHeader, encodeHeader, handleExchange, requirementOf,
} from "../../js/x402-exchange.js";

const validSignature = "0x" + "a".repeat(130);
const validAddress = "0x" + "1".repeat(40);
const validNonce = "0x" + "b".repeat(64);
const baseUrl = "https://dualiscapax.ai/api/x402/exchange";
const TEST_ENV = { X402_ENABLE_MAINNET: "true", X402_AMOUNT: AMOUNT, X402_PAY_TO: PAY_TO };

function paymentPayload(overrides = {}) {
  const rail = {
    scheme: "exact",
    network: "eip155:8453",
    amount: AMOUNT,
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    payTo: PAY_TO,
    maxTimeoutSeconds: 300,
    extra: { name: "USD Coin", version: "2", assetTransferMethod: "eip3009" },
  };
  return {
    x402Version: 2,
    resource: { url: baseUrl, mimeType: "application/json" },
    accepted: requirementOf(rail),
    payload: {
      signature: validSignature,
      authorization: {
        from: validAddress,
        to: PAY_TO,
        value: AMOUNT,
        validAfter: "0",
        validBefore: String(Math.floor(Date.now() / 1000) + 60),
        nonce: validNonce,
      },
    },
    ...overrides,
  };
}

function request(payload) {
  return new Request(baseUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "payment-signature": encodeHeader(payload),
    },
  });
}

function mockFetch({ verify = { isValid: true, payer: validAddress }, settle = {
  success: true, transaction: "0x" + "c".repeat(64), payer: validAddress, network: "eip155:8453",
}, verifyStatus = 200, settleStatus = 200, throwAt = null } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const path = new URL(url).pathname;
    calls.push({ path, body: JSON.parse(init.body) });
    if (throwAt === path) throw new Error("simulated network failure");
    const status = path.endsWith("/verify") ? verifyStatus : settleStatus;
    const body = path.endsWith("/verify") ? verify : settle;
    return Response.json(body, { status });
  };
  return { fetchImpl, calls };
}

test("GET without payment returns x402 402 challenge with exact rails", async () => {
  const response = await handleExchange(new Request(baseUrl), { env: {} });
  assert.equal(response.status, 402);
  const body = await response.json();
  assert.equal(body.x402Version, 2);
  assert.equal(body.accepts.length, 1);
  assert.equal(body.accepts[0].scheme, "exact");
  assert.equal(body.accepts[0].network, "eip155:84532");
  assert.equal(body.accepts[0].amount, "10000");
  assert.equal(decodeHeader(response.headers.get("PAYMENT-REQUIRED")).x402Version, 2);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("valid TEST-shaped payment calls facilitator verify before settle and returns receipt only after success", async () => {
  const { fetchImpl, calls } = mockFetch();
  const response = await handleExchange(request(paymentPayload()), { fetch: fetchImpl, env: TEST_ENV });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.exchanged, true);
  assert.equal(body.transaction, "0x" + "c".repeat(64));
  assert.deepEqual(calls.map((call) => call.path), ["/verify", "/settle"]);
  assert.equal(calls[0].body.paymentRequirements.amount, "10000");
  assert.equal(decodeHeader(response.headers.get("PAYMENT-RESPONSE")).success, true);
});

test("malformed payment header fails without calling facilitator", async () => {
  const { fetchImpl, calls } = mockFetch();
  const response = await handleExchange(new Request(baseUrl, {
    method: "POST", headers: { "payment-signature": "%%%not-base64%%%" },
  }), { fetch: fetchImpl, env: TEST_ENV });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_payload");
  assert.equal(calls.length, 0);
});

test("wrong x402 version and wrong amount are refused before facilitator", async () => {
  for (const payload of [
    paymentPayload({ x402Version: 1 }),
    paymentPayload({ accepted: { ...paymentPayload().accepted, amount: "1" } }),
  ]) {
    const { fetchImpl, calls } = mockFetch();
    const response = await handleExchange(request(payload), { fetch: fetchImpl, env: TEST_ENV });
    assert.equal(response.status, 402);
    assert.equal(calls.length, 0);
  }
});

test("malformed signature and recipient mismatch are refused before facilitator", async () => {
  const badSignature = paymentPayload();
  badSignature.payload.signature = "0x1234";
  const badRecipient = paymentPayload();
  badRecipient.payload.authorization.to = "0x" + "2".repeat(40);
  for (const payload of [badSignature, badRecipient]) {
    const { fetchImpl, calls } = mockFetch();
    const response = await handleExchange(request(payload), { fetch: fetchImpl, env: TEST_ENV });
    assert.equal(response.status, 402);
    assert.equal(calls.length, 0);
  }
});

test("invalid facilitator verification refuses settlement", async () => {
  const { fetchImpl, calls } = mockFetch({ verify: { isValid: false, invalidReason: "invalid_signature" } });
  const response = await handleExchange(request(paymentPayload()), { fetch: fetchImpl, env: TEST_ENV });
  assert.equal(response.status, 402);
  assert.deepEqual(calls.map((call) => call.path), ["/verify"]);
});

test("facilitator HTTP errors cannot be treated as successful verification or settlement", async () => {
  const verifyFailure = mockFetch({ verifyStatus: 503, verify: { isValid: true, payer: validAddress } });
  const verifyResponse = await handleExchange(request(paymentPayload()), { fetch: verifyFailure.fetchImpl, env: TEST_ENV });
  assert.notEqual(verifyResponse.status, 200);
  assert.deepEqual(verifyFailure.calls.map((call) => call.path), ["/verify"]);

  const settleFailure = mockFetch({ settleStatus: 503, settle: { success: true, transaction: "0x" + "c".repeat(64) } });
  const settleResponse = await handleExchange(request(paymentPayload()), { fetch: settleFailure.fetchImpl, env: TEST_ENV });
  assert.notEqual(settleResponse.status, 200);
  assert.deepEqual(settleFailure.calls.map((call) => call.path), ["/verify", "/settle"]);
});

test("failed settlement or missing transaction hash never returns an exchange receipt", async () => {
  for (const settle of [
    { success: false, errorReason: "settlement_failed" },
    { success: true, transaction: "not-a-transaction" },
    { success: true, transaction: "" },
  ]) {
    const { fetchImpl } = mockFetch({ settle });
    const response = await handleExchange(request(paymentPayload()), { fetch: fetchImpl, env: TEST_ENV });
    assert.notEqual(response.status, 200);
    assert.notEqual((await response.json()).exchanged, true);
  }
});

test("facilitator network errors fail closed", async () => {
  for (const path of ["/verify", "/settle"]) {
    const { fetchImpl } = mockFetch({ throwAt: path });
    const response = await handleExchange(request(paymentPayload()), { fetch: fetchImpl, env: TEST_ENV });
    assert.equal(response.status, 500);
  }
});

test("invalid payment configuration fails closed", async () => {
  const response = await handleExchange(new Request(baseUrl), { env: { X402_PAY_TO: "not-an-address" } });
  assert.equal(response.status, 500);
});

test("unsupported methods are refused", async () => {
  const response = await handleExchange(new Request(baseUrl, { method: "DELETE" }), { env: TEST_ENV });
  assert.equal(response.status, 405);
});

test("resource binding and authorization window are checked before facilitator calls", async () => {
  const wrongResource = paymentPayload();
  wrongResource.resource.url = "https://dualiscapax.ai/a-different-paid-resource";
  const expired = paymentPayload();
  expired.payload.authorization.validBefore = String(Math.floor(Date.now() / 1000) - 1);
  const tooLong = paymentPayload();
  tooLong.payload.authorization.validBefore = String(Math.floor(Date.now() / 1000) + 301);
  const futureStart = paymentPayload();
  futureStart.payload.authorization.validAfter = String(Math.floor(Date.now() / 1000) + 1);
  for (const payload of [wrongResource, expired, tooLong, futureStart]) {
    const { fetchImpl, calls } = mockFetch();
    const response = await handleExchange(request(payload), { fetch: fetchImpl, env: TEST_ENV });
    assert.equal(response.status, 402);
    assert.equal(calls.length, 0);
  }
});

test("settlement cannot report a different network or payer than the verified payment", async () => {
  for (const settle of [
    { success: true, transaction: "0x" + "c".repeat(64), payer: validAddress, network: "eip155:84532" },
    { success: true, transaction: "0x" + "c".repeat(64), payer: "0x" + "2".repeat(40), network: "eip155:8453" },
  ]) {
    const { fetchImpl } = mockFetch({ settle });
    const response = await handleExchange(request(paymentPayload()), { fetch: fetchImpl, env: TEST_ENV });
    assert.notEqual(response.status, 200);
    assert.notEqual((await response.json()).exchanged, true);
  }
});

test("non-canonical authorization timestamps are refused before facilitator", async () => {
  const leadingZero = paymentPayload();
  leadingZero.payload.authorization.validAfter = "00";
  const invalidBefore = paymentPayload();
  invalidBefore.payload.authorization.validBefore = "0" + invalidBefore.payload.authorization.validBefore;
  for (const payload of [leadingZero, invalidBefore]) {
    const { fetchImpl, calls } = mockFetch();
    const response = await handleExchange(request(payload), { fetch: fetchImpl, env: TEST_ENV });
    assert.equal(response.status, 402);
    assert.equal(calls.length, 0);
  }
});

test("mainnet rail is not offered unless explicitly enabled with amount and recipient policy", async () => {
  const challenge = await handleExchange(new Request(baseUrl), { env: {} });
  const body = await challenge.json();
  assert.equal(body.accepts.length, 1);
  assert.equal(body.accepts[0].network, "eip155:84532");

  const missingPolicy = await handleExchange(new Request(baseUrl), {
    env: { X402_ENABLE_MAINNET: "true" },
  });
  assert.equal(missingPolicy.status, 500);
});
