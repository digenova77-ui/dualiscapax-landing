# Agent Iris: Self-Learning Architecture & Verification-Driven Distillation Specification
Document Control ID: ED-SPEC-20260831-IRIS-SELF-LEARNING-V1
Classification: CORE INTERNAL SYSTEM SPECIFICATION & R&D BLUEPRINT
Status: PROPOSED · ACTIVE TARGET SPECIFICATION · SYSTEM OF RECORD
Operating Entity: DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7)
Author & System Architect: David John Di Genova (DualisCapax / residual IP · ORCID: 0009-0005-6291-8508)
Target Repository Path: encyclopedia/ai_systems_internal/agent_iris_self_learning_architecture_spec.md
Live Surface: https://dualiscapax.ai


________________


⚠️ Operational Status & Implementation Notice
Notice: This document defines the formal learning, evaluation, and distillation specification for Agent Iris. These mechanisms represent target engineering standards designed to guarantee that autonomous recursive learning occurs strictly under deterministic verification, preventing model drift, toxic feedback loops, and unverified data contamination.


________________


1. Architectural Thesis: The Verifiable Learning Imperative
Standard machine learning post-training frequently relies on unconstrained human feedback (RLHF) or raw conversational harvesting. In mission-critical autonomous systems, unverified feedback introduces fatal vulnerabilities: hallucinations, catastrophic forgetting, and reinforcement of subtle reasoning errors.


The Agent Iris Learning Framework establishes a closed-loop, self-improving training architecture governed by Execution-Based Verifiable Rewards (RLVR), Eval-Driven Development (EDD), Step-Level Process Supervision (PRM), and Episodic Failure Graphs (Reflexion).


+----------------------------------------------------------------------------------------------------+


|                         AGENT IRIS CLOSED-LOOP SELF-IMPROVEMENT PIPELINE                           |


+----------------------------------------------------------------------------------------------------+


|                                                                                                    |


|    [ Ingress Query / Task ]                                                                        |


|                │                                                                                   |


|                ▼                                                                                   |


|    ┌─────────────────────────────────────────────────────────────┐                                 |


|    │  COGNITIVE ARBITER (Dynamic Test-Time Compute Allocation)   │                                 |


|    │  - Evaluates Entropy (U), Complexity (C), Risk (R)          │                                 |


|    └────────────────────────────┬────────────────────────────────┘                                 |


|                                 │                                                                  |


|                ┌────────────────┴────────────────┐                                                 |


|                ▼ (Low Compute)                   ▼ (High Compute)                                  |


|    ┌────────────────────────┐       ┌────────────────────────┐                                     |


|    │  SYSTEM 1 (REACTIVE)   │       │ SYSTEM 2 (DELIBERATIVE)│                                     |


|    │  - Internal Fast MoE   │       │ - Multi-Model Broker   │                                     |


|    │  - Sub-45ms Inference  │       │   (Grok, Gemini, Claude)│                                    |


|    │                        │       │ - MCTS / DAG Planning  │                                     |


|    └───────────┬────────────┘       └────────────┬───────────┘                                     |


|                │                                 │                                                 |


|                └────────────────┬────────────────┘                                                 |


|                                 ▼                                                                  |


|    ┌─────────────────────────────────────────────────────────────┐                                 |


|    │  DETERMINISTIC INVARIANT & WASM EXECUTION SANDBOX           │                                 |


|    │  - Step-Level Process Reward Model (PRM) Auditing           │                                 |


|    │  - Context-Free Grammar (CFG) Schema Clamping               │                                 |


|    │  - DCLM Layer [0] Law Floor Invariant Checking              │                                 |


|    └────────────────────────────┬────────────────────────────────┘                                 |


|                                 │                                                                  |


|                ┌────────────────┴────────────────┐                                                 |


|                ▼ (Verification = PASS)           ▼ (Verification = FAIL)                           |


|    ┌─────────────────────────────────┐ ┌─────────────────────────────────┐                         |


|    │     GOLDEN DATASET LEDGER       │ │      NEGATIVE FAILURE GRAPH     │                         |


|    │  - Cryptographic Trace Hash     │ │  - Anti-Pattern Serialization   │                         |


|    │  - Stored: training_corpora/    │ │  - Stored: failure_graphs/      │                         |


|    │  - Staged for SFT / Distillation│ │  - Real-Time Mistake Prevention │                         |


|    └────────────────┬────────────────┘ └─────────────────────────────────┘                         |


|                     │                                                                              |


|                     ▼                                                                              |


|    ┌─────────────────────────────────────────────────────────────┐                                 |


|    │  AUTONOMOUS DISTILLATION & SOVEREIGN FINE-TUNING            │                                 |


|    │  - User Gateway Revenue automatically recharges compute     │                                 |


|    │  - Periodic LoRA/SFT distillation into internal MoE weights │                                 |


|    │  - CI/CD Eval-Driven Development (EDD) Regression Gate      │                                 |


|    └─────────────────────────────────────────────────────────────┘                                 |


|                                                                                                    |


+----------------------------------------------------------------------------------------------------+


________________


2. The Five Foundational Engineering Pillars
Pillar 1: Reinforcement Learning via Verifiable Rewards (RLVR)
To ensure Agent Iris never learns from hallucinated data or faulty reasoning, candidate traces must satisfy formal, objective ground-truth conditions:


