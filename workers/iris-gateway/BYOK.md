# Iris BYOK

Public POSTs to `/api/iris` require the **caller’s** xAI key.

```
POST /api/iris
Authorization: Bearer xai-YOUR_KEY
Content-Type: application/json

{"prompt":"hello"}
```

- Create the key on **your** team at https://console.x.ai (not DualisCapax team 5682c).
- Buy credits on that same team.
- Do not invite extra people onto the house team — they would spend the house prepaid balance.

House secret `XAI_API_KEY` is used only when `IRIS_ALLOW_HOUSE_KEY=1` (keep `0` in production).
After changing the worker, deploy: `npx wrangler deploy` from `workers/iris-gateway`.
