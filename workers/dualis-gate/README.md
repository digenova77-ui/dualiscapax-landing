# dualis-gate (paper → preview)

Worker for `/u` `/hooks` `/pay` only. Never bind `/*`.
`CHECKOUT_OPEN=false` in wrangler.toml.

Seat:
1. `npx wrangler d1 create dualis-unity`
2. Put database_id in wrangler.toml
3. `npx wrangler d1 execute dualis-unity --remote --file=schema.sql`
4. `npx wrangler secret put STRIPE_IDENTITY_SECRET` (TEST `whsec_`)
5. `npx wrangler secret put STRIPE_WEBHOOK_SECRET` (TEST `whsec_`)
6. `npx wrangler deploy`
7. Stripe CLI replay against `https://<preview>/hooks/identity`

Do not put secrets in this folder. Do not flip CHECKOUT_OPEN here.