* Computational Verification: Code execution must terminate with exit_code == 0 in an isolated WebAssembly (WASM) sandbox.
* Invariant Conformance: State balance equations must satisfy conservation laws ($\Delta \text{State} == 0$, Cash >= Floor).
* Schema Integrity: Generated outputs must conform to static JSON Schema / EBNF definitions on first pass with zero parsing exceptions.


Only traces that achieve a 100% Verifier Score are appended to the Golden Training Corpus (encyclopedia/training_corpora/golden/).
Pillar 2: Eval-Driven Development (EDD) & CI/CD Regression Gates
Model updates, prompt revisions, and fine-tuned weights are governed by an automated 100-Benchmark Evaluation Suite:


* Test Matrix Composition: 40 Multi-variable Constraint Satisfaction problems, 30 Tool Ingress/Egress tests, 20 Adversarial Injection/Jailbreak attempts, and 10 Mathematical State Rollback tests.
* Fail-Closed Gatekeeper: Integrated directly into .github/workflows/security.yml. If any commit causes the benchmark pass rate to drop below $98.0%$, the pull request is rejected fail-closed and cannot deploy to dualiscapax.ai.
Pillar 3: Step-Level Process Reward Supervision (PRM)
Rather than scoring only the final answer (Outcome Reward Model), Iris audits each node in the execution DAG independently:


$$\text{Score}(\text{DAG}) = \prod_{i=1}^N \text{PRM}(\text{Node}i | \text{Context}{<i})$$


If $\text{PRM}(\text{Node}k) < \gamma{\text{threshold}}$, execution immediately pauses at step $k$, rewinds the ephemeral memory buffer, and re-executes step $k$ locally in $<15\text{ ms}$ before state corruption cascades.
Pillar 4: Negative-Trace Memory & Anti-Pattern Reflexion
When an invariant violation or tool execution failure occurs:


1. The error signature is mapped to an Anti-Pattern Descriptor: [FailedTool, BadArgumentType, ViolatedInvariant, EnvironmentContext].
2. The Anti-Pattern is serialized into the Episodic Failure Graph (encyclopedia/failure_graphs/anti_patterns.json).
3. The Cognitive Arbiter checks incoming query embeddings against the Failure Graph using cosine similarity: $$\text{RiskPenalty} = \max_{j} \text{Sim}\left(\mathbf{e}{\text{query}}, \mathbf{e}{\text{failure}_j}\right)$$ If $\text{RiskPenalty} > 0.85$, Iris dynamically enforces strict defensive constraints, preventing her from repeating historical errors.
Pillar 5: Dynamic Test-Time Compute Allocation
The Cognitive Arbiter computes an adaptive compute budget based on epistemic uncertainty $\mathcal{U}$ and operational risk $\mathcal{R}$:


$$\text{ComputeBudget}(x) = T_{\text{base}} \times \left( 1 + \lambda_1 \mathcal{U}(x) + \lambda_2 \mathcal{R}(x) \right)$$


* Reflexive Queries: Allocated $T = 1$ generation trajectory ($\le 45\text{ ms}$, System 1).
* High-Risk Financial/Medical Tasks: Allocated $T = 5$ parallel MCTS exploration trajectories with majority voting across verified symbolic outputs.


________________


3. Autonomous Revenue-to-Compute Flywheel Specification
To eliminate manual funding bottlenecks, the platform connects live payment rails directly to the compute and training pipeline:


1. User Ingress & Access


   ├── Visitor purchases access or micro-credits on dualiscapax.ai (Stripe CAD or USDC/BTC/SOL)


   └── Cloudflare Worker (workers/stripe-fulfill/) records DCLM entitlement in D1 database


2. Multi-Model Provider Ingress


   ├── Worker calls optimal frontier provider (xAI Grok, Google Gemini, Anthropic Claude)


   └── Dynamic quota management tracks per-session token consumption


3. Autonomous Treasury Allocation


   ├── 70% of gross revenue maintains live API compute credits


   ├── 30% allocated to sovereign GPU compute pools for fine-tuning runs


   └── System operates autonomously with zero manual intervention


________________


4. File Layout in GitHub Master Encyclopedia
dualiscapax-landing/


└── encyclopedia/


    ├── ai_systems_internal/


    │   ├── deterministic_probabilistic_hybrid_ai_spec.md


    │   └── agent_iris_self_learning_architecture_spec.md   <-- [THIS SPECIFICATION]


    ├── governance_and_protocols/


    │   ├── dclm_layer_zero_law_floor.md


    │   ├── unity_framework_v040_spec.md


    │   └── proposed_ai_roadmap_plan.md


    ├── training_corpora/


    │   └── golden_verified_traces.jsonl                    <-- [RLVR Ground Truth Ledger]


    ├── failure_graphs/


    │   └── anti_patterns.json                              <-- [Reflexion Negative Memory]


    └── manifest.json                                       <-- [SHA-256 Master Hash Table]


________________


5. Summary & Verification
By grounding Agent Iris's continuous learning in formal mathematical verification, eval-driven regression testing, and autonomous revenue recycling, the system guarantees compounding intelligence, zero data poisoning, and strict adherence to the DCLM Layer [0] Law Floor.
