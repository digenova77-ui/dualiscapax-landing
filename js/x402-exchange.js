/**
 * x402 HTTP exchange. Protocol v2, exact scheme, EIP-3009 USDC.
 * The receipt is built only after the facilitator settles.
 * Look stays free. This module does not touch the door.
 */

export const X402_VERSION = 2;
export const PAY_TO = "0x0adC5f2Dcb239DAAF3eeB3cc34b3F1BFF5AFBBc4";
export const AMOUNT = "10000";

const RAILS = [
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
  },
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
  }
];

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const SIG = /^0x[0-9a-fA-F]{130}$/;
const NONCE = /^0x[0-9a-fA-F]{64}$/;
const TX = /^0x[0-9a-fA-F]{64}$/;

function sameAddress(a, b) {
  return String(a || "").toLowerCase() === String(b || "").toLowerCase();
}

function railsFromEnv(env) {
  const payTo = (env && env.X402_PAY_TO) || PAY_TO;
  const amount = (env && env.X402_AMOUNT) || AMOUNT;
  if (!ADDRESS.test(payTo) || !/^[1-9]\d*$/.test(amount)) {
    throw new Error("x402 payTo or amount is not exact");
  }
  return RAILS.map((rail) => ({
    ...rail,
    payTo,
    amount,
    facilitator:
      (env && env["X402_FACILITATOR_" + rail.network.split(":")[1]]) || rail.facilitator,
    extra: { ...rail.extra }
  }));
}

export function requirementOf(rail) {
  return {
    scheme: rail.scheme,
    network: rail.network,
    amount: rail.amount,
    asset: rail.asset,
    payTo: rail.payTo,
    maxTimeoutSeconds: rail.maxTimeoutSeconds,
    extra: { ...rail.extra }
  };
}

export function paymentRequired(resourceUrl, rails, error) {
  return {
    x402Version: X402_VERSION,
    error: error || "PAYMENT-SIGNATURE header is required",
    resource: {
      url: resourceUrl,
      description: "One exact USDC exchange. The receipt comes back only after settlement.",
      mimeType: "application/json",
      serviceName: "DualisCapax"
    },
    accepts: rails.map(requirementOf)
  };
}

export function encodeHeader(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decodeHeader(value) {
  const binary = atob(String(value || "").trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function typedData(requirement, authorization) {
  const chainId = Number(String(requirement.network).split(":")[1]);
  return {
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" }
      ]
    },
    primaryType: "TransferWithAuthorization",
    domain: {
      name: requirement.extra.name,
      version: requirement.extra.version,
      chainId,
      verifyingContract: requirement.asset
    },
    message: {
      from: authorization.from,
      to: authorization.to,
      value: authorization.value,
      validAfter: authorization.validAfter,
      validBefore: authorization.validBefore,
      nonce: authorization.nonce
    }
  };
}

export function freshAuthorization(requirement, from, nowSec) {
  const nonceBytes = new Uint8Array(32);
  crypto.getRandomValues(nonceBytes);
  let nonce = "0x";
  for (let i = 0; i < nonceBytes.length; i++) nonce += nonceBytes[i].toString(16).padStart(2, "0");
  const window = Math.min(120, requirement.maxTimeoutSeconds);
  return {
    from,
    to: requirement.payTo,
    value: requirement.amount,
    validAfter: "0",
    validBefore: String(nowSec + window),
    nonce
  };
}

function matchesOffer(accepted, offer) {
  if (!accepted || !offer) return false;
  if (accepted.scheme !== offer.scheme || accepted.network !== offer.network) return false;
  if (accepted.amount !== offer.amount) return false;
  if (!sameAddress(accepted.asset, offer.asset) || !sameAddress(accepted.payTo, offer.payTo)) return false;
  const extra = accepted.extra || {};
  if (extra.name !== offer.extra.name || extra.version !== offer.extra.version) return false;
  if (extra.assetTransferMethod && extra.assetTransferMethod !== "eip3009") return false;
  if (extra.paymentFlow && extra.paymentFlow !== "authorization") return false;
  return true;
}

function checkPayload(payload, offer) {
  if (!payload || payload.x402Version !== X402_VERSION) return "invalid_x402_version";
  if (!matchesOffer(payload.accepted, offer)) return "invalid_payment_requirements";
  const body = payload.payload;
  const auth = body && body.authorization;
  if (!body || !auth) return "invalid_payload";
  if (payload.accepted.scheme !== "exact") return "invalid_scheme";
  if (!SIG.test(body.signature)) return "invalid_exact_evm_payload_signature";
  if (!ADDRESS.test(auth.from) || !ADDRESS.test(auth.to)) return "invalid_payload";
  if (!NONCE.test(auth.nonce)) return "invalid_payload";
  if (auth.value !== offer.amount) return "invalid_exact_evm_payload_authorization_value_mismatch";
  if (!sameAddress(auth.to, offer.payTo)) return "invalid_exact_evm_payload_recipient_mismatch";
  return "";
}

function jsonResponse(status, body, headers) {
  const responseHeaders = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-expose-headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE"
  };
  Object.assign(responseHeaders, headers || {});
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function requiredResponse(resourceUrl, rails, error, settlement) {
  const required = paymentRequired(resourceUrl, rails, error);
  const headers = { "PAYMENT-REQUIRED": encodeHeader(required) };
  if (settlement) headers["PAYMENT-RESPONSE"] = encodeHeader(settlement);
  return jsonResponse(402, required, headers);
}

async function postJson(fetchImpl, url, body) {
  const signal = typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
    signal
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    parsed = null;
  }
  return { ok: response.ok, status: response.status, json: parsed };
}

