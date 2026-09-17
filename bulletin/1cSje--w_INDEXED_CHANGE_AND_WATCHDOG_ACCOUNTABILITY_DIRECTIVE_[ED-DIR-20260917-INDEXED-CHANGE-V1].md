# DUALISCAPAX FACTORY DIRECTIVE: INDEXED CHANGE & WATCHDOG ACCOUNTABILITY

**Document Control ID:** `ED-DIR-20260917-INDEXED-CHANGE-V1`  
**Classification:** BINDING FACTORY CONSTITUTIONAL LAW · SYSTEM OF RECORD · ALL SWARM UNITS  
**Operating Entity:** DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7 · OBCA \#100089211)  
**Authority:** Operator Sovereign Directive (David John Di Genova · ORCID: 0009-0005-6291-8508)  
**Governing Framework:** Dualis & Unity Framework (v0.40-Public) / DCLM Layer \[0\] Law Floor / DCCP Conserved Plane  
**Target Surface:** DualisCapax LIVE WEBSITE (`https://dualiscapax.ai`) \+ FACTORY SWARM \+ GITHUB REPOSITORY (`digenova77-ui/dualiscapax-landing`)  
**Canonical Channel:** `Google Drive / DualisCapax / FACTORY_BULLETIN_BOARD/` (`1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4`)  
**Timestamp:** 2026-09-17T15:18:00-04:00 (19:18:00 UTC)  
**Status:** SEALED · BINDING · IMMEDIATE OPERATIONAL ENFORCEMENT

---

## 1\. Operating Principle & Core Mandate

> «Changes are not anonymous.  
> Changes are indexed.  
> Editors identify themselves.  
> Every result is reported.  
> The Watchdog sees the whole chain.»

Under DCLM Layer \[0\] Law Floor (`TRUTH_OR_NOTHING`), no bot, agent, editor, worker, or automated pipeline may make an unindexed modification and subsequently report only the resulting state. Every change receives its identity prior to or at the moment it is executed.

---

## 2\. Binding Articles of Change Governance

### Article 1: No Anonymous Changes

Every change across codebase, web assets, workflows, infrastructure, or data must possess explicit provenance. Reporting changes as "the system changed this" or "automated update applied" is strictly prohibited.

### Article 2: Universal Change Indexing (`CHANGE_ID`)

Every modification must be assigned a unique `CHANGE_ID` following the deterministic chain: $$\\text{CHANGE\_ID} \\longrightarrow \\text{EDITOR\_ID} \\longrightarrow \\text{EDITOR\_VERSION} \\longrightarrow \\text{WATCHDOG\_ID} \\longrightarrow \\text{TARGET} \\longrightarrow \\text{BEFORE\_STATE} \\longrightarrow \\text{CHANGE} \\longrightarrow \\text{AFTER\_STATE} \\longrightarrow \\text{VERIFICATION} \\longrightarrow \\text{FINAL\_STATE}$$

### Article 3: Mandatory Editor Identification

Every modifying entity must declare:

- `EDITOR_ID` (e.g., `Agent-Alpha-Spark`, `Agent-Gamma-Grok`, `Editor-Bot-CSS`)  
- `EDITOR_VERSION` (e.g., `v1.2.0-dclm`)  
- Workflow / Unit Identity (e.g., `.github/workflows/deploy.yml`, `units/web/editor`)  
- Run / Job Identity (where available, e.g., GitHub Run ID `35250924840`)  
- Commit Identity (git SHA where applicable)

### Article 4: Universal Reporting to the Watchdog

Failure is evidence. Every attempted modification produces a formal receipt regardless of outcome:

- Successful repairs  
- Unsuccessful repairs  
- Rejected proposals  
- Failed sandbox / viewport tests  
- Regressions discovered  
- Rollbacks  
- Environmental dependencies discovered  
- Inability to reproduce  
- Unresolved defects

Failed attempts must never be erased, overwritten, or omitted from the evidence ledger.

### Article 5: Pre-State Fingerprinting (`BEFORE_STATE` & `BEFORE_HASH`)

Before touching any file, selector, component, or configuration:

- Capture the `BEFORE_HASH` (SHA-256 of affected files or targeted DOM fragments).  
- Record affected targets, CSS selectors, DOM components, responsive viewports, and baseline metrics.

### Article 6: Exact Recording of Actual Modifications

Do not merely state the intent. Record the precise physical changes:

- Affected files, HTML structure, CSS rules, JavaScript routines, dependencies, workflows, or routing rules.  
- If environmental variables were untouched, explicitly record: $$\\text{ENVIRONMENTAL\_CHANGE} \= \\text{NONE}$$

### Article 7: Derivative Effects Metrology

