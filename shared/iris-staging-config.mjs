export const IRIS_RUNTIME_CONFIG = Symbol.for("dualis.iris.runtime-config");

export const PRODUCTION_IRIS_CONFIG = Object.freeze({
  mode: "production",
  frontendOrigin: "https://dualiscapax.com",
  identityIssuerOrigin: "https://dualiscapax.com",
  receiverOrigin: "https://dualiscapax.ai",
  webauthnRpId: "dualiscapax.com",
  receiverHost: "dualiscapax.ai",
});

export const IRIS_STAGING_ENV_NAMES = Object.freeze({
  mode: "IRIS_RUNTIME_MODE",
  frontendOrigin: "IRIS_STAGING_FRONTEND_ORIGIN",
  identityIssuerOrigin: "IRIS_STAGING_IDENTITY_ISSUER_ORIGIN",
  receiverOrigin: "IRIS_STAGING_RECEIVER_ORIGIN",
  webauthnRpId: "IRIS_STAGING_WEBAUTHN_RP_ID",
  identityDatabase: "IRIS_STAGING_IDENTITY_DB",
  handoffSecret: "IRIS_STAGING_HANDOFF_SECRET",
  identityApi: "IRIS_STAGING_IDENTITY_API",
  trinityLawEngine: "IRIS_STAGING_TRINITY_LAW_ENGINE",
  auditDatabase: "IRIS_STAGING_AUDIT_DB",
  trinityLatch: "IRIS_STAGING_ALLOW_HOUSE_KEY",
});

const PRODUCTION_HOSTS = Object.freeze([
  "dualiscapax.com",
  "dualiscapax.ai",
  "dualiscapax-landing.pages.dev",
  "dualiscapax.replit.app",
]);

const KNOWN_MULTI_LABEL_PUBLIC_SUFFIXES = new Set([
  "ac.uk", "co.uk", "gov.uk", "ltd.uk", "me.uk", "net.uk", "org.uk", "plc.uk", "sch.uk",
  "asn.au", "com.au", "edu.au", "gov.au", "id.au", "net.au", "org.au",
  "ac.jp", "co.jp", "ed.jp", "go.jp", "ne.jp", "or.jp",
  "ac.nz", "co.nz", "govt.nz", "net.nz", "org.nz", "school.nz",
  "com.br", "net.br", "org.br",
  "com.cn", "edu.cn", "gov.cn", "net.cn", "org.cn",
  "com.hk", "edu.hk", "gov.hk", "net.hk", "org.hk",
  "com.sg", "edu.sg", "gov.sg", "net.sg", "org.sg",
  "co.in", "firm.in", "gen.in", "ind.in", "net.in", "org.in",
  "co.za", "net.za", "org.za", "web.za",
  "appspot.com", "azurewebsites.net", "cloudfront.net", "github.io",
  "herokuapp.com", "netlify.app", "pages.dev", "replit.app", "workers.dev",
]);

const COMMON_SINGLE_LABEL_TLDS = new Set([
  "ai", "app", "biz", "cloud", "com", "dev", "edu", "gov", "info", "io",
  "me", "mil", "net", "org", "test", "uk", "us", "xyz",
]);

function failure(code) {
  return Object.freeze({ ok: false, code });
}

function validDnsHost(host) {
  if (typeof host !== "string" || host !== host.toLowerCase() || host.endsWith(".")) return false;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
      host.endsWith(".internal") || /^\d+(?:\.\d+){3}$/.test(host) || host.includes(":")) return false;
  const labels = host.split(".");
  return labels.length >= 2 && labels.every((label) =>
    label.length >= 1 &&
    label.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
  );
}

function parseExactHttpsOrigin(value) {
  if (typeof value !== "string" || value.includes("*")) return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.origin !== value ||
    !validDnsHost(url.hostname)
  ) return null;
  const host = url.hostname.toLowerCase();
  if (PRODUCTION_HOSTS.some((productionHost) =>
    host === productionHost || host.endsWith(`.${productionHost}`),
  )) return null;
  return Object.freeze({ origin: url.origin, host });
}

export function isProductionIrisOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  return PRODUCTION_HOSTS.some((productionHost) =>
    host === productionHost || host.endsWith(`.${productionHost}`),
  );
}

function isPublicSuffix(host) {
  const labels = host.split(".");
  return labels.length < 2 || KNOWN_MULTI_LABEL_PUBLIC_SUFFIXES.has(host);
}

export function isValidWebAuthnRpId(origin, rpId) {
  const parsedOrigin = parseExactHttpsOrigin(origin);
  if (!parsedOrigin || typeof rpId !== "string" || rpId !== rpId.toLowerCase() ||
      rpId.includes("*") || !validDnsHost(rpId) || isPublicSuffix(rpId)) return false;
  if (rpId === parsedOrigin.host) return true;
  if (!parsedOrigin.host.endsWith(`.${rpId}`)) return false;

  const hostLabels = parsedOrigin.host.split(".");
  const publicSuffix = hostLabels.slice(-2).join(".");
  if (KNOWN_MULTI_LABEL_PUBLIC_SUFFIXES.has(publicSuffix)) {
    return rpId.split(".").length > 2;
  }
  const tld = hostLabels.at(-1);
  return COMMON_SINGLE_LABEL_TLDS.has(tld) && rpId.split(".").length >= 2;
}

