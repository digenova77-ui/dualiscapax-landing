# Access this agent needs — and what you must never paste in chat

Do not put keys, webhook secrets, or seed phrases in GitHub, Drive public docs, or this chat.

## Already in this Grok session
- GitHub `digenova77-ui/dualiscapax-landing`
- Google Drive (encyclopedia / specs)
- Gmail / Calendar (when you ask)
- Stripe connector (account must be selected; live Payment Links already on `/pay.html`)

## You flip — no key in chat

1. **Cloudflare Access on the depth worker**  
   `dualiscapax-depth.digenova77.workers.dev` is behind Access. Public Iris cannot use the house model until you: Zero Trust → Access → remove the policy on that hostname, **or** add a public bypass for `POST /v1/chat` only.

2. **Iris house key (optional, funded)**  
   On the laptop, from `workers/iris-gateway`:  
   `npx wrangler secret put XAI_API_KEY`  
   Then set `IRIS_ALLOW_HOUSE_KEY=1` only when you want the house balance spent.  
   Default stays `0`. Public visitors should BYOK or use the free search rail.

3. **Iris cheap fallbacks (optional)**  
   Same folder:  
   `npx wrangler secret put GROQ_API_KEY`  
   `npx wrangler secret put OPENROUTER_API_KEY`  
   Groq free tier and OpenRouter `:free` models. No secret in git.

4. **Stripe webhook (so Pay writes Fuel for real)**  
   Deploy `workers/stripe-fulfill` (`npx wrangler deploy`).  
   Dashboard → Developers → Webhooks → URL of that worker.  
   `npx wrangler secret put STRIPE_WEBHOOK_SECRET`  
   Payment Links already need `metadata.sku` = `depth_s` / `depth_m` / `depth_l` / `leaf` / `branch` / `library`.

5. **Treasury addresses**  
   When you have them, put them in a private Drive file, not on a public HTML page, then we wire `/treasury.html` as display-only.

6. **Contracts**  
   No address until one exists on a chain. Do not invent.

## Already working with no extra key
- `/member.html` Unity ID  
- `/pay.html` Stripe CAD links  
- `/compute.html` on-device invert  
- `/study.html` encyclopedia look  
- `/ai/app.html` DCLM + Wikipedia + public text rail  
- Drive encyclopedia search from this agent  

## Say the word after you flip one lock
"Access is open on the depth worker" or "Fulfill worker is up at …" — then this agent can point the site at the live URL. Still never paste the secret.