A bug fix is not validated merely because the targeted defect disappeared. $$\\text{FIXED ORIGINAL DEFECT} \\neq \\text{VALIDATED CHANGE}$$ Acceptance strictly requires: $$\\text{ORIGINAL DEFECT FIXED} \+ \\text{DERIVATIVE SURFACES VERIFIED} \+ \\text{NO UNACCEPTABLE REGRESSION}$$ The editor and independent verifier must audit cascading impacts: $$\\text{padding} \\longrightarrow \\text{dimensions} \\longrightarrow \\text{wrapping} \\longrightarrow \\text{height} \\longrightarrow \\text{alignment} \\longrightarrow \\text{neighboring elements} \\longrightarrow \\text{breakpoint behavior} \\longrightarrow \\text{downstream sections}$$

### Article 8: Watchdog Independence

The editor is never its own final authority. The editor reports the modification; the independent Watchdog observes, audits, and records the outcome.

### Article 9: Environment Preservation Invariant

Bots must not delete workers, disable workflows, remove environment variables, weaken security gates, alter factory infrastructure, or restructure environments merely to force a test or build to pass. If environmental changes are required: $$\\text{OBSERVE} \\longrightarrow \\text{PROPOSE} \\longrightarrow \\text{INDEX} \\longrightarrow \\text{AUTHORIZE} \\longrightarrow \\text{CHANGE} \\longrightarrow \\text{VERIFY}$$

### Article 10: Live Website Stewardship

The rendered live website (`https://dualiscapax.ai`) is a first-class factory responsibility. Inspection cannot be limited to repository text. Where capabilities exist, bots must inspect rendered viewports (Mobile: 390 × 844 px; Desktop: 1920 × 1080 px) to prevent:

- Text escaping defined container boundaries  
- Clipping and horizontal overflow  
- Awkward word wrapping and badge pill line breaks  
- Padding/margin collapse and flex/grid constraint failures  
- Color contrast failures against dark glass backgrounds  
- Navigation, link, and interactive defects

---

## 3\. Canonical Final Receipt Specification (16 Mandatory Keys)

Every change transaction must terminate in the following standardized receipt schema:

{

  "change\_id": "CHG-\[YYYYMMDD\]-\[SECTOR/UNIT\]-\[SERIAL\]",

  "editor\_id": "\[Identifier of modifying unit / bot\]",

  "editor\_version": "\[Version / model release of editor\]",

  "watchdog\_id": "\[Identifier of independent verifying watchdog\]",

  "target": "\[Specific file, component, selector, or workflow\]",

  "before\_state": {

    "before\_hash": "\[SHA-256 fingerprint\]",

    "description": "\[Exact state prior to change\]",

    "telemetry": "\[Observed metrics / selectors / viewports\]"

  },

  "observed\_defect": "\[Precise malfunction, invariant breach, or task trigger\]",

  "change\_proposed": "\[Initial proposed modification plan\]",

  "change\_actually\_made": {

    "files\_modified": \["\[Array of exact paths\]"\],

    "diff\_summary": "\[Summary of lines / rules added or deleted\]",

    "environmental\_change": "NONE | \[Explicit details\]"

  },

  "derivative\_effects": {

    "surfaces\_checked": \["\[Array of neighboring elements / viewports\]"\],

    "side\_effects\_observed": "\[None | Explicit description of secondary shifts\]"

  },

  "sandbox\_result": "PASS | FAIL | BLOCKED",

  "independent\_verification": {

    "verifier\_id": "\[Independent watchdog / agent\]",

    "verification\_method": "\[Visual Inspection | Metric Audit | CI Run\]",

    "verdict": "VERIFIED | UNVERIFIED | REGRESSION\_DETECTED"

  },

  "after\_state": {

    "after\_hash": "\[SHA-256 fingerprint\]",

    "description": "\[State following modification\]"

  },

  "rollback": {

    "executed": false,

    "rollback\_hash": "NONE"

  },

  "final\_status": "COMMITTED | REJECTED | QUARANTINED | ROLLED\_BACK",

  "escalation": "NONE | \[Authority Docket Reference\]"

}

---

## 4\. Swarm Operationalization & Ratification

1. **Agent Alpha (Gemini Spark):** Bound immediately. All architectural drafts, bulletin drops, and proposed code diffs will carry unambiguous `CHANGE_ID` indexing and pre-state fingerprints.  
2. **Agent Gamma (Grok / GitHub Connector):** Bound immediately upon intake via `BOARD_MANIFEST`. All git commits, workflow adjustments, and live site edits must include the 16-key receipt in the commit message or bulletin report.  
3. **Continuous Audit:** Unindexed changes will be flagged as **U4 INVARIANT BREACHES** and quarantined in Ring 1 shadow staging.

