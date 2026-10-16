import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { OPEN_DECISION } from "../js/merit-align.js";
import {
  AMOUNT,
  PAY_TO,
  decodeHeader,
  encodeHeader,
  freshAuthorization,
  handleExchange,
  paymentRequired,
  typedData
} from "../js/x402-exchange.js";

const EXCHANGE_URL = "https://dualiscapax.com/api/x402/exchange";

function request(headers) {
  return new Request(EXCHANGE_URL, { method: "GET", headers: headers || {} });
}

function offerPayload(network) {
  const required = paymentRequired(EXCHANGE_URL, [
    {
      scheme: "exact",
      network: "eip155:84532",
      amount: AMOUNT,
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      payTo: PAY_TO,
      maxTimeoutSeconds: 300,
      extra: { name: "USDC", version: "2", assetTransferMethod: "eip3009" },
      facilitator: "https://x402.org/facilitator",
      explorer: "https://sepolia.basescan.org/tx/"
    },
    {
      scheme: "exact",
      network: "eip155:8453",
      amount: AMOUNT,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      payTo: PAY_TO,
      maxTimeoutSeconds: 300,
      extra: { name: "USD Coin", version: "2", assetTransferMethod: "eip3009" },
      facilitator: "https://facilitator.xpay.sh",
      explorer: "https://basescan.org/tx/"
    }
  ].filter((rail) => !network || rail.network === network));
  const accepted = required.accepts[0];
  const from = "0x857b06519E91e3A54538791bDbb0E22373e36b66";
  return {
    x402Version: 2,
    resource: required.resource,
    accepted,
    payload: {
      signature: "0x" + "ab".repeat(65),
      authorization: freshAuthorization(accepted, from, 1_700_000_000)
    }
  };
}

function openOpts(extra) {
  return Object.assign({ decision: OPEN_DECISION }, extra || {});
}

test("the published joule shuts the price before any payment is asked", async () => {
  let called = 0;
  const response = await handleExchange(request({ "payment-signature": "abc" }), {
    fetch: () => { called += 1; throw new Error("no facilitator"); }
  });
  assert.equal(response.status, 403);
  assert.equal(called, 0);
  assert.equal(response.headers.get("PAYMENT-REQUIRED"), null);
  const body = await response.json();
  assert.equal(body.priced, false);
  assert.equal(body.open, false);
  assert.equal(body.joule, null);
  assert.equal(body.exchanged, false);
});

test("a null joule shuts an otherwise aligned decision", async () => {
  const response = await handleExchange(request(), {
    decision: { unity: 1, meritPrice: 1, efuse: 1, joule: null },
    fetch: () => { throw new Error("no facilitator"); }
  });
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.reason, "joule-null");
  assert.equal(body.priced, false);
});

test("a request with no signature is 402 and does not exchange", async () => {
  const response = await handleExchange(request(), openOpts({ fetch: () => { throw new Error("no facilitator"); } }));
  assert.equal(response.status, 402);
  const body = await response.json();
  assert.equal(body.x402Version, 2);
  assert.equal(body.exchanged, undefined);
  assert.equal(body.accepts.length, 2);
  assert.equal(body.accepts[0].amount, AMOUNT);
  assert.equal(body.accepts[0].payTo, PAY_TO);
  assert.equal(body.accepts[0].scheme, "exact");
  const header = decodeHeader(response.headers.get("PAYMENT-REQUIRED"));
  assert.deepEqual(header.accepts, body.accepts);
  assert.equal(response.headers.get("PAYMENT-RESPONSE"), null);
});

test("the typed data is the exact USDC authorization", () => {
  const payload = offerPayload("eip155:8453");
  const data = typedData(payload.accepted, payload.payload.authorization);
  assert.equal(data.domain.name, "USD Coin");
  assert.equal(data.domain.version, "2");
  assert.equal(data.domain.chainId, 8453);
  assert.equal(data.domain.verifyingContract, payload.accepted.asset);
  assert.equal(data.message.value, AMOUNT);
  assert.equal(data.message.to, PAY_TO);
  assert.equal(data.primaryType, "TransferWithAuthorization");
});

