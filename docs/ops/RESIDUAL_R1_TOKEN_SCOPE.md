# Residual R1 — Cloudflare API token scope (D1 mint while parked)

**Threat:** Account `CLOUDFLARE_API_TOKEN` can `wrangler d1 execute` / D1 HTTP SQL
`INSERT` into `dualiscapax-fulfillments` economic tables (`entitlements`,
`fuel_credits`, `grants`, `events`) while Worker `CHECKOUT_OPEN=false`.
Park on the HTTP grant path does **not** stop the ops-plane D1 API.

**Constraint:** Dashboard token permission UI is operator-only. This token
cannot rewrite its own policies (`GET /user/tokens/:id` → Unauthorized).
Agents must **not** invent a narrower token secret; operator creates it.

## Exact required permission set (fulfill deploy / Workers only)

Create a **new** API token (Cloudflare Dashboard → My Profile → API Tokens →
Create Token → Create Custom Token) with **only**:

| Permission group | Access | Why |
|---|---|---|
| Account → **Workers Scripts** | Edit | `wrangler deploy` / versions |
| Account → **Workers Scripts** | Read | list/deployments/versions observe |
| Account → **Account Settings** | Read | resolve account id |

Optional (observability only, still no mint):

| Account → **Workers Tail** | Read | live logs |

### Must NOT include

| Permission | Why forbid |
|---|---|
| Account → **D1** Edit | Enables `d1 execute` ledger mint |
| Account → **D1** Read | Prefer omit on deploy token; use separate read-only observe token if needed |
| Account → Workers KV / R2 Edit | Not required for fulfill park deploy |
| Account → Account / User Admin | Over-broad |

Account resource: include only this account
(`725a9382123c9f12a01e3eda718f6436`).

After create: replace Actions secret `CLOUDFLARE_API_TOKEN` and box-secrets
card key with the **new** token; revoke the old broad token.

## Repo / CI guards (committed)

1. `.github/workflows/stripe-fulfill.yml` — explicit step refuses if the
   workflow file itself contains `d1 execute`; never runs D1 SQL.
2. `factory/tools/admit_stripe_fulfill_deploy.sh` — admit only; no D1.
3. Factory test `test_stripe_fulfill_workflow_forbids_d1_execute`.
4. Do **not** add `wrangler d1 execute` to any GitHub Action that holds the
   deploy token.

## Operator verify (after new token)

```bash
# Expect FAIL (permission denied) with narrowed token:
npx wrangler d1 execute dualiscapax-fulfillments --remote \
  --command="SELECT 1"
# Expect OK:
npx wrangler deployments list --name dualiscapax-stripe-fulfill-v2
```

**Status:** Runbook + CI guards = **VERIFIED** in repo. Live token narrowing
= **USER ACTION** (dashboard create/restrict + rotate card/Actions secret).
