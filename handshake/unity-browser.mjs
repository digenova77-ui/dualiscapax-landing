// Browser-only WebAuthn ceremony. This is NOT server authorization.
export const RP_ID = "dualiscapax.com";
export const DCCP_LINE = "DCCP/2|from=dualiscapax.com|rp=dualiscapax.com|verify=webauthn|jacket=/api/v2/compute|flags=0";
const challenge = () => crypto.getRandomValues(new Uint8Array(32));
function assertContext(host) {
  if (!globalThis.isSecureContext || window.top !== window.self || location.protocol !== "https:" || location.hostname !== host) {
    throw new Error("Unity requires a top-level HTTPS window on " + host);
  }
  if (!navigator.credentials?.get) throw new Error("WebAuthn unavailable");
}
export async function enterFromCom({ userId, userName, registrationOptions } = {}) {
  assertContext("dualiscapax.com");
  // Registration options must come from a trusted server challenge/registration endpoint.
  // Never generate a local challenge and mistake it for server-verifiable registration.
  if (!registrationOptions) throw new Error("Server-issued WebAuthn registration or authentication options required");
  const credential = registrationOptions.mode === "register"
    ? await navigator.credentials.create({ publicKey: registrationOptions.publicKey })
    : await navigator.credentials.get({ publicKey: registrationOptions.publicKey });
  if (!credential) throw new Error("Passkey ceremony cancelled");
  // A server must validate and persist the credential/assertion BEFORE redirect.
  if (typeof registrationOptions.verify !== "function") throw new Error("Server verification required before navigation");
  const verified = await registrationOptions.verify(credential);
  if (verified !== true) throw new Error("Server rejected WebAuthn proof");
  location.assign("https://dualiscapax.ai/");
}
export async function enterAi({ getOptions, verify, authorize } = {}) {
  assertContext("dualiscapax.ai");
  if (!getOptions?.publicKey || typeof verify !== "function" || typeof authorize !== "function") {
    throw new Error("Server-issued challenge, assertion verification and jacket authorization required");
  }
  if (getOptions.publicKey.rpId !== RP_ID || getOptions.publicKey.userVerification !== "required") {
    throw new Error("Wrong relying party or user verification policy");
  }
  const assertion = await navigator.credentials.get({ publicKey: getOptions.publicKey });
  if (!assertion || await verify(assertion) !== true) throw new Error("WebAuthn proof not verified");
  // authorize MUST bind this verified proof to the jacket request server-side.
  // The DCCP line alone is forgeable and must never grant authority.
  const result = await authorize({ payload: DCCP_LINE, flags: 0 });
  if (result?.accepted !== true) throw new Error("Trinity jacket did not accept");
  return result;
}
