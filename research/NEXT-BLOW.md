# NEXT BLOW

One job. Not a catalog.

## Live hole
`GET /accounts/{id}/pages/projects/dualiscapax-landing` → Cloudflare **10000**.
Token is in GitHub. It is not Pages Edit on this account.
Apex has /ice. Apex 404s /gameday. Git has gameday.html in cf-pages/.

## Allowed smash
1. Cloudflare token → Account → Cloudflare Pages → Edit. Same Account ID.
2. GitHub → Settings → Secrets → replace CLOUDFLARE_API_TOKEN.
3. Actions → pages-direct-upload → Run workflow on main → once.
4. Hard-refresh https://dualiscapax.ai/gameday — leave 404.

Or: Pages dashboard → Retry latest main if the project is git-connected.

## Forbidden until /gameday is 200
AWS, S3, CloudFront, IAM OIDC, R2, KV bulk, HAL, Siren, JSON:API, Deno, unenv, workerd C++, compatibility flags, Pages Functions bindings, fake OIDC workflows.
Those do not upload cf-pages/gameday.html.

## Learn
Run workflow `live-clock`. Read the job summary. Do not tour.
If /gameday is 200, the hole closed. Next smash is product, not deploy.
If /gameday is 404, the hole is still 10000. Repeat allowed smash. Do not add a third kitchen.
