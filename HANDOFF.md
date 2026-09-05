# Agency handoff — DualisCapax lander

You are picking up a static lander plus one Stripe fulfill worker. You are not minting. You are not a clinic.

## Read first
AGENT_CHECKPOINT.md  
COMMITS.md  
CHECKPOINT in operator artifacts if you have the shop disk: CHECKPOINT_WEBSITE.md  
Command if you have that disk: `cd /home/workdir/artifacts && python3 -m onboard_modules.agent_now`

## What is live
Origin: GitHub repo `digenova77-ui/dualiscapax-landing` branch `main`  
Public files: https://digenova77-ui.github.io/dualiscapax-landing/  
Start: story.html → hub.html  
Pay: Stripe Payment Links on pay.html (CAD)  
Webhook receiver: `https://dualiscapax-stripe-fulfill-v2.digenova77.workers.dev/`  
Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`

## Where secrets live (not in git, not in Pages)
| Name | Host |
|---|---|
| Stripe webhook signing secret `whsec_` | Cloudflare Worker env `STRIPE_WEBHOOK_SECRET` |
| Stripe dashboard login | Operator Stripe account |
| Cloudflare login | Operator CF account |
| Unity hatch / cards | Holder device only |

GitHub Actions on this repo does **not** need those values to scan. Do not paste `whsec_` into Actions unless you are writing a deploy workflow that copies it to Cloudflare.

## GitHub Actions
`.github/workflows/secret-scan.yml` fails the push/PR if the tree contains `whsec_`, `sk_live_`, `rk_live_`, or private key PEM headers.

## Access law to keep
Look $0. Default deny. Public serial only. No health or licence numbers in git or tickets. Iris veto: diagnose/cure, guaranteed profit, jailbreak. No token float. No ICO. Same door for every person. Dualis is messenger.

## Do not
Force-push main. Second website. Helix lander. Fake chain address. Flip COUNSEL_SEALED from chat. Treat localStorage as paid Fuel until FULFILL_KV is bound.

## First week for the agency
1. Clone main. Open story.html. Click every door in AGENT_CHECKPOINT.md.  
2. Confirm Stripe links on pay.html in incognito.  
3. Confirm worker GET JSON `status: up`.  
4. Bind FULFILL_KV if the operator wants auto Fuel.  
5. Commit with COMMITS.md (atomic, prefixed). Update AGENT_CHECKPOINT.md only when the path changes.
