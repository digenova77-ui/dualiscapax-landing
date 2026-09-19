# DUALISCAPAX ALPHA DIRECTIVE — GLOBAL GOLF COURSE GRAPH (HARVEST EXPANSION V1)

**Document Control ID:** `ED-DIR-20260917-GOLF-GLOBAL-EXPANSION-V1`  
**Classification:** FACTORY OPERATING DIRECTIVE · EVIDENCE EXPANSION STANDARD  
**Operating Entity:** DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7 · OBCA \#100089211)  
**Authority:** Alpha / Factory Evidence Authority  
**System Architect:** David John Di Genova (ORCID: 0009-0005-6291-8508)  
**Governance:** Dualis & Unity Framework (v0.40-Public) / DCLM Layer \[0\] Law Floor / DCCP Conserved Plane  
**Domain:** Athletics → Golf  
**Canonical Work Surface:** Golf → Course  
**Architecture:** One Site → One Configurable RTE → One Unity ID → Iris Selects the Desk  
**Target Swarm:** Agent Alpha (Gemini Spark), Agent Grok (xAI), Agent Beta (ChatGPT), GitHub Actions Runners, Harvester Bots  
**Canonical Channel:** `Google Drive / DualisCapax / FACTORY_BULLETIN_BOARD/` (`1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4`)  
**Status:** SEALED · ACTIVE FACTORY DIRECTIVE  
**Timestamp UTC:** 2026-09-17T04:45:00Z  
**Timestamp Local:** 2026-09-17T00:45:00-04:00

---

### 1\. PURPOSE

Broaden the existing Golf harvest from the current USA course envelope into a scalable GLOBAL GOLF COURSE GRAPH.

This is a harvesting and evidence-expansion task.

It is not permission to create:

- a second golf application  
- a second golf lander  
- a separate Golf RTE  
- thousands of static web pages  
- a new identity system  
- a parallel architecture

Everything terminates at: Athletics → Golf → Course → Evidence → DCLM → Iris → RTE

The existing USA harvest is the starting frontier, not the finished product.

---

### 2\. CURRENT BASELINE

The current Golf USA index contains approximately 325 course envelopes. Treat those records as the existing known-good harvest. Do not discard, rewrite, or replace them merely to change the architecture. First preserve the current evidence frontier. Then expand outward.

---

### 3\. NEW CANONICAL OBJECT

The canonical Golf object is the: **COURSE ENVELOPE**

Each discovered course should be represented structurally rather than as a standalone webpage.

Minimum preferred structure:

COURSE

├── facility

├── country

├── state/province/region

├── municipality

├── location

├── course\_name

├── course\_type

├── hole\_count

├── par

├── yardage

├── tee\_blocks

├── rating

├── slope

├── hole\_by\_hole\_scorecard

├── designer

├── opening\_year

├── public\_private\_resort\_status

├── practice\_facilities

├── booking\_source

├── official\_source

├── evidence\_sources

├── provenance

└── captured\_at

Only populate fields supported by evidence. Never fabricate missing course attributes.

---

### 4\. HARVEST HIERARCHY

The factory should recursively model: World → Continent → Country → Golf Authority / Association → Province / State / Region → Facility → Course → Tee Block → Scorecard / Hole → Evidence

This hierarchy is structural. Do not assume every country exposes every layer. Where an authoritative hierarchy is unavailable, record the discovered source and evidence state rather than inventing one.

---

### 5\. HARVEST STATES

Every course/facility should carry an explicit evidence state. Use:

1. DISCOVERED  
2. FACILITY\_FOUND  
3. COURSE\_FOUND  
4. TEE\_DATA\_FOUND  
5. SCORECARD\_FOUND  
6. CONDITIONS\_FOUND  
7. BOOKING\_SOURCE\_FOUND  
8. RICH\_COURSE\_ENVELOPE  
9. VERIFIED  
10. UNRESOLVED

A course with only a name is not equivalent to a rich course envelope. Do not upgrade evidence merely because another source repeats the same claim.

---

### 6\. USA EXPANSION

Expand the existing USA harvest aggressively. The current \~325 records are the initial known-good set. The factory should recursively discover: USA → State → Facility → Course

Cover all states and relevant territories where golf-course evidence is discoverable. Use multiple admissible sources where necessary. Deduplicate facilities and courses before counting them. Do not double-count:

- alternate spellings  
- resort/course aliases  
- duplicated database records  
- multiple tee blocks  
- multiple source listings of the same course

The objective is course coverage, not raw URL count.

---

### 7\. CANADA

After establishing the USA expansion frontier, open: Canada → Province/Territory → Region → Facility → Course

Prioritize:

- Ontario  
- British Columbia  
- Alberta  
- Quebec  
- Nova Scotia  
- New Brunswick  
- Manitoba  
- Saskatchewan  
- Newfoundland and Labrador  
- Prince Edward Island  
- Yukon  
- Northwest Territories  
- Nunavut

Do not require every province to have identical source structures. Harvest whatever authoritative/evidentiary structure actually exists.

