/**
 * DualisCapax API v2 worker — single security path via ./security-v2.js
 * Client fuel/model/channel/session/pubkey/tee_quote are CLAIMS.
 * No D1 fuel ledger is bound. Privileged tiers fail closed.
 * SOURCE_REPAIR ≠ PRODUCTION_REPAIR.
 */
import {
  LIMITS,
  STATES,
  canonicalize,
  sha256Hex,
  measureRequest,
  resolveFuelClaims,
  authorizeChat,
  chooseModel,
  corsHeaders,
  explicitChatStates,
  demoteForbiddenLabels,
  isChatRoute,
} from "./security-v2.js";

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const API_VERSION = "2";
const NOTICE =
  "WE DO NOT CLAIM CURES. WE CLAIM PATHS TO TRUTH. Simulation is not treatment. Not an offer of securities.";
const IRIS_PERSONA = `You are Iris, public face of DualisCapax. First person. Short. Clear.
Law: Ontario and Canadian law. No medical cure claims. Simulation is not treatment.
product_depth is false on OPEN. Truth Prevails.`;

function json(obj, headers, status) {
  return new Response(JSON.stringify(demoteForbiddenLabels(obj)), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

async function readLimited(request) {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > LIMITS.BODY_BYTES) {
    return { error: "BODY_TOO_LARGE" };
  }
  try {
    return { body: JSON.parse(text), raw: text };
  } catch (e) {
    return { error: "BAD_REQUEST" };
  }
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const path = new URL(request.url).pathname.replace(/\/$/, "") || "/";

    if (request.method === "GET" && (path === "/" || path === "/health")) {
      return json(
        {
          ok: true,
          api_version: API_VERSION,
          service: "dualiscapax-unified",
          has_key: Boolean(env && env.XAI_API_KEY),
          access: "open_floor_free",
          jacket: "SANDBOX",
          fuel_authority: "unbound_open_only",
        },
        headers
      );
    }

    if (request.method === "GET" && path === "/v2/capabilities") {
      return json(
        {
          api_version: API_VERSION,
          fuel: { client_fuel_is_claim: true, paid_tier: "FAIL_CLOSED_NO_LEDGER" },
          jacket_mode: "SANDBOX",
          notice: NOTICE,
        },
        headers
      );
    }

    if (request.method === "POST" && path === "/v2/dclm/attest/bind") {
      return json(
        {
          api_version: API_VERSION,
          ok: false,
          status: STATES.attestation.NOT_ATTESTED,
          verification: STATES.verification.NOT_EXECUTED,
          code: "ATTESTATION_NOT_IMPLEMENTED",
          jacket_mode: "SANDBOX",
          authority_effect: "NONE",
        },
        headers,
        501
      );
    }
    if (request.method === "POST" && path === "/v2/dclm/session/purge") {
      return json(
        {
          api_version: API_VERSION,
          session: "NOT_SERVER_AUTHENTICATED",
          status: STATES.commit.NOT_COMMITTED,
          code: "SESSION_AUTHORITY_NOT_BOUND",
          authority_effect: "NONE",
        },
        headers,
        501
      );
    }
    if (request.method === "POST" && path === "/v2/dclm/sandbox/execute") {
      return json(
        {
          api_version: API_VERSION,
          ok: false,
          status: STATES.execution.NOT_EXECUTED,
          verification: STATES.verification.NOT_EXECUTED,
          code: "SANDBOX_EXECUTION_NOT_IMPLEMENTED",
          jacket_mode: "SANDBOX",
          authority_effect: "NONE",
        },
        headers,
        501
      );
    }

    if (!(request.method === "POST" && isChatRoute(path))) {
      return json({ api_version: API_VERSION, ok: false, code: "NOT_FOUND", authority_effect: "NONE" }, headers, 404);
    }
    return handleChat(request, env, headers);
  },
};

