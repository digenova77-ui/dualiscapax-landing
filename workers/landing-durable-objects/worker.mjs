/**
 * DualisCapax landing Durable Object service.
 *
 * This is a separate Worker because Cloudflare Pages cannot create/deploy
 * Durable Object classes from inside the Pages project itself.
 * Trinity authorization remains in the Pages/runtime application; these
 * objects provide only rate limiting and atomic append/idempotency storage.
 */
export class RateLimiter {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/check") {
      return new Response("not-found", { status: 404 });
    }
    const { key, limit = 10, windowMs = 60_000 } = await request.json();
    const now = Date.now();
    const windowKey = `win:${key}`;
    let record = (await this.state.storage.get(windowKey)) || { count: 0, resetAt: now + windowMs };

    if (now >= record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
    }

    if (record.count >= limit) {
      return Response.json({ allowed: false, remaining: 0, resetAt: record.resetAt });
    }

    record.count += 1;
    await this.state.storage.put(windowKey, record);

    return Response.json({
      allowed: true,
      remaining: limit - record.count,
      resetAt: record.resetAt,
    });
  }
}

export class AuditLog {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/record") {
      const entry = await request.json();
      const key = `req:${entry.request_id}`;
      const existing = await this.state.storage.get(key);
      if (!existing) {
        const record = { ...entry, recorded_at: new Date().toISOString() };
        await this.state.storage.put(key, record);
      }
      return Response.json({ ok: true });
    }

    // Calls for the same request_id serialize through one Durable Object.
    // First claimant wins; later claims for that ID are refused.
    if (request.method === "POST" && url.pathname === "/claim") {
      const entry = await request.json();
      const key = `claim:${entry.request_id}`;
      const existing = await this.state.storage.get(key);
      if (existing) {
        return Response.json({ claimed: false, first_claimed_at: existing.claimed_at });
      }
      const claimed_at = new Date().toISOString();
      const { record: decisionRecord, ...claimEntry } = entry;
      if (decisionRecord) {
        const recordKey = `req:${entry.request_id}`;
        const existingRecord = await this.state.storage.get(recordKey);
        if (!existingRecord) {
          const stored = { ...decisionRecord, recorded_at: claimed_at };
          if (stored.decision && typeof stored.decision === "object") {
            stored.decision = { ...stored.decision, claimed_at };
          }
          await this.state.storage.put(recordKey, stored);
        }
      }
      const record = { ...claimEntry, claimed_at };
      await this.state.storage.put(key, record);
      return Response.json({ claimed: true, claimed_at });
    }

    if (request.method === "GET" && url.pathname.startsWith("/get/")) {
      const requestId = decodeURIComponent(url.pathname.slice(5));
      const record = await this.state.storage.get(`req:${requestId}`);
      if (!record) return Response.json({ found: false }, { status: 404 });
      return Response.json({ found: true, record });
    }

    return new Response("not-found", { status: 404 });
  }
}

export default {
  fetch() {
    return new Response("not-found", { status: 404 });
  },
};
