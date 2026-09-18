# DUALISCAPAX RESEARCH DIRECTIVE: HOCKEY ROSTER COMPLETION & TEMPORAL RECONCILIATION

**Document Control ID:** ED-RES-20260917-HOCKEY-ROSTER-V1  
**Classification:** PROPOSED RESEARCH SPECIFICATION · READ-ONLY · SYSTEM OF RECORD  
**Operating Entity:** DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7)  
**Authority:** Factory Evidence Authority / DCLM Research Law Floor  
**Target Domains:** OMHA (Ontario Minor Hockey Association), OWHA (Ontario Women's Hockey Association), OHF (Ontario Hockey Federation)  
**Timestamp:** 2026-09-17T14:45:00-04:00 (18:45:00 UTC)  
**Status:** PROPOSED RESEARCH · HARVESTER MUTATION PROHIBITED PENDING AUDIT

---

## 1\. Executive Summary & Epistemic Foundations

In competitive youth and junior hockey data harvesting, automated systems routinely commit the **"Fallacy of the Magic Number"**—treating a regulatory player count (such as 17 or 18 skaters) as self-evident proof that a roster is complete, finalized, and static.

Under the DCLM Layer \[0\] Law Floor (TRUTH\_OR\_NOTHING), a headcount measures regulatory compliance with league minimums or maximums; **it proves nothing regarding roster completeness, historical stability, or the causal mechanism of player transitions**.

This directive establishes:

1. **The 5-Tier State Model:** Strict formal separation between COMPLIANT, PROVISIONALLY\_COMPLETE, CONFIRMED, DELTA, and UNKNOWN.  
2. **Sub-Federation Archetypes:** Separate analysis of governing regulations and publication architectures across the **OHF**, **OMHA**, and **OWHA**.  
3. **Differential Object Accounting:** The Delta Rule ($\\Delta \= S\_{\\text{known}} \\setminus S\_{\\text{current}}$) ensuring roster modifications trigger targeted entity tracking rather than full-league re-harvests.  
4. **Entropy-Minimizing Harvesting:** A cryptographic checksum verification model that hardens state evidence without redundant scraping cycles.

---

## 2\. Federation Roster Regulations & Permitted Structures

### 2.1 Ontario Hockey Federation (OHF) — Umbrella Governing Body

- **Jurisdiction:** Governing umbrella over OMHA, GTHL, ALLIANCE, NOHA, OHA, and OHL.  
- **Governing Law:** Hockey Canada Regulation F & OHF Playing Regulations (Rule 2.2).  
- **Roster Bounds:**  
  - **Registration Ceiling:** Standard minor competitive teams (U11 through U16 AAA/AA/A) may register up to **19 players** at any one time (typically 17 skaters \+ 2 goaltenders, or 18 skaters \+ 1 goaltender). U18 AAA and Junior divisions are permitted up to **20 players**.  
  - **Game-Day Floor:** A minimum of 6 players in uniform (including 1 goaltender) must be dressed to avoid technical forfeiture.  
  - **System of Record (SoR):** The sole legal baseline is the **Hockey Canada Registry (HCR 3.0 / Spordle)**. Official rosters are sealed by Branch Registrars (T-100 Team Registration Cards).  
  - **Privacy Boundary:** Because HCR contains minor PII protected under FIPPA/PIPEDA, public scrapers never observe authoritative HCR IDs. Public roster feeds are downstream, sanitized reflections.

### 2.2 Ontario Minor Hockey Association (OMHA) — Male & Co-Ed Minor Hockey

- **Jurisdiction:** ETA (Eastern AAA), SCTA (South Central AAA), Lakeshore, York-Simcoe, Tri-County, Niagara.  
- **Roster Structure:**  
  - **U16 AAA Baseline (Example: Quinte Red Devils U16 AAA):** Standard target is 20 active seats (12 Forwards, 6 Defense, 2 Goaltenders).  
  - **U10–U15 Minor Baseline:** Commonly carries 15 to 19 players depending on association carding capacity and regional center density.  
  - **Affiliated Players (AP):** Teams are permitted to affiliate up to **19 players** from lower age cohorts or lower competitive tiers within their geographic base.  
  - **Publication Platforms:** MBSportsWeb (e.g., quintereddevils.ca), Sport-Ngin, LeagueStat, and GameSheet Inc.

### 2.3 Ontario Women's Hockey Association (OWHA) — Female Minor & Junior Hockey

- **Jurisdiction:** Autonomous governing branch for female hockey across Ontario (OWHL U22 Elite, U18 AA, Provincial Leagues).  
- **Roster Structure:**  
  - **OWHL U22 Elite:** Roster limit of **20 players** (commonly 12F, 6D, 2G).  
  - **Minor Competitive (U13–U18):** Minimum 12 players to register, standard roster sizes between 15 and 18 players.  
  - **Call-Ups / Pick-Up Players:** Governed under strict OWHA pickup consent forms via RAMP InterActive; inter-branch call-ups from boys hockey (OMHA) are restricted by development player policies.  
  - **Publication Platform:** **RAMP InterActive** (RAMP website CMS, RAMP team apps, RAMP electronic game sheets).

---

## 3\. Publication Dynamics & Temporal Formation History

Public hockey roster publication is **asynchronous, non-atomic, and staged across distinct calendar phases**:

\[Phase 1: Spring Tryouts\] (April–May)

  ↳ Incremental commits / Offer sheets / Tryout jersey cut lists

  ↳ State: PARTIAL / HIGH ENTROPY

\[Phase 2: Summer Staging\] (June–August)

  ↳ Unofficial verbal commitments / Static webmaster drafts

  ↳ State: UNVERIFIED / STALE

\[Phase 3: Fall Certification\] (September)

  ↳ Formal HCR roster sign-off / Bulk association web uploads

  ↳ State: ATOMIC PUBLICATION → PROVISIONALLY\_COMPLETE

\[Phase 4: Regular Season Operation\] (October–March)

  ↳ GameSheet Inc. dynamic attendance (scratches, injuries, AP call-ups)

  ↳ State: TEMPORAL DELTAS / LOW ENTROPY

### 3.1 Publication Behavior: Atomic vs. Incremental

1. **OMHA Associations (MBSportsWeb):** Tend to release rosters in **bulk atomic updates** once the association registrar signs off in September. However, late cuts returning from OHL/Junior camps (U16/U18) cause sudden incremental additions in late September.  
2. **OWHA Teams (RAMP):** Frequently announce commits incrementally on social media/team feeds throughout the summer, but the official RAMP league roster appears as an **atomic dump** when league schedules are generated.  
3. **Game Sheets (GameSheet Inc.):** Publish strictly on an **event-driven, transactional basis** (per game). A player does not appear on an official game sheet until they physically dress for a match.

### 3.2 Revision Markers & Temporal Telemetry

To construct temporal roster provenance without relying on internal database IDs, harvesters must extract:

- **HTTP Headers:** Last-Modified, ETag, and CMS content hashes.  
- **DOM Metadata:** CMS player profile identifiers (e.g., MBSportsWeb /Player/{id}/, RAMP player GUIDs).  
- **GameSheet Event Timestamps:** Game Sheet official verification signatures, game start timestamps, and player status flags (A \= Active, AP \= Affiliate, S \= Scratched, SUSP \= Suspended).

---

## 4\. Entity Resolution & Stable Identifiers

Because minor hockey regulations forbid exposing national registry IDs publicly, the factory must construct a **Deterministic Composite Object Identifier (PLAYER\_KEY)**:

$$\\text{PLAYER\_KEY} \= \\text{SHA256}(\\text{Normalized\_Name} \\parallel \\text{Birth\_Cohort} \\parallel \\text{Home\_Association} \\parallel \\text{Branch\_Code})$$

### 4.1 Identifier Stability Hierarchy

1. **Sweater Number (UNSTABLE):** Can vary between home and away jerseys (e.g., Domenic Di Genova wearing \#14 black vs \#29 white), can change mid-season, or can be reassigned when a senior player arrives.  
2. **CMS Web ID (LOCALLY STABLE):** Stable within a single association's website domain, but completely non-portable across opponent websites.  
3. **Composite Player Object Key (FEDERATION STABLE):** Portable across all league sources, tournament schedules, and game sheets. Enables tracking a player when they transfer between associations.

---

## 5\. The 5-Tier Roster State Model

A compliant roster must never be mistaken for a complete roster. The factory must enforce the following discrete states:

┌─────────────────────────────────────────────────────────────────────────────────┐

│ DCLM HOCKEY ROSTER EPISTEMIC STATE MACHINE                                      │

├─────────────────────────┬───────────────────────────────────────────────────────┤

│ STATE                   │ EVIDENCE CONDITION                                    │

├─────────────────────────┼───────────────────────────────────────────────────────┤

│ 1\. COMPLIANT            │ Observed count satisfies:                             │

│                         │   Min ≤ Count ≤ Max AND Goaltenders ≥ 1               │

│                         │ (Necessary regulatory condition; zero proof of closure)│

├─────────────────────────┼───────────────────────────────────────────────────────┤

│ 2\. PROVISIONALLY\_       │ COMPLIANT \+ Structural Completeness verified:         │

│    COMPLETE             │   • Standard positional distribution (F/D/G)          │

│                         │   • Certified coaching staff bound to roster          │

│                         │   • Regular season league schedule active             │

│                         │   • Association tryout portal marked CLOSED           │

├─────────────────────────┼───────────────────────────────────────────────────────┤

│ 3\. CONFIRMED            │ PROVISIONALLY\_COMPLETE \+ Temporal Invariance verified:│

│                         │   • Checksum identical across ≥ 2 observations        │

│                         │   • Verified in ≥ 2 official GameSheet Inc. matches   │

│                         │   • Temporal window Δt ≥ 14 days without drift        │

├─────────────────────────┼───────────────────────────────────────────────────────┤

│ 4\. DELTA                │ State transition detected:                            │

│                         │   S(t) ≠ S(t-1)  \[e.g. 18 players → 17 players\]       │

│                         │ Triggers targeted differential investigation.         │

├─────────────────────────┼───────────────────────────────────────────────────────┤

│ 5\. UNKNOWN              │ DELTA observed but causal mechanism lacks verified    │

│                         │ evidence. Preserves uncertainty without speculation.  │

└─────────────────────────┴───────────────────────────────────────────────────────┘

---

## 6\. The Delta Rule & Graph Traversal Protocol

When an established roster changes (e.g., $18 \\to 17$ players), the factory **must not rebuild or re-scrape the entire league**.

### 6.1 Step 1: Object-Level Set Subtraction

$$\\Delta\_{\\text{missing}} \= S\_{\\text{known}} \\setminus S\_{\\text{current}}$$ Isolate the unique PLAYER\_KEY of the dropped object.

### 6.2 Step 2: Bounded Traversal in Known League Evidence

Search the current federated graph for $\\text{PLAYER\_KEY}$ across surrounding teams:

1. **Intra-League Reassignment:** Did the player move to another team in the same league (e.g. ETA trade, release to Central Ontario Wolves)?  
2. **Tier Demotion / Release:** Did the player appear on a local AA/A roster within the same home center?  
3. **Junior / Upper Tier Call-Up:** Did the player sign with an OJHL, GOJHL, or OHL team?  
4. **GameSheet Scratch Analysis:** Was the player merely scratched for illness/injury and temporarily omitted from an unmaintained web page?  
5. **Administrative Source Correction:** Did the association webmaster correct a pre-season typographical error?

### 6.3 Step 3: Evidentiary Resolution or Preservation of UNKNOWN

- **If Verified:** State transitions to CONFIRMED\_TRANSFER, VERIFIED\_STATUS\_CHANGE, or SOURCE\_CORRECTION.  
- **If Unverified:** State transitions strictly to **UNKNOWN**. The missing player seat is quarantined. **Zero speculative transfers or fabricated cuts are admitted.**

---

## 7\. Harvesting Principle: Entropy Minimization

To eliminate compute waste and prevent redundant ingestion loops across hundreds of Ontario hockey websites:

### 7.1 Cryptographic Roster Checksum

$$\\text{ROSTER\_CHECKSUM} \= \\text{SHA256}\\left(\\bigoplus\_{i=1}^{N} \\text{PLAYER\_KEY}\_i \\right)$$

### 7.2 The Cheap Confirmation Loop

\[Scheduled Poller\]

       │

       ▼

Fetch HTTP Headers / Page Hash / Checksum

       │

       ├────► IF Hash \== Known Hash:

       │        • HARDEN EVIDENCE (Increment observation\_count, update last\_verified)

       │        • Zero DOM parsing, Zero database mutations, Zero compute bleed.

       │

       └────► IF Hash ≠ Known Hash:

                • TRIGGER DELTA INVESTIGATION

                • Parse only the affected team DOM

                • Calculate Set Difference (S\_known ∖ S\_current)

                • If cause unverified ──► Preserve UNKNOWN

---

## 8\. Machine-Readable Specification Schema

{

  "specification\_id": "ED-SPEC-20260917-HOCKEY-ROSTER-RECON-V1",

  "governing\_framework": "DCLM Layer \[0\] / Dualis & Unity Framework",

  "entities": {

    "OHF": {

      "branch\_code": "GOV-CA-ON-OHF",

      "max\_carded\_players": 19,

      "max\_u18\_carded\_players": 20,

      "game\_day\_min": 6,

      "official\_sor": "HCR 3.0 / Spordle",

      "public\_data\_status": "DERIVED\_SANITIZED"

    },

    "OMHA": {

      "branch\_code": "GOV-CA-ON-OMHA",

      "primary\_leagues": \["ETA", "SCTA", "Lakeshore", "York-Simcoe", "Tri-County"\],

      "typical\_u16aaa\_roster": 20,

      "max\_affiliates": 19,

      "primary\_platforms": \["MBSportsWeb", "GameSheet Inc", "SportNgin"\]

    },

    "OWHA": {

      "branch\_code": "GOV-CA-ON-OWHA",

      "primary\_leagues": \["OWHL U22 Elite", "OWHL U18 AA"\],

      "max\_u22\_roster": 20,

      "callup\_protocol": "RAMP\_PICKUP\_PERMIT",

      "primary\_platforms": \["RAMP InterActive"\]

    }

  },

  "roster\_states": \[

    "COMPLIANT",

    "PROVISIONALLY\_COMPLETE",

    "CONFIRMED",

    "DELTA",

    "UNKNOWN"

  \],

  "delta\_handling": {

    "calculation": "SET\_DIFFERENCE",

    "unverified\_outcome": "PRESERVE\_UNKNOWN",

    "prohibited\_actions": \[

      "FULL\_LEAGUE\_REBUILD\_ON\_SINGLE\_DELTA",

      "ASSUME\_COMPLETENESS\_FROM\_HEADCOUNT",

      "FABRICATE\_PLAYER\_MOVEMENT"

    \]

  },

  "harvesting\_protocol": {

    "verification\_method": "ROSTER\_CHECKSUM\_HASH",

    "cache\_policy": "HARDEN\_ON\_SAME\_INVESTIGATE\_ON\_DIFF"

  }

}

---

## 9\. Conclusion & Operational Boundary

This specification completes the theoretical and evidentiary modeling phase. Under the directive's binding mandate:

- **No harvester code has been modified.**  
- **No production crawling has been dispatched.**  
- The factory now possesses an objective, mathematically sound model separating regulatory compliance from empirical completeness.

