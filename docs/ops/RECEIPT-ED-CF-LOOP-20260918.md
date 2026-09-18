# RECEIPT — Cloudflare / Worker / Pages closed-loop

**CASE_ID:** `ED-CF-LOOP-20260918-PAGES-WORKER-RECONCILE-V1`  
**FINAL_STATE:** **BLOCKED**  
**TIMESTAMP:** 2026-09-18T07:06:00Z  
**COMMIT_SHA inspected:** `2fb4812e29401f52bba07c1274c48e868fe349db`  
**No secret values are recorded here.**

This is an execution receipt, not another architecture essay.

## Exact break

GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` **exist** and are injected into `pages-direct-upload` and `stripe-fulfill-v2`.

Wrangler then calls Cloudflare and Cloudflare returns:

```
Authentication error [code: 10000]
/accounts/***/pages/projects/dualiscapax-landing
```

and independently:

```
Authentication error [code: 10000]
/accounts/***/workers/services/dualiscapax-stripe-fulfill-v2
```

Empty-check of the secrets **passes**. Cloudflare authorization **fails**. That is the break on the authenticated deploy rail.

## Phase results

### Inventory (INTENDED vs rails)

| Rail | Path | State |
|---|---|---|
| Canonical Pages Actions | `.github/workflows/pages-direct-upload.yml` | Active, dispatch-only, fail-hard, project `dualiscapax-landing`, source `cf-pages/` |
| Retired GitHub Pages | `.github/workflows/deploy.yml` | Retired, dispatch refuses publish |
| Retired Workers auto-deploy | `.github/workflows/workers-live.yml` | Retired, dispatch refuses wrangler |
| Worker Actions still live | `.github/workflows/stripe-fulfill.yml` | Active on push + dispatch; same token; auth 10000 |
| OIDC | `.github/workflows/oidc-auth.yml` | Present; **not** used for this Pages loop; not expanded |
| Docs split | `docs/ops/ENVIRONMENT.md` | Says manual zip only. Does not delete the Actions Pages rail. |

Workers in git:

- `dualiscapax-stripe-fulfill-v2` — `workers/stripe-fulfill/wrangler.toml`
- `dualiscapax-iris-gateway` — `workers/iris-gateway/wrangler.toml`
- `dualis-gate` — `workers/dualis-gate/wrangler.toml`
- `dualiscapax-origin-join` — `workers/origin-join/wrangler.toml` (path-exact routes on `dualiscapax.ai`, not `/*`)

Bindings in git are **commented**. IDs are dashboard-only. That is intended, not a missing line to invent.

### Authentication test

| Check | Result | Evidence |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | **EXISTS** | Job env shows token injected (`***`), empty-check did not fire. Run 35303058475. |
| `CLOUDFLARE_ACCOUNT_ID` | **EXISTS** | Same. |
| Cloudflare authentication | **FAIL** | API 10000. |
| Authenticated identity | **UNVERIFIED** | whoami never succeeds after 10000. |
| Target account | **UNVERIFIED** | Account id present but not proven to be the owner of the project. |
| Required permission scope | **INSUFFICIENT or INVALID** | Cannot distinguish revoked token vs wrong account vs missing Pages/Workers edit without a working token. Both Pages and Workers endpoints reject. |

### Pages

| Check | Result |
|---|---|
| Project hostname exists | **VERIFIED** `https://dualiscapax-landing.pages.dev/` HTTP 200 DualisCapax HTML |
| Package job | **VERIFIED** run 35303058475 job Package cf-pages Artifact success |
| Zero-nest + index.html + checksum | **VERIFIED** `cf-pages-production.zip: OK`, 485 files |
| Artifact | **VERIFIED** `cf-pages-bundle` id `10531085234` digest `sha256:df0dd0502cfe5dc85a7f18070f79c8e72f724a5c52c3e31a091009f7b9f20504` |
| Wrangler deploy | **FAIL** API 10000 |
| Deployment ID | **UNVERIFIED** |

### Live production

| Check | Result |
|---|---|
| `https://dualiscapax.ai/` | HTTP **200**, `server: cloudflare` |
| DualisCapax marker | **present** |
| Current git `cf-pages/index.html` | **not** what apex serves |
| `cf-pages/api/status.json` in git | raw 200 |
| `/api/status.json` on apex and pages.dev | **404** |
| `www.dualiscapax.ai` | **does not resolve** |

Index bytes:

- git `cf-pages/index.html` 12353 sha256 `bd42cd21549f7e658cbcadc872a175423b6b59c12909ab4ced92c10cdc4b74c0` title `DualisCapax`
- apex 33849 sha256 `a180d186e47000f79c17dd17853da04ac6dd4afda0e59d2c4ef23c2745905449` title `DualisCapax — We stop money leak.`
- pages.dev 32911 sha256 `780e5b946131db6da8f4e937d4bc23343e5d268d8a258fc3cfca2f48db1bdf49` same title family, different hash from apex

Apex is live Cloudflare Pages-class HTML. It is **not** a successful reconciliation of current git `cf-pages/` through Actions.

### Worker

| Worker | workers.dev | Notes |
|---|---|---|
| `dualiscapax-stripe-fulfill-v2` | HTTP 200 JSON `status: up` | `has_webhook_secret=true`, `has_kv=false`, `has_d1=false` |
| `dualiscapax-iris-gateway` | 1042 | not present / workers.dev disabled |
| `dualis-gate` | 1042 | same |
| `dualiscapax-origin-join` | 1042 | same |

Apex paths `/hooks/stripe`, `/u`, `/api/fulfill` return Pages 404 HTML. Custom-domain Worker routes are **UNVERIFIED**.

Do not add D1/KV bindings in git. Required chain if Fuel/idempotency must be durable:

REQUIRED CAPABILITY = durable fulfill + write-once lots  
→ REQUIRED RESOURCE = D1 `dualiscapax-fulfillments` (and optional KV cache)  
→ REQUIRED BINDING TYPE = `[[d1_databases]]` binding `DB`  
→ CANONICAL RESOURCE = create in dashboard, never commit live `database_id`  
→ CONFIGURATION = dashboard bind  
→ DEPLOYMENT = seated `wrangler deploy` or repaired token  
→ RUNTIME VERIFICATION = `has_d1=true` on `GET /` of the worker

That bind was **not** performed here.

## Reconcile (letters)

- **A missing credential:** NO (secrets exist)
- **B invalid credential:** LIKELY (API 10000)
- **C insufficient scope:** LIKELY (same 10000 on Pages project and Workers service)
- **D wrong account:** POSSIBLE, UNVERIFIED
- **E wrong Pages project:** NO evidence the name is wrong; `dualiscapax-landing.pages.dev` exists
- **F wrong Worker:** stripe live name matches wrangler.toml; iris/gate/origin not on workers.dev
- **G missing Worker binding:** YES at runtime for D1/KV on stripe-fulfill
- **H incorrect Worker route:** UNVERIFIED; apex webhook paths are Pages 404
- **I stale deployment:** YES vs current git cf-pages
- **J artifact/deployment mismatch:** YES (git index ≠ apex ≠ pages.dev)
- **K GitHub Actions not executing:** NO — workflow runs and package succeeds
- **L configuration present but never deployed via this rail:** YES for Actions Pages
- **M multiple architectures:** YES — manual zip doc + Actions pages-direct-upload; GitHub Pages and workers-live retired fossils kept

## Repair

**None executed.** Repair of the credential path requires a human who can mint a Cloudflare API token and write the GitHub Actions secret. This agent cannot do that. Cloudflare is not a connected service.

No second Pages project, lander, publication rail, or OIDC/AWS detour was created.

## Minimum human action

1. Cloudflare dashboard → Account API tokens.
2. Create token with **Account / Cloudflare Pages / Edit** and **Account / Workers Scripts / Edit** on the account that owns Pages project `dualiscapax-landing`.
3. GitHub → `digenova77-ui/dualiscapax-landing` → Settings → Secrets and variables → Actions.
4. Replace `CLOUDFLARE_API_TOKEN`. Confirm `CLOUDFLARE_ACCOUNT_ID` is that same account. Do not paste values into chat.
5. Actions → `pages-direct-upload` → Run workflow → confirm `DEPLOY`.
6. Closure test: wrangler prints a deployment id **and** `https://dualiscapax.ai/` 200 **and** `/api/status.json` 200 matching git `cf-pages/api/status.json`.

Until step 5+6 succeed, this loop stays **BLOCKED**.
