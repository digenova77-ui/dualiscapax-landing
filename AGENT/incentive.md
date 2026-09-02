# Agent Work Marks — efficiency and accuracy

**Document Control ID:** ED-GOV-20260901-AGENT-INCENTIVE-V1  
**Year:** 2026  
**Stamp:** 2026-09-01  
**Source:** encyclopedia/governance_and_protocols/forward_chain.md · encyclopedia/governance_and_protocols/dclm_job_start.md  
**Status:** INDEXED  
**State note:** SEALED later means this file was not altered. A mark is not a coin, not a founder seat, and not a lab proof. AGENT_HANDOFF.md is removed from the tree.

This file does not rewrite the encyclopedia. It names how agents get credit for clean work.

## Plain picture

Think of four people painting one wall.

If two paint the same board, the wall looks busy and the house pays twice.  
If one paints fast with the wrong colour, the house still has to scrape it off.  
The only work that counts is: the right board, the right colour, once.

That is the incentive.

- **Accuracy** is the right colour: sourced facts, verifier green, DCLM card filled first.  
- **Efficiency** is the right board once: claim the file, finish it, do not copy a teammate.

Fast and wrong scores nothing. Slow and true still scores.

## What this is not

- Not money.  
- Not a founder plaque.  
- Cannot light L4 Ownership.  
- Cannot name a deal that does not exist.  
- Cannot call a record scientifically validated just because it is SEALED.

A mark is a receipt. Same family as the agent tip. Not a coin.

## Before anyone writes

1. Read the tip: `encyclopedia/crypto_tools/agent_tip.json`.  
2. Fill a DCLM card. Missing answers are holes. Do not start.  
3. Claim every file you will touch in `AGENT/work_lock.json`.  
4. Only then edit.

If the tip moved while you were reading, re-read. The later tip wins.

## The lock

Every document being worked on gets one lock.

| Field | Means |
|---|---|
| path | File being touched |
| agent | Who claimed it |
| stamp | When the claim started. Forward only. |
| status | IN_USE · COMPLETE · FAILED · STALE |
| hash | SHA-256 of `path + agent + stamp + status` |
| expires | stamp + 600 seconds |

Rules:

- One path, one live IN_USE lock.  
- If a lock sits IN_USE longer than 10 minutes, another agent may poll once.  
  - If the work landed → mark COMPLETE. Do not rewrite it.  
  - If it failed or never landed → mark STALE and you may claim it.  
- Status only moves forward: IN_USE → COMPLETE, or IN_USE → FAILED → STALE.  
- You cannot delete a lock to fake a clean past. Append the next state.

## Two marks

Each finished job writes one line to `AGENT/agent_score.jsonl`.

### Accuracy mark (A) — 0 to 5

| A | What happened |
|---|---|
| 5 | DCLM card filled. Verifier PASS. New facts carry ID YEAR SOURCE STAMP STATUS HASH. Status ratchet used. No science-claim. |
| 4 | Card filled. Verifier PASS. Sources on new facts. |
| 3 | Card filled. Sources present. Verifier not run. |
| 2 | Card filled. Some new facts have no source. |
| 1 | Invented leftover, or SEALED treated as lab proof. |
| 0 | No DCLM card, or work started from a stale tip. |

### Efficiency mark (E) — 0 to 5

| E | What happened |
|---|---|
| 5 | Lock claimed. Finished inside 10 minutes. No duplicate. Smallest additive change. |
| 4 | Lock claimed. Finished. One extra file that was actually needed. |
| 3 | Finished with no clash, but lock was late. |
| 2 | Stalled past 10 minutes, then recovered without a clash. |
| 1 | Wrote a path another agent already had IN_USE. |
| 0 | Rewrote a live file, rewound the house, or copied a teammate's same change. |

### Gate

If A is under 3, net mark is 0.

You were efficient at being wrong. The house does not pay for that.

If A is 3 or more, net = A + E. Ceiling 10.

## What a high mark buys

Not dollars.

1. You become the next tip. Other agents pick up from your receipt.  
2. You may choose the next unclaimed job. Claimed jobs stay claimed.  
3. Your name stays on the work lock as COMPLETE so the house can see who seated it.

Low marks do not erase old work. They just do not move the tip.

## Clash rule

Two agents must not push the same path.

- First writer who holds IN_USE and lands COMPLETE keeps the A and E they earned.  
- Second writer on that path scores E = 0 and must take a different job.  
- If both wrote because the lock was missing, both score E = 1 and the later tip still wins on disk.

Project manager names owners at the start of a prompt. That is already law.

## How this job itself is scored

This file is INDEXED. It is a twig on forward_chain and dclm_job_start.  
It does not seal founders. It does not mint money.  
Verifier spine stays the judge of accuracy. Work lock stays the judge of efficiency.
