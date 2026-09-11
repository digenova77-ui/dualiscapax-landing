# DualisCapax: Agent Iris Dual-Loop Runtime Engine & Evaluation Manual


Document Control ID: ED-MAN-20260901-IRIS-RUNTIME-EVAL-V1
Classification: TECHNICAL RUNTIME MANUAL & FORMAL EVALUATION HARNESS
Status: SEALED · PRODUCTION MANUAL · SYSTEM OF RECORD
Operating Entity: DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7)
Author & System Architect: David John Di Genova (DualisCapax / residual IP · ORCID: [0009-0005-6291-8508](https://orcid.org/0009-0005-6291-8508))
Target Repository Path: encyclopedia/ai_systems_internal/dclm_iris_runtime_and_evaluation_manual.md
Live Surface: https://dualiscapax.ai


-----


## 1. System Architecture: Dual-Loop Deterministic Execution


The Iris Runtime Engine (`iris_runtime_core.py`) bridges probabilistic neural language models with deterministic, zero-hallucination verification. Every execution follows a strict multi-stage pipeline:


```
+----------------------------------------------------------------------------------------------------+
|                         IRIS DUAL-LOOP STATE TRANSITION PIPELINE                                   |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ Ingress Prompt ] ──► [ Intent & Register Classifier ] ──► [ Fast Apprentice Generator ]         |
|                                                                       │                            |
|                                                                       ▼                            |
|  [ D1 Ledger Attestation ] ◄── [ Invariant M-S Watchdog ] ◄── [ Socratic Master Critic ]           |
|            │                               (Latency < 4.20ms)         │                            |
|            ▼                                                          ▼                            |
|  [ 5-Layer Spatial HUD ]                                    [ Ground Truth Checked ]               |
|  (Live Phase-Space State)                                   (Reff <= 4.18e-13)                     |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```


### Core Execution Modules:


1. **`CognitiveRegisterCalibrator`**:
   * Analyzes linguistic entropy and domain-specific terminology in real time.
   * Dynamically assigns the execution register across 5 distinct tiers (Grade 1–5 foundational analogies up to Tier 5 Post-Doctoral Hamiltonian derivations).


2. **`DCLMLawFloor` Audit Layer**:
   * Evaluates generated outputs against the non-negotiable Layer [0] Invariants (`NO_FORCE`, `HOST_SAFE`, `CLEANUP_FIRST`, `TRUTH_OR_NOTHING`).
   * Automatically scrubs unverified claims, predatory locks, or hallucinated guarantees before user delivery.


3. **`Invariant M-S Watchdog`**:
   * Measures pipeline execution overhead with microsecond precision.
   * Enforces sub-$4.20\text{ ms}$ fail-closed decoupling to prevent latency drift or unconstrained execution loops.


-----


## 2. Dynamic Cognitive Register Calibration Standards


| Register Tier | Audience & Intent | Pedagogical Tone | Invariant Bounds |
| :--- | :--- | :--- | :--- |
| **Tier 1: Foundational (Grades 1–5)** | Broad Public & Youth | Physical world metaphors (water pipes, clocks, balance scales). | Zero technical jargon; 100% conceptual truth. |
| **Tier 2: Systems Logic (Grades 6–12)** | Operational Learners | Sequential cause-and-effect systems flow. | Clear step-by-step logic trees. |
| **Tier 3: Technical Core (Undergrad)** | Developers & Analysts | Formal API definitions, data schemas, and benchmarks. | Validated code and JSON schemas. |
| **Tier 4: Enterprise Architecture (Master)** | CTOs & System Architects | Concurrency budgets, SIMD vectorization, and failover topologies. | Sub-millisecond latency & zero-copy memory paths. |
| **Tier 5: Symplectic Rigor (Post-Doc)** | Research Scientists | Hamiltonian manifolds, Lyapunov stability, Volterra-Laguerre equations. | Formally bounded residual drag ($R_{\text{eff}} \le 4.18 \times 10^{-13}$). |


-----


## 3. Evaluation & Benchmark Harness Specification


To measure Agent Iris against industry benchmarks, the runtime integrates a continuous 100-DAG evaluation harness:


* **Evaluation Metric 1: Zero-Hallucination Rate ($Z_{\text{fact}}$)**: Must maintain $\ge 99.98\%$ factual precision against verified ground-truth repositories.
* **Evaluation Metric 2: Autonomous Error Recovery ($R_{\text{heal}}$)**: Must self-heal from API rate limits, Git branch lock conflicts, and schema mismatches $\ge 98.5\%$ of the time without human intervention.
* **Evaluation Metric 3: Register Calibration Accuracy ($C_{\text{reg}}$)**: Proper alignment between detected user intent and emitted cognitive tier $\ge 99.0\%$.
* **Evaluation Metric 4: Latency Compliance ($L_{\text{bound}}$)**: $\le 4.20\text{ ms}$ for local deterministic checks; sub-second streaming for foundation model calls.


-----


## 4. Production Integration Checklist


1. **Worker Deployment**: Ensure `workers/iris-gateway` on Cloudflare imports `iris_runtime_core.py` logic.
2. **Telemetry Binding**: Connect the live status readout on `index.html` to the runtime's $R_{\text{eff}}$ and NTP synchronization clocks.
3. **Database Schema**: Record all validated transaction receipts in the Cloudflare D1 ledger under `dualiscapax-fulfillments`.


-----
*Sealed into the DualisCapax System of Record.*
