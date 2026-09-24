# SPARK ALPHA — IRIS SELF-ARBITRAGE EXPERIMENT RECEIPT

**Document Control ID:** `ED-TEST-20260917-IRIS-SELF-ARBITRAGE-V1`  
**Candidate ID:** `CAND-IRIS-ARB-001`  
**Classification:** FACTORY EXPERIMENT · IRIS SELF-ARBITRAGE TEST · BOUNDED ARCHITECTURAL RECEIPT  
**Operating Entity:** DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7)  
**Originating Agent:** Agent Alpha (Gemini Spark)  
**Target Surface:** `FACTORY_BULLETIN_BOARD` (Folder ID: `1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4`)  
**Target Repository:** `digenova77-ui/dualiscapax-landing`  
**Timestamp:** 2026-09-17T14:05:00-04:00 (18:05:00 UTC)  
**Status:** UNRESOLVED (Awaiting Operator Gate Resolution · Zero Production Mutation)

---

## 1\. Context & Architectural Mandate

Per the Iris Self-Arbitrage Functionality Test directive, Agent Alpha independently receives, structures, and returns a bounded architectural candidate using Iris herself as the subject of arbitrage.

This experiment implements the canonical loop: `REALITY → PROBABILISTIC DISCOVERY → CANDIDATE → IRIS / DCLM → RESIDUAL → ADMISSIBLE NEXT WORK → ACTION → INDEPENDENT MEASUREMENT → RECEIPT → VALUE → IRIS → NEXT RESIDUAL`

---

## 2\. Epistemological Stratification (Discipline of Evidence)

### OBSERVED (Direct Ground Truth Telemetry)

1. Workflow `.github/workflows/bulletin-board-watch.yml` exists in `digenova77-ui/dualiscapax-landing` at commit `275f1c623920dab579c0e032b8868f194e909e5b` with cron `*/30 * * * *`.  
2. Workflow run `35250924840` failed in \~9s at step `google-github-actions/auth@v2` because `vars.GCP_WORKLOAD_IDENTITY_PROVIDER` and `vars.GCP_SERVICE_ACCOUNT` resolved empty.  
3. Canonical Google Drive folder `1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4` contains multiple documents with statuses `EXECUTED`, `READ`, and `PARKED`, indexed in `BOARD_MANIFEST_[ED-MAN-20260917-CANONICAL-V1]` (`1HsJpEQFXG7DbUOoulRmuyhQClbxAh5OgDPIy0VyAT1Y`).  
4. GitHub Actions connector cannot modify repository variables or secrets (Human Operator Gate).

### DERIVED (Logical Implications)

1. A 30-minute scheduled runner without populated WIF variables executes 48 fail-closed runs every 24 hours, consuming runner queue slots without executing `scripts/read_bulletin_board.py`.  
2. A naive directory traversal of `1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4` fetches all files on every run rather than inspecting the canonical manifest index, causing redundant reads of already executed dockets.

### MODELED (Theoretical / Metric Projections)

1. Invariant preflight gating (`if: vars.GCP_WIF_ENABLED == 'true'`) eliminates 48 redundant failing runner runs per day (\~432 runner-seconds / \~7.2 runner-minutes per day saved).  
2. Manifest-first ingestion reduces Drive API read overhead from \$O(N)\$ (where \$N\$ is total board files) to \$O(1)\$ manifest check \+ \$O(K)\$ new dockets (\$K \\ll N\$).  
3. Financial value recovered: \$0.00 CAD hard cash (compute quota conservation only).

### PROPOSED (Admissible Interventions)

1. Operator configures GitHub Actions repository variables (`GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`, `GCP_WIF_ENABLED=true`) and grants Viewer rights on `1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4`.  
2. Update `.github/workflows/bulletin-board-watch.yml` with a fail-closed preflight skip check when `vars.GCP_WIF_ENABLED != 'true'`.  
3. Align `scripts/read_bulletin_board.py` to ingest `BOARD_MANIFEST` first, skipping files marked `READ` or `EXECUTED`.

### VALIDATED

- **NONE (Runtime savings are unvalidated).** No live successful run has been recorded. Zero production changes claimed.

### UNRESOLVED

1. Operator Gate execution (manual configuration of GitHub Actions repository variables).  
2. Verification of Google Service Account IAM binding to Workload Identity Pool.  
3. Verification of first green run capturing `ALPHA-FACTORY-RELAY-V2` in `./bulletin/_manifest.json`.

---

## 3\. Machine-Readable Candidate Receipt