function isServiceBinding(binding) {
  return Boolean(binding && typeof binding.fetch === "function");
}

function isD1Binding(binding) {
  return Boolean(binding && typeof binding.prepare === "function");
}

function createRuntimeEnv(env, config, bindings = {}) {
  const runtimeEnv = Object.create(env || null);
  Object.defineProperty(runtimeEnv, IRIS_RUNTIME_CONFIG, {
    value: config,
    enumerable: false,
  });
  for (const [name, value] of Object.entries(bindings)) {
    Object.defineProperty(runtimeEnv, name, { value, enumerable: true });
  }
  return runtimeEnv;
}

export function resolveIrisRuntime(env, role = "identity") {
  if (!env || typeof env !== "object") return failure("IRIS_RUNTIME_ENV_UNAVAILABLE");
  const mode = env.IRIS_RUNTIME_MODE ?? "production";
  if (mode === "production") {
    return Object.freeze({
      ok: true,
      mode,
      config: PRODUCTION_IRIS_CONFIG,
      env,
    });
  }
  if (mode !== "staging") return failure("IRIS_RUNTIME_MODE_UNSUPPORTED");

  const frontend = parseExactHttpsOrigin(env.IRIS_STAGING_FRONTEND_ORIGIN);
  const issuer = parseExactHttpsOrigin(env.IRIS_STAGING_IDENTITY_ISSUER_ORIGIN);
  const receiver = parseExactHttpsOrigin(env.IRIS_STAGING_RECEIVER_ORIGIN);
  if (!frontend || !issuer || !receiver) return failure("IRIS_STAGING_ORIGIN_INVALID");
  if (
    frontend.origin !== issuer.origin ||
    receiver.origin === issuer.origin
  ) return failure("IRIS_STAGING_ORIGIN_MISMATCH");
  if (!isValidWebAuthnRpId(issuer.origin, env.IRIS_STAGING_WEBAUTHN_RP_ID)) {
    return failure("IRIS_STAGING_RP_ID_INVALID");
  }

  const identityDatabase = env.IRIS_STAGING_IDENTITY_DB;
  const handoffSecret = env.IRIS_STAGING_HANDOFF_SECRET;
  if (
    !isD1Binding(identityDatabase) ||
    typeof handoffSecret !== "string" ||
    new TextEncoder().encode(handoffSecret).length < 32
  ) return failure("IRIS_STAGING_IDENTITY_BINDING_UNAVAILABLE");

  const latch = env.IRIS_STAGING_ALLOW_HOUSE_KEY ?? "0";
  if (latch !== "0" && latch !== "1") return failure("IRIS_STAGING_LATCH_INVALID");

  const roleBindings = {
    identity: [],
    origin: ["identityApi"],
    depth: ["trinityLawEngine"],
    trinity: ["auditDatabase"],
    all: ["identityApi", "trinityLawEngine", "auditDatabase"],
  };
  const required = roleBindings[role];
  if (!required) return failure("IRIS_RUNTIME_ROLE_UNSUPPORTED");
  const namedBindings = {
    identityApi: env.IRIS_STAGING_IDENTITY_API,
    trinityLawEngine: env.IRIS_STAGING_TRINITY_LAW_ENGINE,
    auditDatabase: env.IRIS_STAGING_AUDIT_DB,
  };
  if (required.some((name) =>
    name === "auditDatabase" ? !isD1Binding(namedBindings[name]) : !isServiceBinding(namedBindings[name]),
  )) return failure("IRIS_STAGING_WORKER_BINDING_UNAVAILABLE");

  const config = Object.freeze({
    mode: "staging",
    frontendOrigin: frontend.origin,
    identityIssuerOrigin: issuer.origin,
    receiverOrigin: receiver.origin,
    webauthnRpId: env.IRIS_STAGING_WEBAUTHN_RP_ID,
    receiverHost: receiver.host,
  });
  const bindings = {
    IDENTITY_DB: identityDatabase,
    IDENTITY_HANDOFF_SECRET: handoffSecret,
    IRIS_ALLOW_HOUSE_KEY: latch,
    CORS_ORIGIN: config.frontendOrigin,
  };
  if (namedBindings.identityApi) bindings.IDENTITY_API = namedBindings.identityApi;
  if (namedBindings.trinityLawEngine) bindings.TRINITY_LAW_ENGINE = namedBindings.trinityLawEngine;
  if (namedBindings.auditDatabase) bindings.AUDIT_DB = namedBindings.auditDatabase;

  return Object.freeze({
    ok: true,
    mode: "staging",
    config,
    env: createRuntimeEnv(env, config, bindings),
  });
}

export function getIrisRuntimeConfig(env) {
  return env?.[IRIS_RUNTIME_CONFIG] || PRODUCTION_IRIS_CONFIG;
}
