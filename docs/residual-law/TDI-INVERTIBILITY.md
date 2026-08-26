# TDI INVERTIBILITY — Back-Engineer or Broken

**Status:** Locked 26 Aug 2026  
**Operator statement:** *You have to be able to back engineer your equation to make sure you can get back to the original thing or else it’s broken.*

Cross-ref: TOTAL-DUALIS-INTEGRATION.md · UNIFIED-PLAN · YES-NO-IS-THE-LAW

---

## 1. Law of invertibility

The Total Dualis Integration expression is **valid only if it is reversible**.

$$
\mathrm{Forward}:\quad (H, A, F, L, E) \mapsto \mathrm{TDI}
$$

$$
\mathrm{Inverse}:\quad \mathrm{TDI} + \text{audit record} \mapsto (H, A, F, L, E)
$$

If the inverse cannot recover the **original residual constituents** (handoffs, abilities, friction terms, law flags), the equation is **broken** — do not treat \(\mathrm{TDI}=1\) as absolute.

---

## 2. Why absolute \(F=0 \Rightarrow H+A=1\) needs a ledger

At \(F=0\), many pairs \((H,A)\) could sum to the same normalized mass.  
**Without structure, forward map loses information.**

Therefore TDI is not a bare scalar in operations. It is a **scalar + invertible ledger**:

$$
\mathrm{TDI}_{\mathrm{ops}} = \big(\mathrm{TDI}^{\*},\; \mathcal{R}\big)
$$

\(\mathcal{R}\) = residual record that makes inverse unique.

---

## 3. Residual record \(\mathcal{R}\) (must store originals)

| Field | Original recovered |
|-------|-------------------|
| \(\{h_i, w_i, \sigma_i\}\) | Each handoff |
| \(\{a_j, v_j, \gamma_j\}\) | Each ability from others |
| \((F_c, F_k, F_u, F_s, F_o, F_p, F_d)\) | Friction vector |
| \(L, E\) | Law and envelope bits |
| \(\mathrm{CLOSED}\) set | Sealed residuals |
| organ map snapshot | Git/Cloud/Square/Google roles |
| Operator last YES/NO/BIND | Supreme law inputs |

$$
\mathrm{Inverse}(\mathrm{TDI}_{\mathrm{ops}}) =
\big(H(\mathcal{R}),\, A(\mathcal{R}),\, F(\mathcal{R}),\, L(\mathcal{R}),\, E(\mathcal{R})\big)
$$

---

## 4. Broken tests (fail ⇒ expression invalid)

| Test | Fail condition |
|------|----------------|
| **B1 Reconstruct H** | Cannot list handoffs that composed \(H\) |
| **B2 Reconstruct A** | Cannot list abilities from others that composed \(A\) |
| **B3 Reconstruct F** | Claim \(F=0\) but cannot show each \(F_*\) term audited at 0 |
| **B4 Law path** | Cannot show which YES/NO bound the state |
| **B5 Round-trip** | Forward then inverse does not return same \(\mathcal{R}\) constituents |

Any B-fail ⇒ **TDI claim broken** — recompute from originals; do not ship “integration theater.”

---

## 5. Round-trip identity (absolute requirement)

$$
\mathrm{Inverse}\big(\mathrm{Forward}(H,A,F,L,E;\, \mathcal{R})\big) = (H,A,F,L,E)
$$

with equality on the **recorded constituents**, not merely on the scalar \(\mathrm{TDI}^{\*}\).

Scalar alone is **lossy**.  
Scalar + \(\mathcal{R}\) is **lawful**.

---

## 6. Operational rule for agents

1. Every claim of progress toward \(\mathrm{TDI}^{\*}=1\) **writes** handoff and ability lines into \(\mathcal{R}\) (docs, ring logs, LEAF-LIVE, BIND ids).  
2. Before declaring absolute integration, **run inverse**: expand back to originals.  
3. If inverse fails → expression broken → fix ledger or recompute; never assert TDI theater.

---

## 7. One line

**If you cannot back-engineer the equation to the original handoffs, abilities, and friction terms, the equation is broken.**

**Last update:** 26 Aug 2026