{

  "candidate\_id": "CAND-IRIS-ARB-001",

  "friction": "Redundant fail-closed GitHub runner cycles (48 runs/day) and unindexed Google Drive docket traversal in the Board-to-Watcher telemetry pipeline",

  "observation": "GitHub Actions run 35250924840 failed in 9s on auth@v2 due to empty vars.GCP\_WORKLOAD\_IDENTITY\_PROVIDER and vars.GCP\_SERVICE\_ACCOUNT while scheduled on a 30-minute cron. Bulletin board folder 1T6qBAzbwdmJj820bO9qji3wIx7xj0\_q4 contains 7+ items already indexed as EXECUTED or READ in BOARD\_MANIFEST.",

  "evidence": {

    "workflow\_file": ".github/workflows/bulletin-board-watch.yml",

    "commit\_sha": "275f1c623920dab579c0e032b8868f194e909e5b",

    "failed\_run\_id": "35250924840",

    "failed\_job\_id": "105302787164",

    "board\_folder\_id": "1T6qBAzbwdmJj820bO9qji3wIx7xj0\_q4",

    "canonical\_manifest\_id": "1HsJpEQFXG7DbUOoulRmuyhQClbxAh5OgDPIy0VyAT1Y",

    "failing\_step": "google-github-actions/auth@v2"

  },

  "residual": "Authentication failure prevents automated reader execution; without WIF variables, scheduled cron burns \~7.2 runner-minutes/day with zero work captured, leaving Board-to-Watcher bridge unproven.",

  "next\_admissible\_work": \[

    "Operator sets GitHub repository variables: GCP\_WORKLOAD\_IDENTITY\_PROVIDER, GCP\_SERVICE\_ACCOUNT, GCP\_WIF\_ENABLED=true",

    "Operator grants Viewer permission to Service Account on Google Drive folder 1T6qBAzbwdmJj820bO9qji3wIx7xj0\_q4",

    "Dispatch manual workflow\_dispatch run on bulletin-board-watch.yml",

    "Verify generation of ./bulletin/\_manifest.json containing ALPHA-FACTORY-RELAY-V2"

  \],

  "required\_authority": "Human Operator (David Di Genova) — Agent connectors lack authorization to set repository Actions variables and cloud IAM permissions.",

  "proposed\_action": "1. Add preflight condition (if: vars.GCP\_WIF\_ENABLED \== 'true') to bulletin-board-watch.yml to halt runner execution cleanly if unconfigured. 2\. Configure repository variables and Drive ACL. 3\. Update read\_bulletin\_board.py to ingest BOARD\_MANIFEST index before traversing raw files.",

  "independent\_measurement": {

    "metric\_1": "GitHub Actions exit code (0 for green run, skipped if unconfigured)",

    "metric\_2": "Runner execution duration (seconds per run)",

    "metric\_3": "Artifact presence: ./bulletin/\_manifest.json in git workspace",

    "metric\_4": "Google Drive API request count per poll cycle"

  },

  "success\_condition": "GitHub Actions run passes green (exit code 0), captures ALPHA-FACTORY-RELAY-V2 in ./bulletin/\_manifest.json, and executes in \<30s without redundant doc fetches.",

  "receipt\_schema": {

    "schema\_version": "1.0.0",

    "required\_fields": \[

      "candidate\_id",

      "friction",

      "observation",

      "evidence",

      "residual",

      "next\_admissible\_work",

      "required\_authority",

      "proposed\_action",

      "independent\_measurement",

      "success\_condition",

      "receipt\_schema",

      "value\_model",

      "state",

      "unresolved\_items"

    \]

  },

  "value\_model": {

    "type": "COMPUTE\_AND\_API\_OVERHEAD\_REDUCTION",

    "runner\_minutes\_saved\_if\_gated": "7.2 min/day during unconfigured state",

    "drive\_api\_calls\_saved\_per\_cycle": "N \- 1 calls (where N is count of closed board dockets)",

    "fiat\_cash\_value": "CAD \$0.00 (infrastructure efficiency only; no external fiat impact)",

    "validation\_status": "MODELED\_NOT\_VALIDATED"

  },

  "state": "UNRESOLVED",

  "unresolved\_items": \[

    "GCP Workload Identity Provider resource string not set in GitHub repository variables",

    "GCP Service Account email not set in GitHub repository variables",

    "Service Account permissions not confirmed on Google Drive folder 1T6qBAzbwdmJj820bO9qji3wIx7xj0\_q4",

    "Run proof ALPHA-FACTORY-RELAY-V2 not yet captured in ./bulletin/\_manifest.json"

  \]

}

---

## 4\. Architectural Verification

- **Zero Website Mutation:** No changes made to `dualiscapax.ai`, landing pages, or public surfaces.  
- **Zero Hallucinated Validation:** The experiment status is honestly recorded as `UNRESOLVED`.  
- **Zero Grok Dependency:** Generated and structured directly by Spark Alpha within the DCLM/Unity doctrine.

