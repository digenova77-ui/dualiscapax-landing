# Agent Iris: Bare-Metal C/Rust Invariant Runtime & WASM Engine Specification

**Document Control ID:** `ED-SPEC-20260901-IRIS-BARE-METAL-RUNTIME-V1`  
**Classification:** CANONICAL BARE-METAL SYSTEMS ENGINEERING SPECIFICATION  
**Status:** SEALED · CANONICAL SPECIFICATION · SYSTEM OF RECORD  
**Operating Entity:** DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7)  
**Author & System Architect:** David John Di Genova (DualisCapax / residual IP · ORCID: [0009-0005-6291-8508](https://orcid.org/0009-0005-6291-8508))  
**Governance Framework:** Dualis & Unity Framework (v0.40-Public) / DCLM Layer [0] Law Floor / DCCP Conserved Plane  
**Target Repository Path:** `encyclopedia/ai_systems_internal/agent_iris_bare_metal_c_rust_invariant_runtime_spec.md`  
**Live Surface:** <https://dualiscapax.ai>  

---

## 1. Architectural Philosophy: Zero-Overhead Deterministic Execution

To eliminate garbage collection pauses, memory leaks, and runtime nondeterminism, the core execution spine of Agent Iris is implemented in zero-dependency, bare-metal C99 / Rust compiled to native machine code and WebAssembly (WASM).

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│             AGENT IRIS BARE-METAL SYMPLECTIC RUNTIME PIPELINE (C99/RUST)         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [ INGRESS TRANSACTION / WORKLOAD ] ──► API V2 Sleeve Parser (Zero Allocation)   │
│                                              │                                   │
│                                              ▼                                   │
│  [ INVARIANT M-S HARDWARE TIMER ]    ──► POSIX CLOCK_MONOTONIC (<4.20 ms SLA)    │
│                                              │                                   │
│                                              ▼                                   │
│  [ SYMPLECTIC INTEGRATOR ]           ──► Störmer-Verlet Step: det(M) == 1.000000 │
│                                              │                                   │
│                                              ▼                                   │
│  [ THERMODYNAMIC MEMORY CLEANUP ]    ──► Landauer Zeroization: Q >= k_B*T*ln(2)  │
│                                              │                                   │
│                                              ▼                                   │
│  [ ATTESTED STATE COMMIT ]           ──► Sub-Microsecond Exit (<0.20 μs Mean)    │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Formal Memory & Safety Guarantees

1. **Zero Dynamic Allocation in Critical Loops:** All scratchpads, state vectors, and telemetry buffers are pre-allocated statically or on the stack, eliminating heap fragmentation and GC jitter.
2. **Volatile Pointer Zeroization:** Memory scrubbers use volatile pointer barriers (`volatile uint8_t *`) to prevent compiler dead-code elimination from optimizing away memory wipes.
3. **Exact Symplectic Preservation:** Symplectic matrix determinant $\det(\mathbf{M}) = (m_{11}m_{22}) - (m_{12}m_{21}) \equiv 1.000000000000000$ mathematically guaranteed under IEEE-754 double precision.
