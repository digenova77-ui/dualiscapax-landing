# stripe-fulfill-v2 — last mile

Everything in this folder is ready to deploy. Name in wrangler.toml is `stripe-fulfill-v2`.
First command must be `wrangler deploy` (not `versions upload`).

## What is already done

- Worker source: `worker.js`
- Wrangler name matches dashboard Worker name
- GitHub Action: `.github/workflows/stripe-fulfill.yml`
- No secrets in git

## What only you can do (privilege)

Pick **one**. Do not put tokens in chat.

### A — GitHub Actions (lets Grok trigger deploy after this)

1. Cloudflare dashboard → Manage Account → Account API tokens
2. Create Token → **Edit Cloudflare Workers**
3. Copy account ID from any Worker overview URL / Workers overview
4. GitHub → `digenova77-ui/dualiscapax-landing` → Settings → Secrets and variables → Actions
5. Add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
6. Actions → **stripe-fulfill-v2** → Run workflow

After that, a push under `workers/stripe-fulfill/` deploys, and Grok can dispatch the same workflow.

### B — Cloudflare Builds (no GitHub token)

Workers → `stripe-fulfill-v2` → Settings → Builds

- Repo: `digenova77-ui/dualiscapax-landing`
- Root directory: `workers/stripe-fulfill`
- Build command: empty
- Deploy command: `npx wrangler deploy`
- Production branch: `main`

Save, then Retry build. Ignore the red script-settings banner until the first green deploy.

### C — Laptop, once

```bash
cd workers/stripe-fulfill
npm install
npx wrangler login
npx wrangler deploy
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

## After the script exists

1. `GET https://stripe-fulfill-v2.<account>.workers.dev/` → `{ "status": "up" }`
2. Stripe → Developers → Webhooks → that URL
   Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
3. Paste `whsec_...` into `wrangler secret put STRIPE_WEBHOOK_SECRET` or Worker Settings → Variables / Secrets
