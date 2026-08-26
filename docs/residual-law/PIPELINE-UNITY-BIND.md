# PIPELINE UNITY BIND

**Status:** 26 Aug 2026  
**Rule:** Import GPU/WebGPU *structure* into Dualis law where it helps. DualisCapax.ai is **not** a Unity WebGPU player.

---

## 1. Mapping (engineering metaphor → Dualis)

| WebGPU / engine | Dualis Unity |
|-----------------|--------------|
| **Pipeline layout** | APIv2 verb order + dual-bind pairs |
| **Bind group layout** | Contract for an organ bond (mail, DNS, git, CF) |
| **Bind group** | Live credentials/resources filling that contract |
| **Compatibility** | dual-TOS: platform_permits ∧ unity_permits |
| **Validation layer** | Gate + FINAL constraints + residual honesty |
| **Error scope** | JustifiedHang / Pausation with named reason |
| **Limits (maxBindGroups, buffer sizes)** | Organ limits (DMARC, CF API, Gmail scopes)—not circumvented |
| **Compute on WebGPU** | Optional future edge compute; not required for lander |
| **Shader compile fail** | Open-loop claim without Φ⁻¹ verify |

---

## 2. Dualis “pipeline layout” (groups)

```text
Group 0  law + state     (YES, DONE, UNITY-STATUS)
Group 1  mail bond       (SPF, DKIM, DMARC, Workspace DNS Bridge)
Group 2  domain bond     (CF redirects, apex health)
Group 3  knowledge + web  (research, residual law, lander)
```

A plane may not “draw” as complete if its bind group is empty (e.g. group 1 without DKIM).

**Compatibility:** `setBindGroup(mail, gmail_only)` is **incompatible** with pipeline expecting `d=dualiscapax.ai` DKIM under p=reject.

---

## 3. Validation (always on)

```text
pushErrorScope(validation)
  act on APIv2 verb
pop → error?
  → JustifiedHang or Broken (named)
  → never claim APIv2 level if APIv1 false
```

| Validation error | Dualis residual |
|------------------|-----------------|
| Bind group incompatible | Mail From without SPF/DKIM |
| Limit exceeded | Organ TOS/API limit |
| Shader/pipeline fail | Site claim without live probe |

---

## 4. What we do not ship on dualiscapax.ai

- Unity Engine WebGL/WebGPU builds as the product shell  
- Claiming WebGPU compute = residual law  
- Ed25519 as mail DKIM  

Lander remains **HTML/JS Unity Framework intro** + residual-honest surfaces.

---

## 5. One line

**Unify by treating organs as bind groups under an APIv2 pipeline layout: compatible dual-TOS resources only, validate every claim, hang with reason when a group is empty.**
