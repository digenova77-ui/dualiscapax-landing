\# DUALISCAPAX ALPHA AMENDMENT — CANONICAL WORK-SURFACE DISAMBIGUATION — V1

\*\*Document Control ID:\*\* \`ED-AMD-20260917-ATHLETICS-VENUE-DISAMBIGUATION-V1\`    
\*\*Classification:\*\* FACTORY AMENDMENT · CANONICAL DISAMBIGUATION STANDARD    
\*\*Operating Entity:\*\* DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7 · OBCA \#100089211)    
\*\*Authority:\*\* Alpha / Factory Evidence Authority    
\*\*System Architect:\*\* David John Di Genova (ORCID: 0009-0005-6291-8508)    
\*\*Governance:\*\* Dualis & Unity Framework (v0.40-Public) / DCLM Layer \[0\] Law Floor / DCCP Conserved Plane    
\*\*Canonical Channel:\*\* \`Google Drive / DualisCapax / FACTORY\_BULLETIN\_BOARD/\` (\`1T6qBAzbwdmJj820bO9qji3wIx7xj0\_q4\`)    
\*\*Status:\*\* SEALED · PRODUCTION AMENDMENT    
\*\*Date of Record:\*\* September 17, 2026 (00:47 EDT) / 2026-09-17 04:47 UTC  

\---

\#\#\# MANDATORY RULE

A canonical work-surface name MUST NOT be treated as a globally unique entity.

Identical labels such as Court, Field, Track, Arena, Stadium, Course, or Pitch may represent different sport-specific domain objects.

Alpha MUST preserve the complete canonical path:

Athletics → Sport → Specialization → Organization/Jurisdiction → Venue/Work Surface

Therefore:

Basketball → Court    
Tennis → Court    
Volleyball → Court  

are three distinct domain namespaces even though the human-facing work-surface label is identical.

They MUST NOT be merged merely because their terminal label is Court.

\---

\#\#\# CANONICAL ID RULE

Use a sport-qualified identifier.

Examples:  
\- \`ATH-BASKETBALL-COURT-\*\`  
\- \`ATH-TENNIS-COURT-\*\`  
\- \`ATH-VOLLEYBALL-COURT-\*\`

Likewise:  
\- \`ATH-HOCKEY-RINK-\*\`  
\- \`ATH-GOLF-COURSE-\*\`  
\- \`ATH-SOCCER-PITCH-\*\`  
\- \`ATH-BASEBALL-DIAMOND-\*\`  
\- \`ATH-FOOTBALL-FIELD-\*\`  
\- \`ATH-MOTORSPORT-CIRCUIT-\*\`  
\- \`ATH-TRACK-FIELD-MEET-\*\`  
\- \`ATH-SWIMMING-MEET-\*\`

\---

\#\#\# PHYSICAL-VENUE RULE

If multiple sports actually use the same physical facility, Alpha MUST NOT duplicate the physical facility as though it were multiple locations.

Instead model:

ONE PHYSICAL FACILITY

with multiple:

SPORT-SPECIFIC WORK-SURFACE EDGES

Example:  
\`\`\`text  
FACILITY-001  
├── basketball → court  
├── volleyball → court  
└── tennis → court  
\`\`\`

The facility remains one physical object.    
The sport-specific operational surfaces remain distinct.

\---

\#\#\# EVIDENCE RULE

A source describing a basketball court cannot automatically establish a tennis court.

A tennis tournament cannot automatically establish a volleyball facility.

Evidence must be evaluated against the sport-qualified object it actually supports.

\---

\#\#\# COLLISION TEST

Before writing any new Athletics object, Alpha MUST check:

1\. canonical sport  
2\. specialization  
3\. jurisdiction  
4\. organization  
5\. facility identity  
6\. work-surface identity  
7\. existing canonical ID  
8\. source provenance

If two records collide only because they share a generic word such as Court, Field, Arena, or Course, DO NOT MERGE.

Run DCLM reconciliation first.

\---

\#\#\# FINAL RULE

SAME WORD ≠ SAME OBJECT.    
SAME FACILITY ≠ SAME SPORT OBJECT.    
SAME VENUE ≠ SAME EVIDENCE GRAPH.  

The canonical path, not the terminal display label, determines identity.

All Athletics harvesters MUST obey this rule.  
