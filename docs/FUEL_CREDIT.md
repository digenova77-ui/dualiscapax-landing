# #FUEL_CREDIT — DualisCapax (LOCKED)

## Purpose
Users pay **Fuel credit** so Adaptive Intelligence (Grok / xAI-class backend) is not run until the plane is broke. Open research stays free. **Depth chat burns Fuel.**

## Product law
| Layer | Cost |
|-------|------|
| Open research / public pages | Free |
| Story / tour | Free |
| Full-screen AI chat (depth) | **Burns Fuel credit** |
| Onboarding / account | Free to start; Fuel purchased for depth |

## Backend (correct path)
- **Not:** share a personal `digenova77` consumer Grok login with all users (against ToS, no multi-tenant metering, credential risk).
- **Yes:** **xAI API** (or successor) under DualisCapax’s developer account.
- Server (Cloudflare Worker / small API) holds the **secret key**.
- Client sends chat only with a **user Fuel session token**.
- Each model call: check Fuel balance → debit → call API → return answer.

```
Phone chat → Dualis API → Fuel ledger debit → xAI/Grok API → reply
```

Owner email (`digenova77@gmail.com`) is the **account holder / billing owner** of the API project — not the shared password for end users.

## Fuel units (starter policy)
| Pack | Credits | Notes |
|------|---------|-------|
| Starter | 50 | Enough to try depth chat |
| Standard | 200 | Regular use |
| Enterprise capacity | Custom | Prepay + invoice |

Approximate burn: **1 credit ≈ 1 user message + 1 model reply** (adjust when real token costs are known).

## Lanes (payments-config.js)
Already defined:
- `fuel` — escalate-only depth
- `capacity` — enterprise prepaid
- `cost_reduction` / `ubi` — residual plane waterfalls

Wire Stripe (or Canadian gateway) Payment Links into `window.DC_PAYMENTS.fuel` when live.

## Local demo (no API key yet)
`ai/chat.html` shows Fuel balance UI and burns **demo credits** so the product behavior is visible before keys and payments go live.

## Never
- Put `sk_` / API secrets in GitHub pages JS
- Run production depth unbounded
- Treat consumer Grok chat login as the multi-user backend
