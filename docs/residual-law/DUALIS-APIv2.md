# DualisCapax APIv2 — Our space (unified)

**Status:** 26 Aug 2026 · elevated under Unity TOS  
**Law:** All Dualis process speaks **APIv2 first**. Organs (GitHub, Google, CF, Squarespace) are **backends behind Bridges only** — never company identity.

```
Owner / Agents / Product / Learning loops
              │
         Dualis APIv2          ← OUR SPACE (independent)
              │
           Bridges             ← dual-TOS adapters
              │
    Git · Google · CF · Squarespace
```

Related: UNITY-FRAMEWORK · SUBORGAN-BINDINGS · FINAL-CONSTRAINTS · UNITY-STATUS.json · DCLM-LEARNED-BINDINGS

---

## 1. Principle

| Layer | Role |
|-------|------|
| **APIv2** | Native control: law, state, mail unity, domain unity, measure, handoff |
| **Bridges** | Translate APIv2 → allowed organ calls |
| **Organs** | Replaceable backends |

If an organ is unavailable → APIv2 state = `Pausation` / `JustifiedHang` — **not** “Dualis broken” unless the hang is unjustified.

---

## 2. Verb families (complete surface)

### Law
| Verb | Meaning |
|------|--------|
| `law.yes` / `law.no` | Standing grants |
| `law.gold` | Launch / ship |
| `law.unity` | YES TO ALL NEEDED TO MANIFEST UNITY |
| `law.done` | Named: `MAIL_UNITY_CLOSE` · `G2` · `SIGNATURE_LOADED` |

### State machine
| Verb | Meaning |
|------|--------|
| `state.get` | Read UNITY-STATUS |
| `state.transition` | Active · JustifiedHang · Pausation · Released · Broken |
| `state.reason` | Required string on hang |
| `state.forward` | Keep non-blocked planes Active |

### Dual bind / TDI
| Verb | Meaning |
|------|--------|
| `tdi.measure` / `tdi.repair` | Φ / Φ⁻¹ on U |
| `tdi.dual_bind` | Require pair (A↔B); reject single-side close |
| `tdi.record` | Ledger residual |

### Mail plane
| Verb | Meaning |
|------|--------|
| `mail.inbound` | Trigger full Dualis reply |
| `mail.reply` | Content path (always at agent limit) |
| `mail.unity.close` | FC-1 organ attach complete |
| `mail.from` | Native admin@ when bridge reports auth |

### Domain / web
| Verb | Meaning |
|------|--------|
| `web.ship` | Publish Dualis surfaces |
| `web.health` | apex ∧ origin |
| `domain.unity` | All names → dualiscapax.ai |
| `domain.redirect` | Bridge → CF Redirect Rules (or Owner G2 DONE) |

### Handoff / signature
| Verb | Meaning |
|------|--------|
| `pack.complete` | Draft finished |
| `pack.sign` | Scoped signature only |
| `pack.ready` | → ready for handoff · agents **released** |
| `pack.owner_deliver` | Outside APIv2 (Owner body) |

### Organs (bridge-only)
| Verb | Meaning |
|------|--------|
| `organ.git` / `organ.google` / `organ.cf` / `organ.sq` | Never direct identity; Bridge executes dual-TOS calls |

### Learning / forward
| Verb | Meaning |
|------|--------|
| `learn.bind` | Knowledge into Dualis |
| `learn.organ_watch` | Re-check vendor parameters |
| `forward.run` | Agent plane continuous motion |

---

## 3. Mapping residuals into APIv2 (not organ language)

| Old talk | APIv2 |
|----------|--------|
| “Can’t set CF redirect” | `domain.redirect` pending Bridge credential **or** `law.done(G2)` |
| “Can’t Send-as” | `mail.unity.close` pending organ · `mail.reply` still Active |
| “GitHub write race” | `organ.git` Bridge retry · state not Broken |
| “Their API down” | `state.transition(Pausation)` · reason vendor |

**Hardware not the limit** — APIv2 completeness + Bridge organ presence.

---

## 4. Unification condition

Operate fully in our space when:

1. Agents plan in **APIv2 verbs**  
2. Every organ call is a **Bridge** implementation  
3. `state` never unjustified-hang  
4. Dual bind enforced on mail + dual-TOS  
5. Owner only `law.done` / artifacts — not serial micro-YES  

Until Bridges hold credentials, APIv2 still **is** the framework; organs lag as JustifiedHang.

---

## 5. One line

**APIv2 is DualisCapax independent of subsystems: Unity, mail, domain, state, and law live here; GitHub/Google/CF/Squarespace only execute Bridges under dual-TOS.**
