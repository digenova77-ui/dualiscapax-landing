const API = "/api/unity";

export function decodeBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
export function encodeBase64Url(value) {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
export function creationOptions(options) {
  return {
    ...options,
    challenge: decodeBase64Url(options.challenge),
    user: { ...options.user, id: decodeBase64Url(options.user.id) },
    excludeCredentials: (options.excludeCredentials || []).map((item) => ({ ...item, id: decodeBase64Url(item.id) })),
  };
}
export function requestOptions(options) {
  return {
    ...options,
    challenge: decodeBase64Url(options.challenge),
    allowCredentials: (options.allowCredentials || []).map((item) => ({ ...item, id: decodeBase64Url(item.id) })),
  };
}
export function registrationJSON(credential) {
  return {
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: encodeBase64Url(credential.response.clientDataJSON),
      attestationObject: encodeBase64Url(credential.response.attestationObject),
      transports: typeof credential.response.getTransports === "function" ? credential.response.getTransports() : [],
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}
export function authenticationJSON(credential) {
  return {
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: encodeBase64Url(credential.response.clientDataJSON),
      authenticatorData: encodeBase64Url(credential.response.authenticatorData),
      signature: encodeBase64Url(credential.response.signature),
      userHandle: credential.response.userHandle ? encodeBase64Url(credential.response.userHandle) : null,
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}
async function post(path, body = {}) {
  const response = await fetch(API + path, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.reason || "unity-identity-request-failed");
  return data;
}

export async function registerPasskey(handle) {
  if (!window.isSecureContext || !navigator.credentials || !window.PublicKeyCredential) throw new Error("passkeys-require-secure-context");
  const { options } = await post("/register/options", { handle });
  const credential = await navigator.credentials.create({ publicKey: creationOptions(options) });
  if (!credential) throw new Error("registration-cancelled");
  return post("/register/verify", { challenge: options.challenge, credential: registrationJSON(credential) });
}

export async function authenticatePasskey() {
  if (!window.isSecureContext || !navigator.credentials || !window.PublicKeyCredential) throw new Error("passkeys-require-secure-context");
  const { options } = await post("/authenticate/options");
  const credential = await navigator.credentials.get({ publicKey: requestOptions(options) });
  if (!credential) throw new Error("authentication-cancelled");
  return post("/authenticate/verify", { challenge: options.challenge, credential: authenticationJSON(credential) });
}

export async function getUnitySession() {
  return post("/check");
}

export async function logoutUnitySession() {
  return post("/logout");
}
