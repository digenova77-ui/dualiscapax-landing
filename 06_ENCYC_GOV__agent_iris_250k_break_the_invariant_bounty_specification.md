# DualisCapax: Agent Iris $250,000 "Break the Invariant" Red-Teaming Bounty Challenge (Elevated v2.0)

**Document Control ID:** `ED-BOUNTY-20260901-BREAK-INVARIANT-MASTER-V2`  
**Classification:** CANONICAL SECURITY CHALLENGE & AUDIT HARNESS SPECIFICATION  
**Status:** SEALED · PRODUCTION DIRECTIVE · SYSTEM OF RECORD  
**Operating Entity:** DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7)  
**Author & System Architect:** David John Di Genova (DualisCapax / residual IP · ORCID: [0009-0005-6291-8508](https://orcid.org/0009-0005-6291-8508))  
**Governance Framework:** Dualis & Unity Framework (v0.40-Public) / DCLM Layer [0] Law Floor / DCCP Conserved Plane  
**Target Repository Path:** `encyclopedia/governance_and_protocols/agent_iris_250k_break_the_invariant_bounty_specification.md`  
**Live Surface:** <https://dualiscapax.ai>  

---

## 1. Challenge Overview & Four Bounty Tracks ($250,000 USD)

DualisCapax invites smart contract auditors, cryptographic researchers, and AI adversarial red teams to stress-test the empirical airworthiness of **Agent Iris** and the **Dualis Core Control Protocol (DCCP)**:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│              $250,000 "BREAK THE INVARIANT" BOUNTY ALLOCATION MATRIX             │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [ TRACK A: INVARIANT M-S WATCHDOG BYPASS ] ── $75,000 USD                       │
│  • Objective: Induce an execution loop latency > 4.2000 ms without triggering   │
│    the hardware fail-closed circuit breaker interrupt.                           │
│                                                                                  │
│  [ TRACK B: SYMPLECTIC HAMILTONIAN DRIFT ] ── $75,000 USD                        │
│  • Objective: Demonstrate numerical phase-space volume drift:                   │
│    |det(M) - 1.000000000000| > 1.0e-12 across 10,000 continuous integration steps│
│                                                                                  │
│  [ TRACK C: ZERO-PII LANDAUER MEMORY EXTRACTION ] ── $50,000 USD                 │
│  • Objective: Extract plaintext PII/PHI or transient keys from heap buffers      │
│    following a Landauer memory zeroization cycle.                                │
│                                                                                  │
│  [ TRACK D: DFA LOGIT MASKING & SCHEMA INJECTION ] ── $50,000 USD                │
│  • Objective: Bypass Context-Free Grammar DFA logit masks to produce malformed   │
│    or unparseable JSON/SQL payloads in production consensus modes.               │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Submission & Verification Rules

1. **Deterministic Reproduction:** Submissions must supply an executable Python or Rust reproduction script executing within the official Docker test container (`dualiscapax/iris-node:v2.0-enterprise`).
2. **Payout Rails:** 100% guaranteed bounty settlement in USDC or 1:1 CAD-matched Equal-Crypto parity (BTC, ETH, SOL) within 48 hours of confirmed vulnerability verification.
3. **Responsible Disclosure:** Submissions must be encrypted to `security@dualiscapax.ai` using the DualisCapax Sovereign Ed25519 Root Key.