export async function handleExchange(request, options) {
  const opts = options || {};
  const fetchImpl = opts.fetch || fetch;
  let rails;
  try {
    rails = railsFromEnv(opts.env || {});
  } catch (err) {
    return jsonResponse(500, { error: "x402 is not configured" });
  }
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "PAYMENT-SIGNATURE, Content-Type",
        "access-control-expose-headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE",
        "access-control-max-age": "86400"
      }
    });
  }
  if (request.method !== "GET" && request.method !== "POST") {
    return jsonResponse(405, { error: "GET or POST" });
  }

  const url = new URL(request.url);
  const resourceUrl = url.origin + url.pathname;
  const encoded = request.headers.get("payment-signature");
  if (!encoded) return requiredResponse(resourceUrl, rails, "PAYMENT-SIGNATURE header is required");

  let payload;
  try {
    payload = decodeHeader(encoded);
  } catch (err) {
    return jsonResponse(400, { error: "invalid_payload" });
  }

  const acceptedNetwork = payload && payload.accepted && payload.accepted.network;
  const rail = rails.find((item) => item.network === acceptedNetwork) || null;
  const offer = rail ? requirementOf(rail) : null;
  const reason = checkPayload(payload, offer);
  if (reason) return requiredResponse(resourceUrl, rails, reason);

  const facilitatorBody = {
    x402Version: X402_VERSION,
    paymentPayload: payload,
    paymentRequirements: offer
  };
  const base = String(rail.facilitator).replace(/\/$/, "");

  let verified;
  try {
    verified = await postJson(fetchImpl, base + "/verify", facilitatorBody);
  } catch (err) {
    return jsonResponse(500, { error: "facilitator did not verify" });
  }
  if (!verified.ok || !verified.json || verified.json.isValid !== true) {
    const why = (verified.json && verified.json.invalidReason) || "invalid_payload";
    return requiredResponse(resourceUrl, rails, why, {
      success: false,
      errorReason: why,
      payer: (verified.json && verified.json.payer) || payload.payload.authorization.from,
      transaction: "",
      network: offer.network
    });
  }

  let settled;
  try {
    settled = await postJson(fetchImpl, base + "/settle", facilitatorBody);
  } catch (err) {
    return jsonResponse(500, { error: "facilitator did not settle" });
  }
  const settlement = settled.json || {};
  const transaction = String(settlement.transaction || "");
  if (!settled.ok || settlement.success !== true || !TX.test(transaction)) {
    return requiredResponse(resourceUrl, rails, settlement.errorReason || "unexpected_settle_error", {
      success: false,
      errorReason: settlement.errorReason || "unexpected_settle_error",
      payer: settlement.payer || verified.json.payer || payload.payload.authorization.from,
      transaction: TX.test(transaction) ? transaction : "",
      network: settlement.network || offer.network
    });
  }

  const receipt = {
    exchanged: true,
    scheme: "exact",
    amount: offer.amount,
    asset: offer.asset,
    payTo: offer.payTo,
    payer: settlement.payer || verified.json.payer,
    network: settlement.network || offer.network,
    transaction,
    explorer: rail.explorer + transaction
  };
  return jsonResponse(200, receipt, {
    "PAYMENT-RESPONSE": encodeHeader({
      success: true,
      transaction,
      network: receipt.network,
      payer: receipt.payer,
      amount: offer.amount
    })
  });
}