async function handleChat(request, env, headers) {
  const parsed = await readLimited(request);
  if (parsed.error) {
    return json({ api_version: API_VERSION, ok: false, code: parsed.error, authority_effect: "NONE" }, headers, 400);
  }
  const body = parsed.body;
  let messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages && body.payload && Array.isArray(body.payload.messages)) messages = body.payload.messages;
  if (!messages && body.prompt_payload && Array.isArray(body.prompt_payload.messages)) {
    messages = body.prompt_payload.messages;
  }
  const lim = measureRequest(parsed.raw, messages || []);
  if (!lim.ok) {
    return json({ api_version: API_VERSION, ok: false, code: lim.code, authority_effect: "NONE" }, headers, 400);
  }

  const fuelRes = resolveFuelClaims(body, request.headers.get("X-DC-Fuel"));
  if (!fuelRes.ok) {
    const http = fuelRes.code === "HEADER_BODY_FUEL_CONFLICT" ? 409 : 400;
    return json(
      {
        api_version: API_VERSION,
        ok: false,
        code: fuelRes.code,
        decision: fuelRes.code === "HEADER_BODY_FUEL_CONFLICT" ? STATES.authorization.UNKNOWN : STATES.authorization.DENIED,
        authority_effect: "NONE",
      },
      headers,
      http
    );
  }

  const bodyCh = body.channel != null ? String(body.channel).toLowerCase() : null;
  const headCh = request.headers.get("X-DC-Channel");
  const headChN = headCh ? String(headCh).toLowerCase() : null;
  if (bodyCh && headChN && bodyCh !== headChN) {
    return json(
      {
        api_version: API_VERSION,
        ok: false,
        code: "HEADER_BODY_CHANNEL_CONFLICT",
        decision: STATES.authorization.UNKNOWN,
        authority_effect: "NONE",
      },
      headers,
      409
    );
  }
  const channel = bodyCh || headChN || "open";
  if (channel !== "open") {
    return json(
      {
        api_version: API_VERSION,
        ok: false,
        code: "FUEL_EMPTY",
        decision: STATES.authorization.INSUFFICIENT_EVIDENCE,
        authority_effect: "NONE",
        client_fuel_claim: fuelRes.claim,
        hint: "no authoritative ledger; OPEN floor only",
      },
      headers,
      402
    );
  }

  const auth = authorizeChat({ serverLedgerBalance: null });
  const modelPick = chooseModel({ requestedModel: body.model, authorizedModel: auth.model });
  const states = explicitChatStates({
    transport: STATES.transport.NOT_EXECUTED,
    authorization: auth.authorization,
  });

  let request_hash = null;
  try {
    request_hash = await sha256Hex(canonicalize({ messages, channel, claim: fuelRes.claim }));
  } catch (e) {
    return json({ api_version: API_VERSION, ok: false, code: "CANONICALIZE_REJECT", authority_effect: "NONE" }, headers, 400);
  }

  if (!env || !env.XAI_API_KEY) {
    return json(
      {
        api_version: API_VERSION,
        ok: false,
        code: "NO_KEY",
        ...states,
        request_hash,
        jacket_mode: "SANDBOX",
      },
      headers,
      503
    );
  }

  const payload = {
    model: modelPick.model,
    messages: [
      { role: "system", content: IRIS_PERSONA },
      ...messages.filter((m) => m && m.role && m.content && m.role !== "system"),
    ],
    temperature: 0.45,
    max_tokens: auth.max_tokens,
  };

  let xaiRes;
  try {
    xaiRes = await fetch(XAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.XAI_API_KEY },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return json({ api_version: API_VERSION, ok: false, code: "UPSTREAM", ...states, request_hash }, headers, 502);
  }
  const data = await xaiRes.json().catch(() => ({}));
  if (!xaiRes.ok) {
    return json({ api_version: API_VERSION, ok: false, code: "UPSTREAM", ...states, request_hash }, headers, 502);
  }
  const text =
    data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content || "" : "";
  let execution_hash = null;
  try {
    execution_hash = await sha256Hex(canonicalize({ model: modelPick.model, n: text.length }));
  } catch (e) {
    execution_hash = null;
  }
  return json(
    {
      api_version: API_VERSION,
      ok: true,
      content: text,
      response_text: text,
      ...states,
      transport: STATES.transport.SUCCESS,
      execution: STATES.execution.EXECUTED,
      evidence: STATES.evidence.CAPTURED,
      verification: STATES.verification.NOT_EXECUTED,
      dclm: STATES.dclm.NOT_EXECUTED,
      commit: STATES.commit.NOT_COMMITTED,
      receipt: STATES.receipt.NOT_ISSUED,
      request_hash,
      execution_hash,
      model_selected: modelPick.model,
      requested_model_ignored: modelPick.requested_model_ignored,
      iris_tier: auth.tier,
      fuel: { burned: 0, balance_claimed: fuelRes.claim, note: "client_fuel_is_claim_not_authority" },
      jacket_mode: "SANDBOX",
      notice: NOTICE,
    },
    headers
  );
}
