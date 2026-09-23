# Security

This repository is public on purpose. Crawlers and people may read it.
That is not permission to put a private key in it.

## Report a hole

Open a GitHub issue titled `SECURITY` or email the account that owns `digenova77-ui`.
Do not file a public issue that pastes the secret. Paste that the class exists.

## What belongs here

Cited packs. Public lander. Workflows. Stripe *publishable* buy buttons (`pk_live_`, `buy_btn_`).

## What does not

`sk_live_`, webhook `whsec_`, Cloudflare API tokens, xAI keys, PEM/SSH private keys, GitHub PATs.
See `AGENT/NEVER-COMMIT.md`.

## What David still clicks

GitHub → repo → Settings → Code security:
1. Secret scanning — on
2. Push protection — on
3. Dependabot alerts — on

This factory cannot flip those toggles from a file. The scan job below still greps the tree every drop.
