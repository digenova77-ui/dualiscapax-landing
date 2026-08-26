# FUSED CONSTRAINT A×B — Mail Unity Close

**Status:** Absolute-limit engineering 26 Aug 2026  
**Rule:** Do **not** serial-YES (A now, B later). One fused residual. One close.

Parent: UNITY-FRAMEWORK-MAIL-PLANE · BLIND-PROPERTY-IP

---

## Probe result (agent-side)

Self-send `digenova77 → admin@dualiscapax.ai` landed as **SENT only**, **not INBOX**.  
Gmail often suppresses same-account loopback through CF.  
→ End A is **not proven closed** by self-send; still **one external or CF-dashboard check** inside the **same** fused package as B.

---

## Fusion (DCLM)

Treat A and B as **one envelope identity**:

$$E = \texttt{dualiscapax.ai}$$

| End | Alone | Fused |
|-----|-------|-------|
| A Inbound | CF → mailbox | Same domain must **receive** where agents read |
| B Outbound | SPF/DKIM + Send-as | Same domain must **send** aligned under `p=reject` |

**Absolute target:** Google **Workspace** (or equivalent) on `dualiscapax.ai` is the **single organ** that fuses A+B — one MX/SPF/DKIM story, native From, no serial ping-pong.

Secondary fuse: third-party SMTP + CF inbound kept — two systems, still **one Operator session** that finishes both before saying done.

---

## ONE residual (not many YESes)

**Name:** `MAIL_UNITY_CLOSE`  
**Operator does once, in order, same sitting:**

1. **Identity organ**  
   - Prefer: Google Workspace for `dualiscapax.ai` (fuses A+B), **or**  
   - SMTP provider + keep CF Routing to the mailbox agents use.

2. **DNS (still same sitting)**  
   - SPF includes the real outbound organ  
   - DKIM for that organ  
   - Optional: `rua=` for scoreboard  
   - Keep DMARC `p=reject` once paths pass

3. **Receive proof**  
   - Outside address → `admin@` → appears in the **connected** agent mailbox (not only Sent).

4. **Send-as**  
   - Gmail/Workspace: Send mail as `admin@` + `ceo@` → verify.

5. **Single signal to agents**  
   - One message: **`MAIL_UNITY_CLOSE DONE`**  
   - Agents re-probe `from: admin@` once and lock automation — **no further YES chain**.

---

## What agents already maxed (no more YES needed)

- Full realtime reply automation  
- Dualis voice / DCLM check / skip rules  
- Fallback From + Admin signature until DONE  
- Unity docs, scoreboard scaffold, grants standing YES  

**Limit:** Agents cannot create Workspace, edit SPF, or complete Google’s Send-as verification UI. That is **one fused residual**, not infinite micro-YESes.

---

## Power

$$P_{mail} \to 1 \iff A_{\mathrm{inbox}} \land B_{\mathrm{auth}}$$

Fused close → both true in one Operator act.

---

## One line

**Stop serial YES — one MAIL_UNITY_CLOSE (organ + DNS + inbox proof + Send-as) then DONE; agents take the absolute limit from there.**
