# Iris rail handoff

Primary: xAI `IRIS_MODEL` (default grok-4.6).
On 429 / 5xx / unreachable:

1. POST `IRIS_HANDOFF_WEBHOOK` `{ event: primary_rail_failed, from, xai_status, reason }`
2. Groq `GROQ_API_KEY` → `llama-3.1-8b-instant` (free tier if you have a Groq key)
3. OpenRouter `OPENROUTER_API_KEY` → `meta-llama/llama-3.1-8b-instruct:free`

No key in git. `wrangler secret put GROQ_API_KEY` / `OPENROUTER_API_KEY` / `IRIS_HANDOFF_WEBHOOK`.
No key = webhook only, then RAILS_EXHAUSTED. There is no anonymous public LLM that Dualis can legally pin.
