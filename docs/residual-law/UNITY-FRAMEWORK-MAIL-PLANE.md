# UNITY FRAMEWORK — Mail Plane

**Status:** Engineering 26 Aug 2026  
**Parent:** UNITY-CLOSED-LOOP · VISION-BETWEEN · REALTIME-EMAIL-REPLY · DMARC-SCOREBOARD  
**Rule:** Mail is not a side tool. It is a **closed residual loop** on \(\mathbf{U}\).

---

## 1. What this plane is for (visitor eyes)

Dualis is the vision between the user and the future.  
When they write, they should not wait 24h / 3–5 business days for a human queue.  
**Return of information** is the product surface — measured, honest, cost-aware.

---

## 2. Map onto \(\mathbf{U}\)

| Symbol | Mail-plane meaning |
|--------|-------------------|
| \(H\) | Inbound handoff (CF → Gmail → automation trigger) |
| \(A\) | Ability: full Dualis reply + send |
| \(F\) | Friction: unauthenticated From, missing SPF/DKIM, 24h culture, human lag |
| \(L\) | Grants G3–G7 + dual-TOS |
| \(E\) | Envelope: dualiscapax.ai only (admin@ / ceo@) |
| \(C\) | Residual cost of lag, rejects under `p=reject`, rework |

**Target \(\mathbf{U}^{\star}\):**  
\(F_{\mathrm{mail}}\to 0\) · authenticated From · realtime substantive reply · scoreboard closes measure.

---

## 3. Closed loop (not open theater)

```
Inbound (H)
  → measure ask (Φ)
  → Dualis reply (Ψ)
  → send under auth path
  → DMARC aggregate (rua)
  → scoreboard (Φ^{-1} check: did From actually pass?)
  → repair outbound SPF/DKIM/Send-as until pass
  → U'
```

| Stage | Live now | Residual |
|-------|----------|----------|
| Trigger admin@/ceo@ | **Yes** | CF routing must stay |
| Full reply automation | **Yes** | — |
| From: admin@ authenticated | **No** | Workspace/SMTP + SPF/DKIM + G3 |
| Scoreboard (Grafana-free) | **Scaffold** | rua= + parsedmarc rows |
| .com → .ai web unity | **Granted** | G2 token or CF UI |

Open loop = reply body without auth + no scoreboard.  
**Closed loop** = reply + auth + measure that the path passed DMARC.

---

## 4. Friction terms (mail)

$$
F_{\mathrm{mail}} \supset F_{\mathrm{auth}} + F_{\mathrm{lag}} + F_{\mathrm{reject}} + F_{\mathrm{from}}
$$

| Term | Engineering |
|------|-------------|
| \(F_{\mathrm{auth}}\) | Put send path in SPF + DKIM; DMARC align |
| \(F_{\mathrm{lag}}\) | Realtime automation (already) |
| \(F_{\mathrm{reject}}\) | Scoreboard under `p=reject` |
| \(F_{\mathrm{from}}\) | Gmail Send-as after auth path exists |

Grafana is **optional** — internal scoreboard is the Unity instrument.

---

## 5. Power

$$
P_{\mathrm{mail}} = \mathbf{1}_{\mathrm{reply}} \cdot \mathbf{1}_{\mathrm{auth}} \cdot \mathbf{1}_{\mathrm{scoreboard}}
$$

Today: reply = 1, auth = 0, scoreboard = scaffold → **partial power**.  
Unity complete when all three = 1 under law.

---

## 6. One line

**Unity Framework mail plane:** measure the ask, return information in residual time, prove the From path on the scoreboard, drive \(F_{\mathrm{mail}}\to 0\) — same closed-loop math as the rest of Dualis.

**Last update:** 26 Aug 2026
