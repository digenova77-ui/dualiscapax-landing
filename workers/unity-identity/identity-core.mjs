export const MAX_BODY_BYTES = 16_384;
export const SESSION_TTL_SECONDS = 604_800;
export const CHALLENGE_TTL_SECONDS = 300;

export function normalizeHandle(value) {
  if (typeof value !== "string") return null;
  const handle = value.trim().toLowerCase();
  return handle.length >= 3 && handle.length <= 64 && /^[a-z0-9][a-z0-9._-]*$/.test(handle) ? handle : null;
}
export function safeJsonBody(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  try { return new TextEncoder().encode(JSON.stringify(value)).byteLength <= MAX_BODY_BYTES; } catch { return false; }
}
export function cookieValue(header) {
  if (typeof header !== "string") return null;
  for (const part of header.split(";")) {
    const item = part.trim(), i = item.indexOf("=");
    if (i >= 0 && item.slice(0, i) === "__Host-unity_session") {
      const value = item.slice(i + 1);
      return /^[A-Za-z0-9_-]{40,100}$/.test(value) ? value : null;
    }
  }
  return null;
}
export function sessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{40,100}$/.test(token)) throw new TypeError("invalid-session-token");
  return `__Host-unity_session=${token}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Strict`;
}
export function originAllowed(request, expected) { return request.headers.get("origin") === expected; }
