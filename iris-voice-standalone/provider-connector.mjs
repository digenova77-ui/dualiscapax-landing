const DEFAULT_MODEL = "grok-4.7";
const MAX_INPUT_CHARS = 24_000;

export function createProviderConnector({
  apiKey = process.env.XAI_API_KEY,
  model = process.env.XAI_MODEL || DEFAULT_MODEL,
  fetchImpl = globalThis.fetch,
  timeoutMs = 20_000,
} = {}) {
  return {
    async turn(request) {
      const text = typeof request?.text === "string" ? request.text.trim() : "";
      if (!text) return { ok: false, reason: "empty-input", status: 400 };
      if (text.length > MAX_INPUT_CHARS) {
        return { ok: false, reason: "input-too-large", status: 413 };
      }
      if (!apiKey) return { ok: false, reason: "provider-unconfigured", status: 503 };
      if (typeof fetchImpl !== "function") {
        return { ok: false, reason: "provider-transport-unavailable", status: 503 };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl("https://api.x.ai/v1/responses", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, input: text }),
          signal: controller.signal,
        });

        if (!response.ok) {
          // Do not forward provider response bodies, which may contain sensitive
          // diagnostics or internal identifiers, to the browser.
          return {
            ok: false,
            reason: response.status === 401 || response.status === 403
              ? "provider-credentials-rejected"
              : response.status === 429
                ? "provider-rate-limited"
                : "provider-request-failed",
            status: response.status === 429 ? 429 : 502,
          };
        }

        let payload;
        try {
          payload = await response.json();
        } catch {
          return { ok: false, reason: "provider-invalid-response", status: 502 };
        }

        const answer = extractText(payload);
        if (!answer) return { ok: false, reason: "provider-empty-response", status: 502 };
        return { ok: true, data: { text: answer, model } };
      } catch (error) {
        return {
          ok: false,
          reason: error?.name === "AbortError" ? "provider-timeout" : "provider-unavailable",
          status: 502,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

function extractText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  const chunks = [];
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}
