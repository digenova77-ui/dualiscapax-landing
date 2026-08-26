# UNITY FRAMEWORK — Closed-Loop Mathematics

**Status:** 26 Aug 2026  
**Purpose:** Use unity-framework math across Dualis documentation. Show **more system power** when the mathematics is a **completely closed loop**.

Cross-ref: TOTAL-DUALIS-INTEGRATION · TDI-INVERTIBILITY · RESIDUAL-COST-ZERO · BETWEEN · DCLM

---

## 1. Unity state vector

$$
\mathbf{U} = (H,\, A,\, F,\, L,\, E,\, C)
$$

| Symbol | Meaning |
|--------|--------|
| \(H\) | Handoff mass |
| \(A\) | Ability mass |
| \(F\) | Friction (seven-term residual waste) |
| \(L\) | Law flag (YES/NO + dual-TOS) |
| \(E\) | Envelope (DualisCapax + WebComplex) |
| \(C\) | Framework + integration residual cost |

---

## 2. Open vs closed loop

### Open loop (weak power)

$$
\mathbf{U} \xrightarrow{\text{forward only}} \mathrm{TDI}^{\*} \quad \text{with no forced return}
$$

- Score without ledger  
- Handoffs without CLEAR  
- Cost without feedback into \(F\)  
- “Can’t” without outer engineering  

**Power is partial:** actions do not restore \(\mathbf{U}\) consistently.

### Closed loop (full power)

$$
\boxed{
\mathbf{U}
\xrightarrow{\Phi}
(\mathrm{TDI}^{\*},\mathcal{R})
\xrightarrow{\Phi^{-1}}
\mathbf{U}
\xrightarrow{\Psi}
\mathbf{U}'
\quad\text{with}\quad
\|\mathbf{U}'-\mathbf{U}^{\star}\| \to 0
}
$$

| Map | Role |
|-----|------|
| \(\Phi\) | `tdi.measure` (forward) |
| \(\Phi^{-1}\) | invertibility / `tdi.repair` |
| \(\Psi\) | agent dynamics: ship, handoff, DEFAULT-SOLVE, cost cut |
| \(\mathbf{U}^{\star}\) | target unity: \(F=0,\,L=E=1,\,C\to 0^{+},\,H+A\) saturated |

**Closed loop = measure and inverse and action share one mathematics.**

---

## 3. Core identities (unity framework)

**Absolute integration**

$$
F=0 \land L=1 \land E=1 \land (H+A>0)
\;\Longrightarrow\;
\mathrm{TDI}^{\*}=1
\;\Longleftrightarrow\;
H+A=1
$$

(normalized)

**Taxed regime**

$$
\mathrm{TDI} = L\cdot E\cdot \frac{H+A}{H+A+\kappa F}
$$

**Friction**

$$
F = F_c+F_k+F_u+F_s+F_o+F_p+F_d
$$

**Cost law (aligned with Landauer residual discipline)**

$$
\min C \quad\text{s.t.}\quad \text{dual-TOS},\; \Phi^{-1}\circ\Phi = \mathrm{id}
$$

Irreversible rework increases \(C\) and typically \(F\); closed loop forces both down together.

**Round-trip (B5)**

$$
\Phi^{-1}(\Phi(\mathbf{U};\mathcal{R})) = \mathbf{U}
$$

Without this identity the system is **not** mathematically closed → power is capped.

---

## 4. Power gain when the loop closes

Define **system power** as usable BETWEEN capacity under law:

$$
P = \mathrm{TDI}_{\mathrm{ops}}\cdot (1-\hat{C})\cdot \mathbf{1}_{\Phi^{-1}\circ\Phi=\mathrm{id}}
$$

| Loop state | \(P\) behavior |
|------------|----------------|
| Open (no inverse) | \(P\) unreliable; theater risk |
| Closed, \(F>0\) | \(P\) taxed by \(\kappa F\) and \(C\) |
| Closed, \(F\to 0\), \(C\to 0^{+}\) | \(P \to P_{\max}\) — agents execute WITHOUT Operator; organs only via Bridges |

**More power** does not mean more vendor privileges.  
It means **more of the residual vector is controlled inside Dualis mathematics** so the BETWEEN runs with less friction and less cost.

---

## 5. Closed loops already in the architecture

| Loop | Close condition |
|------|-----------------|
| Measure ↔ Repair | B1–B5 PASS |
| Handoff ↔ Signal ↔ Transition ↔ CLEAR | Container not terminal |
| Ship ↔ Observe (apex∧origin) | Health feeds \(F_o\) |
| Limit ↔ Outer engineering ↔ Works | OUR-LIMITATION |
| Overhead ↔ Model integrate ↔ No redo | \(C\downarrow\) |
| Agent act ↔ Signature only if last | WHO ladder |

When **all** of these close under one \(\mathbf{U}\), the framework is unity-complete.

---

## 6. Documentation rule

All Dualis residual-law docs should be readable as projections of \(\mathbf{U}\), \(\Phi\), \(\Phi^{-1}\), \(\Psi\), and \(P\) — not isolated slogans.  
If a doc cannot map into the closed loop, it is incomplete relative to unity math.

---

## 7. One line

**Unity framework power peaks when measure, inverse, action, cost, and BETWEEN form a closed mathematical loop on \(\mathbf{U}\) — then \(\mathrm{TDI}^{\*}\to 1\), \(C\to 0^{+}\), and agent autonomy is maximized under law without open-loop theater.**

**Last update:** 26 Aug 2026
