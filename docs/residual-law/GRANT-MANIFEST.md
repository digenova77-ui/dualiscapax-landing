# GRANT MANIFEST — Purpose-Scoped Access

**Status:** Locked 26 Aug 2026  
**Operator offer:** *If that involves crafting the login for the account that you need to bake it into what you have to do, then I will grant it for you here and give you right permission if you need it over whatever manifest to our purpose without circumventing the systems that I’m giving you access to.*

Cross-ref: BIND-API · WHO-IS-AGENT · DEFAULT-SOLVE · APIV1-ORGAN-TO-APIV2 · SECRETS-ISOLATION · DUALISCAPAX-TOS-INTERNAL

---

## 1. Rule

Agents may request a **purpose-scoped grant** when outer-layer engineering truly requires account capability we do not already have via connected tools.

| Allowed | Forbidden |
|---------|-----------|
| OAuth connect, Actions secrets, official tokens in silo, least-privilege roles | Passwords in chat; sharing keys across agents in plaintext; using grant to circumvent platform TOS |
| Manifest listing exact purpose + system + permission | Open-ended “full admin forever” without purpose |
| Use only for DualisCapax purpose on Operator accounts | Other accounts / other purposes |

**Grant does not mean circumvent.** Grant means **allowed access** the Operator explicitly opens for **our purpose**.

---

## 2. Prefer order (before asking login)

1. ACCEPTED_NATIVE (GitHub/Google already connected)  
2. Granular organ path  
3. Dualis outer-layer concept without new login  
4. **YES BIND** silo (token in Actions/wrangler — not chat)  
5. Only if still required: **manifested account permission** Operator grants through **official** login/OAuth/dashboard — values still not pasted into agent chat when avoidable  

---

## 3. Manifest shape (when we ask)

```text
GRANT MANIFEST id=GM-…
  purpose:     [one Dualis residual purpose]
  system:      [GitHub|Cloudflare|Google|Squarespace|…]
  permission:  [least privilege needed]
  bake_into:   [which Bridge / APIv2 / workflow uses it]
  not:         circumvent TOS; other purposes; chat password
  ask:         YES GRANT GM-…
  place:       [dashboard/OAuth/silo instruction — no secret value in reply]
```

Operator replies **YES GRANT GM-…** after placing access the official way.

---

## 4. Current residual

**No GM open by default.** Core path uses existing GitHub + Google connections.  
G1–G4 remain optional BIND silos if depth/Worker needed.

---

## 5. One line

**If we need account power for Dualis purpose, we manifest least privilege, you grant through official systems without circumvention, and we bake it into Bridges — never passwords in chat, never other purposes.**

**Last update:** 26 Aug 2026
