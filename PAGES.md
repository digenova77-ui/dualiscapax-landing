# Cloudflare Pages build — DualisCapax

Static files. No compile.

## Dashboard (phone)

1. dash.cloudflare.com → **Compute** → **Workers & Pages**
2. If **dualiscapax-landing** already exists as Pages, open it → **Settings** → **Builds & deployments**
3. If not: **Create** → **Pages** → **Connect to Git** → `digenova77-ui/dualiscapax-landing`
4. Set exactly:

| Field | Value |
|---|---|
| Production branch | `main` |
| Root directory | `/` (empty) |
| Build command | *leave blank* |
| Build output directory | `/` |
| Deploy command | leave default |

5. **Save and deploy**
6. **Custom domains** → add `dualiscapax.ai` and `www.dualiscapax.ai`
7. DNS: those two names should be CNAME to `dualiscapax-web.pages.dev` **or** stay on GitHub A records. Do not point the same name at both.

## Do not
- Put `npm run build` in the build command. There is no app compile.
- Point Pages and GitHub Pages at the same hostname at once.
- Name this project the same as the **Worker** `dualiscapax-landing` if Cloudflare refuses. Use **dualiscapax-web**.

## Check
`https://<project>.pages.dev/ai/app.html` must load Iris.
Then attach the custom domain.
