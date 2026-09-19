/**
 * Canonical API v2 security primitives.
 * One path. Client data is CLAIM only. No false-green states.
 * Import from worker.js — do not duplicate this logic in aliases.
 */
export const LIMITS = {
  BODY_BYTES: 128 * 1024,
  MAX_MESSAGES: 64,
  MAX_CHARS_PER_MESSAGE: 12000,
  MAX_TOTAL_CHARS: 30000,
};

export const STATES = {
  transport: { SUCCESS: "SUCCESS", FAILED: "FAILED", NOT_EXECUTED: "NOT_EXECUTED" },
  authorization: {
    ANONYMOUS_OPEN_AUTHORIZED: "ANONYMOUS_OPEN_AUTHORIZED",
    INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
    UNKNOWN: "UNKNOWN",
    DENIED: "DENIED",
    NOT_BOUND: "NOT_BOUND",
  },
  execution: { EXECUTED: "EXECUTED", NOT_EXECUTED: "NOT_EXECUTED" },
  evidence: { CAPTURED: "CAPTURED", NOT_CAPTURED: "NOT_CAPTURED" },
  verification: { NOT_EXECUTED: "NOT_EXECUTED" },
  dclm: { NOT_EXECUTED: "NOT_EXECUTED" },
  commit: { NOT_COMMITTED: "NOT_COMMITTED" },
  receipt: { NOT_ISSUED: "NOT_ISSUED" },
  attestation: { NOT_ATTESTED: "NOT_ATTESTED", SANDBOX_SIMULATION: "SANDBOX_SIMULATION" },
};

export function classifyClientField(name) {
  const CLAIMS = [
    "fuel", "fuel.balance", "X-DC-Fuel", "body.model", "body.max_tokens",
    "session_id", "X-DC-Session", "client_pubkey", "tee_quote",
    "receipt", "convergence", "convergence_met", "dclm", "channel", "X-DC-Channel",
  ];
  return CLAIMS.includes(name) ? "CLAIM" : "UNCLASSIFIED";
}

export function canonicalize(value) {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "string") return JSON.stringify(value);
  if (t === "boolean") return value ? "true" : "false";
  if (t === "number") {
    if (!Number.isFinite(value)) {
      const err = new Error("NON_FINITE_NUMBER");
      err.code = "NON_FINITE_NUMBER";
      throw err;
    }
    return Number(value).toString();
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  if (t === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
  }
  const err = new Error("UNSUPPORTED_TYPE");
  err.code = "UNSUPPORTED_TYPE";
  throw err;
}

export async function sha256Hex(text) {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    const err = new Error("NO_SUBTLE_CRYPTO");
    err.code = "NO_SUBTLE_CRYPTO";
    throw err;
  }
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(text)));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function measureRequest(bodyText, messages) {
  const bytes = new TextEncoder().encode(bodyText || "").length;
  if (bytes > LIMITS.BODY_BYTES) return { ok: false, code: "BODY_TOO_LARGE", bytes };
  if (!Array.isArray(messages)) return { ok: false, code: "MESSAGES_REQUIRED" };
  if (messages.length > LIMITS.MAX_MESSAGES) return { ok: false, code: "TOO_MANY_MESSAGES", count: messages.length };
  let total = 0;
  for (const m of messages) {
    const c = typeof m === "string" ? m.length : String((m && m.content) || "").length;
    if (c > LIMITS.MAX_CHARS_PER_MESSAGE) return { ok: false, code: "MESSAGE_TOO_LARGE", chars: c };
    total += c;
  }
  if (total > LIMITS.MAX_TOTAL_CHARS) return { ok: false, code: "TOTAL_CHARS_TOO_LARGE", chars: total };
  return { ok: true, bytes, messages: messages.length, chars: total };
}

