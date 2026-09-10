# PINATA-OPS — take Dualis L1 live on Pinata without lying about DNS

Stamp: 2026-09-10T02:40Z
Live origin of `https://dualiscapax.ai` remains GitHub Pages (`DOMAIN.md`).
This file is the operational ladder. Climb one rung at a time. Do not skip to apex cutover.

## What “operational on Pinata” is allowed to mean

| Rung | Visitor URL | What must exist | Apex `@` |
|---|---|---|---|
| 0 Paper | none | `scripts/pin-pinata.mjs` in git | Pages A×4 |
| 1 Pinned | `https://<gw>.mypinata.cloud/ipfs/<cid>/dualiscapax/why.html` | JWT + successful `--pin` | Pages |
| 2 Branded IPFS | `https://ipfs.dualiscapax.ai/ipfs/<cid>/dualiscapax/why.html` | dedicated gateway + CNAME | Pages |
| 3 Named | `/ipns/dualiscapax.ai` on public gateways | `_dnslink` TXT | Pages |
| 4 Cutover | `https://dualiscapax.ai` served by Pinata | Seat written order to move `@` | **not Pages** |

Rung 4 fights `DOMAIN.md`. Do not do it from chat. Rungs 1–3 do not.

Checkout stays closed. Workers stay unbound. Unity stays on-device. The pin is L1 HTML/CSS/JS only.

## Hard Pinata facts (learned, not hoped)

- Folders: `POST https://api.pinata.cloud/pinning/pinFileToIPFS`, one `file` part per path. V3 `/v3/files` is files/TUS only.
- Public network only for folders.
- `pinataOptions.cidVersion = 1`. No UnixFS 1.5 `mode`/`mtime`.
- `gateway.pinata.cloud` will not render HTML. Dedicated gateway required.
- Restricted dedicated gateway only serves **your** pins. Child CIDs requested as `/ipfs/<child>` 401. Use `/ipfs/<folderCid>/dualiscapax/why.html`.
- Dedicated gateways are a paid-plan feature. Free Picnic may pin; HTML browse may still be blocked until a gateway exists.
- Custom domain on a gateway is a CNAME to `*.mypinata.cloud`. That is **not** DNSLink.
- Apex CNAME at `@` cannot coexist with Pages A records. Use `ipfs.` subdomain for rung 2.
- JWT permissions for Actions: `pinFileToIPFS` + `pinList`. Do not enable `unpin` on the CI key unless Seat wants CI to delete pins.
- One folder POST ≤ 25 GB, aim ≤ 15 GB. Lander mode is small.

## Seat paste (nothing here is in git)

1. pinata.cloud → API Keys → New key.
   - Name: `dualis-lander-ci`
   - Endpoints: `pinFileToIPFS` yes, `pinList` yes, `unpin` no
   - Copy JWT once
2. GitHub → `dualiscapax-landing` → Settings → Secrets → Actions → `PINATA_JWT`
3. Optional second secret `PINATA_GATEWAY` = `https://YOURNAME.mypinata.cloud` (docs only; script does not need it)

Chat cannot mint the JWT.

## Rung 1 — get a CID

```
# local
PINATA_JWT=… node scripts/pin-pinata.mjs --pin

# or Actions → pinata-pin → Run workflow (full=false)
```

Success log: `{ "ok": true, "cid": "bafy…", "files": N }`.
Receipt: `data/pinata-last.json` (written on the runner; commit it only if Seat wants the CID in git).

Browse (after dedicated gateway exists):

```
https://YOURNAME.mypinata.cloud/ipfs/<cid>/dualiscapax/why.html
https://YOURNAME.mypinata.cloud/ipfs/<cid>/dualiscapax/curtain.html
```

If HTML is blank or download-only, you are still on the public gateway. Stop. Buy/create the dedicated gateway. Do not debug the site.

## Rung 2 — branded host that does not steal apex

Cloudflare DNS, **dualiscapax.ai** zone, grey-cloud:

| Name | Type | Target |
|---|---|---|
| `ipfs` | CNAME | `YOURNAME.mypinata.cloud` |

Pinata app → Gateways → ⋮ → Add Custom Domain → `ipfs.dualiscapax.ai`.

Wait for their TLS. Then:

```
https://ipfs.dualiscapax.ai/ipfs/<cid>/dualiscapax/why.html
```

Do **not** add `ipfs` as a Pages custom domain. Do **not** orange-cloud this CNAME until TLS from Pinata is green (orange + Pinata origin often 525/526).

`www` and `@` stay on GitHub Pages.

## Rung 3 — DNSLink signal (optional, parallel)

Grey-cloud TXT, **not** a CNAME:

```
_dnslink.dualiscapax.ai.  TXT  "dnslink=/ipfs/<cid>"
```

Then `https://dweb.link/ipns/dualiscapax.ai/dualiscapax/why.html` should resolve. Path prefix `dualiscapax/` is what the pin script wraps. Flatten later if you hate that segment (`filepath` without the prefix — change the script in a dedicated commit).

Update the TXT every time `--pin` prints a new CID. TTL 60–300 while iterating.

`npx dnslink-cloudflare -d dualiscapax.ai -l /ipfs/<cid>` needs `CF_API_TOKEN` (`Zone:Read` + `DNS:Edit`). Separate Seat paste. Not the Pinata JWT.

## Rung 4 — apex on Pinata (Seat only)

Written order required. Then and only then:

1. Pinata Add Custom Domain `dualiscapax.ai` (and maybe `www`).
2. Remove Pages A×4 from `@`.
3. Cloudflare CNAME flatten `@` → `YOURNAME.mypinata.cloud` **or** whatever Pinata prints.
4. Move `www` the same way.
5. Rewrite `DOMAIN.md`, `CANONICAL_DOMAIN.md`, merch-overlay assumptions.
6. Expect merch Worker / orange-cloud behaviour to change. Test `www` and apex before calling it live.

This rung is **not** armed in CI.

## What stays off the CID

Workers, D1, Stripe, Unity `localStorage`, JWTs, `wrangler.toml`, `.github`. Restricted gateway + public pin is enough for L1. Do not pin `workers/`.

## Verify a pin

1. `curl -sI` the dedicated-gateway URL for `why.html` → `200` and `text/html`.
2. Same file on Pages: look must match. Residual-ring still hashes git; it will not equal the CID.
3. Change one lander file, re-pin, CID must change.
4. Restricted gateway request for a random `bafy` you did not pin → 401.

## Failure table

| Symptom | Cause | Do |
|---|---|---|
| 401 on `--pin` | bad/missing JWT | Seat re-paste secret |
| 403 / plan | folders or gateway not on plan | upgrade; do not hack V3 files |
| HTML download / empty | public gateway | dedicated + custom domain |
| 401 on `/ipfs/<fileCid>` | restricted gateway + child CID | use folder CID + path |
| Site CID ≠ local Kubo CID | chunker / raw-leaves / wrap prefix | accept two addresses or match knobs |
| 522 on `www` | origin still wrong | fix DNS; do not rebuild |
| Apex 404 after CNAME | cutover without Pinata domain object | add custom domain first |

## Status now (2026-09-10)

- Rung 0: done (`8fda9e1` and this file).
- Rung 1–4: blocked on Seat JWT and, for HTML, a dedicated gateway.
- `DOMAIN.md` still Pages. That is correct until rung 4.
