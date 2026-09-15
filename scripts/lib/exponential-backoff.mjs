/** Dualis exponential backoff for outbound HTTP.
 *  Retry 429 / 408 / 5xx and network throws.
 *  Honor Retry-After (seconds or HTTP date).
 *  Do NOT retry Cloudflare API 10000 / 401 / 403 — those are scope, not load.
 */

export const RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseRetryAfter(header, now = Date.now()) {
  if (!header) return null;
  const trimmed = String(header).trim();
  const sec = Number(trimmed);
  if (Number.isFinite(sec) && sec >= 0) return Math.min(sec * 1000, 120000);
  const when = Date.parse(trimmed);
  if (Number.isFinite(when)) return Math.min(Math.max(0, when - now), 120000);
  return null;
}

export function backoffMs(attempt, { baseMs = 400, factor = 2, maxMs = 20000, jitter = true } = {}) {
  const raw = Math.min(maxMs, baseMs * Math.pow(factor, attempt));
  if (!jitter) return Math.floor(raw);
  return Math.floor(raw * (0.5 + Math.random() * 0.5));
}

export function shouldRetryStatus(status) {
  return RETRY_STATUS.has(Number(status));
}

export async function fetchWithBackoff(url, init = {}, opts = {}) {
  const attempts = Math.max(1, Number(opts.attempts) || 5);
  const retryOn = opts.retryOn || shouldRetryStatus;
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      last = res;
      if (!retryOn(res.status) || i === attempts - 1) return res;
      const after = parseRetryAfter(res.headers.get("retry-after") || res.headers.get("Retry-After"));
      const wait = after != null ? after : backoffMs(i, opts);
      await sleep(wait);
    } catch (err) {
      last = err;
      if (i === attempts - 1) throw err;
      await sleep(backoffMs(i, opts));
    }
  }
  if (last && typeof last.status === "number") return last;
  throw last || new Error("fetchWithBackoff exhausted");
}

export function isCloudflareAuthError(text) {
  const s = String(text || "");
  return /\[code:\s*10000\]|Authentication error/i.test(s);
}
