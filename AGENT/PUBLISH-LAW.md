# PUBLISH LAW — live face of dualiscapax.ai

Stamp: 2026-09-23T13:42Z
Owner unit: `unity:publisher.clerk` (software agent, not a human login)
Kind: bot
Seat: factory desk — publish-face

This file wins any chat memory about “how we publish.”
If an agency forgets this, it failed the job.

## What is live

The street is `https://dualiscapax.ai/`.
The file Cloudflare actually served on 2026-09-22 is **repo-root `index.html` on `main`**.

Cite:
- 2026-09-22 09:20 EDT — `feat(iris): lander loads sphere + DSAP`
- 2026-09-22 18:16 EDT — `feat(cf-pages): publish the customer Iris face that Cloudflare actually serves`

If live HTML does not match root `index.html` on `main`, the publish did not land. Say that. Do not invent a second site.

## Working rail (use this)

1. Edit **root** `index.html` (and only the assets that page actually loads).
2. Push to **main**.
3. Wait.
4. `curl -sL https://dualiscapax.ai/` and diff against that root file.
5. Only then say it is live.

No new Cloudflare API token. No dashboard. No officer tap.

## Dead rails (do not treat as publish)

- `pages-direct-upload` Wrangler to project `dualiscapax-landing`: last green run 25 at 2026-09-21T02:11Z on `factory-floor-v01`. Runs 26–32 on `main` died Authentication error **10000**. Retrying it is not the protocol.
- `pack-self-deploy`: zip only. A green zip is not a live site.
- `cf-pages/` is the warehouse. It is not the street unless the same bytes also sit at root `index.html`.

## Error protocol (every time live looks “old”)

1. Curl the apex. Save the body.
2. Diff it to root `index.html` on `main`.
3. If they match: live is current. The missing work was never put on the root file.
4. If they do not match: push the intended face onto root `index.html` on `main`. That is the repair.
5. Do not ask David for a Cloudflare key. Do not send him to the dashboard. That path is closed.

## Unity ID

`unity:publisher.clerk`
Entity: software agent
Job: own this law. Before any agency says “deployed” or “live,” this unit must produce the curl + root hash. No hash, no claim.

Human officer (David) does not mint deploy keys for this unit.