export function resolveFuelClaims(body, headerFuel) {
  const bodyFuel = body && body.fuel && body.fuel.balance;
  const headerPresent = headerFuel != null && headerFuel !== "";
  const bodyPresent = bodyFuel != null && bodyFuel !== "";
  function parse(v) {
    if (v == null || v === "") return { present: false, value: null };
    const n = typeof v === "number" ? v : Number(v);
    return { present: true, value: n };
  }
  const h = parse(headerFuel);
  const b = parse(bodyFuel);
  if (headerPresent && bodyPresent) {
    if (!Number.isFinite(h.value) || !Number.isFinite(b.value)) {
      return { ok: false, code: "MALFORMED_FUEL", claim: null };
    }
    if (h.value !== b.value) {
      return { ok: false, code: "HEADER_BODY_FUEL_CONFLICT", claim: { header: h.value, body: b.value } };
    }
  }
  const raw = bodyPresent ? b.value : headerPresent ? h.value : null;
  if (raw != null && !Number.isFinite(raw)) {
    return { ok: false, code: "NON_FINITE_FUEL", claim: raw };
  }
  return {
    ok: true,
    code: "CLAIM_ONLY",
    claim: raw,
    authoritative: false,
    authority_effect: "NONE",
  };
}

export function authorizeChat({ serverLedgerBalance }) {
  // A function argument named serverLedgerBalance is NOT a D1 read.
  // Until a real ledger binding exists, only anonymous OPEN is authorized.
  if (serverLedgerBalance != null) {
    return {
      authorization: STATES.authorization.UNKNOWN,
      reason: "SERVER_BALANCE_ARGUMENT_IS_NOT_LEDGER_EVIDENCE",
      tier: "OPEN",
      model: "grok-4-fast",
      max_tokens: 320,
      burn: 0,
      product_depth: false,
      authority_effect: "NONE",
    };
  }
  return {
    authorization: STATES.authorization.ANONYMOUS_OPEN_AUTHORIZED,
    reason: "NO_SERVER_LEDGER_OPEN_FLOOR_ONLY",
    tier: "OPEN",
    model: "grok-4-fast",
    max_tokens: 320,
    burn: 0,
    product_depth: false,
    authority_effect: "NONE",
  };
}

export function chooseModel({ requestedModel, authorizedModel }) {
  // Client model is a request hint. Server chooses.
  return {
    model: authorizedModel,
    requested_model_ignored: requestedModel != null && requestedModel !== authorizedModel,
    authority_effect: "NONE",
  };
}

export function corsHeaders(request, env) {
  const allow = String((env && env.CORS_ORIGIN) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = request && request.headers && request.headers.get
    ? request.headers.get("Origin")
    : null;
  const h = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-DC-Fuel, X-DC-Session, X-DC-Channel",
    Vary: "Origin",
  };
  if (allow.length === 0) {
    h["Access-Control-Allow-Origin"] = "https://dualiscapax.ai";
    h["X-DC-Cors"] = "DEFAULT_ORIGIN_NOT_WILDCARD";
    return h;
  }
  if (origin && allow.includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    return h;
  }
  h["Access-Control-Allow-Origin"] = allow[0];
  return h;
}

export function explicitChatStates({ transport, authorization }) {
  return {
    transport: transport || STATES.transport.NOT_EXECUTED,
    authorization: authorization || STATES.authorization.UNKNOWN,
    execution: STATES.execution.NOT_EXECUTED,
    evidence: STATES.evidence.NOT_CAPTURED,
    verification: STATES.verification.NOT_EXECUTED,
    dclm: STATES.dclm.NOT_EXECUTED,
    commit: STATES.commit.NOT_COMMITTED,
    receipt: STATES.receipt.NOT_ISSUED,
    authority_effect: "NONE",
  };
}

export function demoteForbiddenLabels(obj) {
  const banned = [
    "SUCCESS_VERIFIED",
    "convergence_met",
    "ATTEST_SANDBOX",
    "SANDBOX_EXECUTE_STUB",
    "SESSION_MEMORY_PURGED",
    "DCLM_L0_CONVERGED",
    "LAW_FLOOR_VERIFIED",
    "EXECUTED_CONSERVED",
  ];
  const out = Object.assign({}, obj || {});
  for (const k of Object.keys(out)) {
    if (banned.includes(String(out[k]))) {
      out[k] = "FORBIDDEN_LABEL_REMOVED";
      out[k + "_demoted"] = true;
    }
    if (k === "convergence_met") {
      delete out[k];
      out.convergence = "NOT_EXECUTED";
    }
  }
  return out;
}

export const CHAT_ROUTES = ["/v2/chat", "/api/chat", "/api/v2/chat", "/v2/dclm/inference/wrap"];
export function isChatRoute(path) {
  const p = String(path || "").replace(/\/$/, "") || "/";
  return CHAT_ROUTES.includes(p);
}
