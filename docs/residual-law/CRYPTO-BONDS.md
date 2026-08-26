# CRYPTO BONDS — Dualis engineering law

**Status:** 26 Aug 2026 · dual-TOS  
**Thesis:** Unity binds entities with **cryptographic and protocol bonds**. We do not merge platform TOS; we close alignment.

---

## 1. Two bond planes (do not conflate)

| Plane | Primitives | Purpose |
|-------|------------|--------|
| **Mail identity** | SPF · **RSA DKIM** (provider) · DMARC alignment | From: dualiscapax.ai under p=reject |
| **Dualis-owned artifacts** | **Ed25519** sign/verify · optional X25519 for session secrecy | Packs, receipts, APIv2 evidence |

Mail path stays **Workspace/SMTP + DNS**.  
Ed25519 does **not** replace Google DKIM unless an organ explicitly supports EdDSA DKIM (rare).

---

## 2. Mail bond chain (F1)

```text
Organ (Workspace|SMTP)
  → SPF include organ
  → DKIM d=dualiscapax.ai (RSA, selector in DNS)
  → strict DMARC alignment (adkim=s, aspf=s)
  → MAIL_UNITY_CLOSE DONE
```

Today: SPF=CF only · **no** DKIM selector · MX=CF Routing · **bond open**.

---

## 3. Artifact bond chain (Dualis IP)

```text
seed (Owner secret boundary)
  → Ed25519 keygen (clamp via library)
  → public verify material in realm (not wet-ink signature image)
  → sign(pack_hash) → receipt
  → verify before ready-for-handoff release optional
```

| Rule | Detail |
|------|--------|
| Seed never in public Pages/git | Secret manager / Owner vault |
| Deterministic EdDSA | No sign-time RNG for nonce |
| Rotate with overlap | New key published before old retired |
| Dual-TOS | Platform keys stay in organs; Dualis seeds stay Dualis |

---

## 4. APIv2 verbs (crypto)

| Verb | Meaning |
|------|--------|
| `crypto.mail_status` | Probe SPF/DKIM/DMARC DNS |
| `crypto.artifact_sign` | Ed25519 over payload hash |
| `crypto.artifact_verify` | Verify Dualis receipt |
| `crypto.bond_map` | List required bonds for Unity |

---

## 5. One line

**Cryptographic bonds: RSA-DKIM+SPF+DMARC for mail entities; Ed25519 for Dualis-owned artifacts—same Unity, different primitives.**
