# UNITY FRAMEWORK

**Master bind — 26 Aug 2026**  
**Law:** Everything ships as a projection of closed-loop \(\mathbf{U}\). No side tools.

> DualisCapax is the vision between the user and the future.  
> Capacity measured. Residual priced. Cost toward zero for everyone.

Math spine: **[UNITY-CLOSED-LOOP](UNITY-CLOSED-LOOP.md)**  
$$\mathbf{U}=(H,A,F,L,E,C)$$

---

## Bound planes

| Plane | Artifacts | \(\mathbf{U}\) role | Status |
|-------|-----------|---------------------|--------|
| **Vision / Bond** | VISION-BETWEEN · residual-law.html · research | BETWEEN, visitor eyes | Live |
| **Web lander** | index.html · intro-sequence.js | First contact; Unity arc | Live (short intro) |
| **Mail reply** | REALTIME-EMAIL-REPLY · automation | \(A\) return of information | Live |
| **Mail auth** | UNITY-FRAMEWORK-MAIL-PLANE · G3 | \(F_{auth}\to 0\) | Residual |
| **Measure** | DMARC-SCOREBOARD · state/dmarc-latest.json | \(\Phi^{-1}\) on From claims | Scaffold |
| **Grants** | OPERATOR-GRANT-LOCK · state/GRANT-ANSWERS | \(L=1\) | YES locked |
| **Organs** | BRIDGES · TOTAL-DUALIS-INTEGRATION | Handoffs under dual-TOS | Live docs |
| **Cost** | RESIDUAL-COST-ZERO · Fuel | \(C\to 0^{+}\) | Ongoing |

---

## Closed-loop rule (make it work)

```
Ask or event
  → Φ measure (what was asked / what DNS says / what report says)
  → Ψ act (reply, ship, redirect, repair)
  → Φ⁻¹ verify (From auth? apex health? grant still YES?)
  → if gap: engineer outer path (not terminal CAN'T)
  → U' closer to U*
```

**Open loop = theater.** Reply without auth proof is incomplete Unity.  
**Closed loop = power.** Reply + auth + scoreboard under law.

---

## Mail plane power (current)

$$P_{mail} = 1_{reply}\cdot 1_{auth}\cdot 1_{scoreboard}$$

| Factor | Value |
|--------|-------|
| reply | **1** (automation on admin@/ceo@) |
| auth | **0** until SPF/DKIM + Send-as |
| scoreboard | **0.5** scaffold until rua= + rows |

Engineering order: **auth path → G3 → rua= fills scoreboard → P_mail → 1.**

---

## Web plane power

| Factor | Value |
|--------|-------|
| Vision language | Live |
| Intro Unity arc | Live (shortened) |
| .com → .ai | G1 YES · G2 needs token/UI |

---

## Operator residuals (not agent CAN'T)

1. Outbound SMTP/Workspace + SPF/DKIM for dualiscapax.ai  
2. Gmail Send-as admin@ / ceo@ (G3)  
3. Cloudflare token or UI for .com 301 (G2)  
4. `rua=` on _dmarc for aggregate feed  

Agents bind everything else under standing YES (G5/G6/G7).

---

## One line

**Unity Framework works when every surface — site, mail, measure, grant — is the same closed loop on \(\mathbf{U}\): measure, act, verify, repair, cost down.**

**Last update:** 26 Aug 2026