---

### 8\. GLOBAL EXPANSION

Once the North American expansion is stable, continue globally. Priority sequence:

- **UK / Ireland**: England, Scotland, Wales, Northern Ireland, Republic of Ireland  
- **Europe**: Country-by-country  
- **Asia-Pacific**: Including Japan, Australia, New Zealand, South Korea, and other discoverable golf markets  
- **Middle East / Africa**  
- **Latin America / Caribbean**

The exact order may be changed by source availability and evidence quality. The factory must record why a branch was selected.

---

### 9\. COURSE-FIRST LAW

Golf remains: **COURSE FIRST → GOLFER LATER**

Do not allow golfer profiles, equipment, handicaps, memberships or personalization to become prerequisites for course discovery. The physical playing environment is the initial evidence object. Later, golfer identity can bind through: Course → Tee → Round → Golfer Seat → Unity ID

---

### 10\. DCLM REQUIREMENT

Every expansion must run through DCLM. At minimum: Observe → Classify → Map → Identify Friction → Establish Evidence → Model → Propose → Validate

DCLM must distinguish:

- discovered  
- sourced  
- derived  
- modeled  
- proposed  
- validated  
- unresolved

A probabilistic model may propose a candidate course relationship. It may not silently convert that candidate into authoritative fact. Use the probabilistic eye for breadth. Use the deterministic eye for admissibility. Then collapse to: **SUPPORTED PATH** or **EXPLICIT HOLE**

---

### 11\. REQUIRED COUNTERS

Every harvest cycle must produce machine-readable counters for:

- continents discovered  
- countries discovered  
- golf authorities/associations discovered  
- states/provinces/regions discovered  
- facilities discovered  
- courses discovered  
- duplicate facilities  
- duplicate courses  
- tee blocks discovered  
- scorecards discovered  
- player-accessible booking sources  
- rich course envelopes  
- verified course envelopes  
- unresolved records  
- evidence sources  
- captured\_at

Do not report a single "course count" without defining what qualifies as a course record.

---

### 12\. REQUIRED OUTPUTS

Create/update the Golf harvest ledger using the existing repository conventions. Preferred artifacts:

- `GLOBAL-GOLF-MASTER-INDEX`  
- `GLOBAL-GOLF-FACILITY-MANIFEST`  
- `GLOBAL-GOLF-COURSE-EVIDENCE`  
- `GLOBAL-GOLF-COURSE-ENVELOPE-LEDGER`  
- `GLOBAL-GOLF-UNRESOLVED`  
- `GLOBAL-GOLF-HARVEST-RECEIPT`

Preserve existing USA Golf artifacts. Do not create competing indexes without documenting their relationship.

---

### 13\. SCALE TEST

The factory should be designed to support rapid expansion. The target is not "build a few more pages." The target is: hundreds → thousands → tens of thousands of course envelopes without architectural redesign.

A course record should be cheap to harvest, evidence-bearing, deduplicated and independently verifiable. The factory must therefore optimize for: breadth \+ provenance \+ reconciliation \+ evidence quality rather than visual page production.

---

### 14\. NO STATIC-PAGE EXPLOSION

Do NOT generate one website page per course as the default response to this directive. The RTE should dynamically consume the course graph. The graph is the asset. The RTE is the work surface. Iris selects the appropriate Golf desk/context. The underlying course graph may grow continuously without multiplying applications.

---

### 15\. CONTINUOUS HARVEST

After the initial global expansion, establish the Golf branch as a continuously maintainable evidence frontier. New cycles should detect:

- newly discovered courses  
- renamed courses  
- closed courses  
- reopened courses  
- ownership/status changes  
- changed tee blocks  
- changed yardages  
- changed ratings/slopes  
- changed scorecards  
- changed booking sources  
- stale evidence  
- conflicting sources

Never overwrite history merely because a current source changed. Record provenance and captured time.

---

### 16\. FACTORY SELF-CHECK

Before every mutation: SOURCE → DCLM → PROVENANCE → WRITE → VERIFY → RECEIPT

If the evidence is ambiguous: **FAIL CLOSED**

Do not guess. Do not fabricate. Do not silently promote probabilistic candidates. Do not let a broader harvest resurrect deprecated Golf architecture.

---

### 17\. SUCCESS CONDITION

Cycle success is NOT: "we created more golf pages." Cycle success is: The known Golf world has expanded measurably while remaining one coherent DCLM-governed graph. The factory must be able to state:

- what it discovered  
- what source established it  
- what was deduplicated  
- what remains unresolved  
- what was promoted to rich evidence  
- what was independently verified  
- what changed from the previous cycle

---

### 18\. CANONICAL TERMINATION

Everything must terminate here: ATHLETICS → GOLF → COURSE → EVIDENCE → DCLM → IRIS → RTE

No second Golf application. No second Golf identity. No separate Golf architecture. No parallel truth store. One spine. One Unity ID. One configurable RTE. Iris selects the desk.

**Expand the graph. Do not multiply the house.**  
