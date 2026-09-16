# Deploy this build yourself

No token. You are logged into Cloudflare. That is enough.

## Get the zip

1. Phone or desktop: GitHub → digenova77-ui/dualiscapax-landing → Actions → **pack-self-deploy** → Run workflow → main.
2. Open that run → Artifacts → **dualis-pages** → download.
3. Unzip. You should see `index.html`, `ice.html`, `gameday.html` at the **top** of the folder — not inside another `cf-pages` folder.

Direct download of the whole repo also works: Code → Download ZIP → keep only the `cf-pages` folder contents.

## Put it on dualiscapax.ai

1. dash.cloudflare.com → Workers & Pages → project **dualiscapax-landing** (custom domain dualiscapax.ai).
2. Create deployment / Upload assets / drag the unzipped files.
3. Production. Wait until it says success.
4. Hard-refresh https://dualiscapax.ai/gameday and https://dualiscapax.ai/rte/sima-dclm/

If the project shows Connect to Git instead of Upload, use Retry deployment on latest main after output directory is `cf-pages`.

Do not upload the repo root. Do not upload `public/`.