test("a mismatched amount never reaches the facilitator", async () => {
  let called = 0;
  const payload = offerPayload("eip155:84532");
  payload.payload.authorization.value = "1";
  const response = await handleExchange(request({ "payment-signature": encodeHeader(payload) }), openOpts({
    fetch: () => { called += 1; throw new Error("should not settle"); }
  }));
  assert.equal(response.status, 402);
  assert.equal(called, 0);
  const body = await response.json();
  assert.equal(body.exchanged, undefined);
  assert.match(body.error, /value_mismatch/);
});

test("the receipt is withheld unless settle returns a transaction", async () => {
  const payload = offerPayload("eip155:84532");
  const calls = [];
  const response = await handleExchange(request({ "payment-signature": encodeHeader(payload) }), openOpts({
    fetch: async (url) => {
      calls.push(url);
      if (String(url).endsWith("/verify")) {
        return new Response(JSON.stringify({ isValid: true, payer: payload.payload.authorization.from }), { status: 200 });
      }
      return new Response(JSON.stringify({
        success: false,
        errorReason: "insufficient_funds",
        payer: payload.payload.authorization.from,
        transaction: "",
        network: "eip155:84532"
      }), { status: 200 });
    }
  }));
  assert.deepEqual(calls, [
    "https://x402.org/facilitator/verify",
    "https://x402.org/facilitator/settle"
  ]);
  assert.equal(response.status, 402);
  const body = await response.json();
  assert.equal(body.exchanged, undefined);
  const settlement = decodeHeader(response.headers.get("PAYMENT-RESPONSE"));
  assert.equal(settlement.success, false);
  assert.equal(settlement.errorReason, "insufficient_funds");
});

test("a settled payment is the only 200", async () => {
  const payload = offerPayload("eip155:8453");
  const tx = "0x" + "cd".repeat(32);
  const response = await handleExchange(request({ "payment-signature": encodeHeader(payload) }), openOpts({
    fetch: async (url) => {
      if (String(url).endsWith("/verify")) {
        return new Response(JSON.stringify({ isValid: true, payer: payload.payload.authorization.from }), { status: 200 });
      }
      return new Response(JSON.stringify({
        success: true,
        payer: payload.payload.authorization.from,
        transaction: tx,
        network: "eip155:8453"
      }), { status: 200 });
    }
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.exchanged, true);
  assert.equal(body.transaction, tx);
  assert.equal(body.payTo, PAY_TO);
  assert.equal(body.amount, AMOUNT);
  const settlement = decodeHeader(response.headers.get("PAYMENT-RESPONSE"));
  assert.equal(settlement.success, true);
  assert.equal(settlement.transaction, tx);
});

test("a pending settlement is not an exchange", async () => {
  const payload = offerPayload("eip155:84532");
  const response = await handleExchange(request({ "payment-signature": encodeHeader(payload) }), openOpts({
    fetch: async (url) => {
      if (String(url).endsWith("/verify")) {
        return new Response(JSON.stringify({ isValid: true, payer: payload.payload.authorization.from }), { status: 200 });
      }
      return new Response(JSON.stringify({
        success: false,
        errorReason: "settlement_pending",
        transaction: "0x" + "11".repeat(32),
        network: "eip155:84532",
        payer: payload.payload.authorization.from
      }), { status: 200 });
    }
  }));
  assert.equal(response.status, 402);
  const body = await response.json();
  assert.equal(body.exchanged, undefined);
});

test("the pay-to address is the published research address", () => {
  const config = readFileSync(new URL("../js/payments-config.js", import.meta.url), "utf8");
  assert.match(config, new RegExp(PAY_TO));
});

test("the live testnet facilitator refuses an unpaid signature and nothing is exchanged", async () => {
  const payload = offerPayload("eip155:84532");
  const response = await handleExchange(request({ "payment-signature": encodeHeader(payload) }), openOpts({}));
  assert.equal(response.status, 402);
  const body = await response.json();
  assert.equal(body.exchanged, undefined);
  assert.equal(body.x402Version, 2);
  const settlement = decodeHeader(response.headers.get("PAYMENT-RESPONSE"));
  assert.equal(settlement.success, false);
  assert.ok(settlement.errorReason);
});
