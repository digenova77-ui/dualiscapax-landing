export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // Copy into an owned ArrayBuffer so TypeScript's SharedArrayBuffer union
  // cannot leak into the Web Crypto BufferSource type.
  const input = new Uint8Array(bytes.byteLength);
  input.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", input.buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
