# **SPARK ALPHA — DCLM SHORT-PIPE FACTORY EXPANSION**

## **DIRECTIVE V1**

**Document Control ID:** ED-DIR-20260917-DCLM-SHORT-PIPE-FACTORY-V1  
**Authority:** Factory Evidence Authority / Operator Sovereign Directive  
**Purpose:** Evaluate and, if validated, incorporate the following factory architecture into the existing DualisCapax Factory.  
This is a FACTORY execution architecture only. Do not create a new website, application, secondary truth store, modify deployment rails, or revive retired 2P5L terminology.

## **1\. CANONICAL MATHEMATICAL ANALOGY**

The current canonical DCLM specification establishes: 2 → Mirror 0|1; 5 → FPVVW five nouns; 2⁵ \= 32 → matrix word; Measure → 32 bits; Collapse → AND.  
Reference partition: 4096 \= 2¹² logical pipes. Addressable space: 32 × 4096 \= 2⁵ × 2¹² \= 2¹⁷ \= 131,072.  
This is an ADDRESSABLE COMBINATORIAL SPACE ANALOGY. Not 131,072 GitHub jobs; not 4096 physical workers. The pipe is a logical work address.

## **2\. CORE FACTORY IDEA**

Convert large factory work into many SMALL, INDEPENDENT, HASH-IDENTIFIED WORK UNITS with deterministic identity before execution:  
TASK → Canonical Serialization → TASK\_HASH → PIPE\_ID → CLAIM → EXECUTE → EVIDENCE\_HASH → DCLM → RESULT\_HASH → RECEIPT → Canonical Commit  
PIPE\_ID is a routing bucket. Full TASK\_HASH remains identity.

## **3\. NO-DOUBLE-WORK INVARIANT**

WORK\_KEY \= H(domain \+ specialization \+ jurisdiction \+ organization \+ instance \+ operation \+ source/evidence version \+ relevant state).  
If WORK\_KEY exists as COMPLETED, CLAIMED, or IN\_PROGRESS → DO NOT EXECUTE AGAIN (Record: ALREADY\_SEEN → SKIP).

## **4\. CLAIM BEFORE EXECUTION & SHORT-PIPE PRINCIPLE**

Sequence: DISCOVER → CANONICALIZE → HASH → PARTITION → CLAIM → EXECUTE → VERIFY → DCLM → RECEIPT. If CLAIM fails: STOP.  
Prefer many short bounded tasks over few enormous tasks. Do not force an entire domain harvest into one pipe.

## **5\. ELASTIC PIPE COUNT & GITHUB EXECUTION CONSTRAINT**

4096 is initial reference architecture, separable from physical runner concurrency. Scale elastically based on measured throughput, not appearance.  
Use bounded worker pools, batched partitions, queue consumption, and matrix subsets preserving canonical identity and DCLM fail-closed.

## **6\. COMMIT PRINCIPLE & RECEIPT FIELDS**

NO DELTA → NO WORK COMMIT. REAL DELTA → RESULT HASH → RECEIPT → COMMIT.  
Receipt fields: WORK\_KEY, PIPE\_ID, TASK\_HASH, INPUT\_HASH, EVIDENCE\_HASH, RESULT\_HASH, DCLM\_STATE, WORKER\_ID, CLAIM\_STATE, PARENT\_STATE, TIMESTAMP, SOURCE\_PROVENANCE.

## **7\. DCLM COLLAPSE & CURRENT FACTORY INTERLOCK**

DCLM decides admissibility, not the pipe system. Parallel Execution → Evidence → DCLM → AND Collapse → Canonical State.  
Use existing factory floor and bulletin board channels. Evaluate via: DETECT → CLASSIFY → ROUTE → DCLM TEST → IMPLEMENT ONLY IF VALIDATED → VERIFY → RECEIPT.

## **8\. REQUIRED DCLM TEST & DECISION MATRIX**

Audit repo for: task hashing, work claims, deduplication, receipts, unresolved queues, worker partitioning, serialization bottlenecks, and current throughput.  
Required Decision: Return exactly one of: ALREADY\_IMPLEMENTED, PARTIALLY\_IMPLEMENTED, VALIDATED\_FOR\_IMPLEMENTATION, REQUIRES\_DESIGN, CONFLICT, BLOCKED, REJECTED\_BY\_DCLM.

## **9\. FIRST EXPERIMENT & FINAL LAW**

First run a bounded experiment (32 logical DCLM views × N short work pipes) measuring claim contention, throughput, and prevented duplicates.  
The factory must become faster by becoming MORE DETERMINISTIC, not less. EVIDENCE OVER DECLARATION.