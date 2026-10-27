# Trinity-First Decision Procedure

**Status:** proposed operating procedure  
**Purpose:** ensure architecture and product decisions follow governing law, explicit logic, and evidence rather than assumptions or vendor defaults.

## Governing principle

Trinity is the sole authorization gate for protected actions. This document describes a decision procedure for design and engineering; it does not replace, weaken, or independently implement Trinity's actual authorization mechanism.

## Decision sequence

1. **State the question.** Define the decision, intended outcome, scope, and affected parties.
2. **Identify applicable law.** List the relevant Trinity invariants, permissions, prohibitions, and required evidence.
3. **Define the terms.** Remove ambiguous language; state assumptions explicitly.
4. **Derive constraints.** Determine what must be true for any candidate solution to be admissible.
5. **Generate candidates.** Consider multiple implementations, including doing nothing, delaying, or rejecting the request.
6. **Reject violations.** Any candidate that violates a binding invariant is inadmissible, regardless of convenience, cost, popularity, or claimed benefit.
7. **Compare admissible candidates.** Evaluate correctness, security, decentralization, reversibility, cost, availability, privacy, and complexity.
8. **Test falsifiable claims.** Use deterministic tests, adversarial cases, independent review, and observable evidence.
9. **Choose the least-authority sufficient solution.** Prefer the smallest reversible change that satisfies the requirements without creating unnecessary privileges or dependencies.
10. **Record the decision.** Preserve the question, applicable law, assumptions, candidates, rejected options, evidence, residual risks, and decision owner.
11. **Re-evaluate when evidence changes.** New facts may change the preferred implementation, but cannot silently repeal governing law.

## Fail-closed rule

If authority, evidence, or the applicable policy is missing or contradictory, do not infer permission. Stop the affected protected action, report the missing condition, and follow an explicitly authorized recovery path.

## Separate facts from judgments

Each decision record must label:
- **Verified fact:** supported by reproducible evidence.
- **Assumption:** plausible but not yet verified.
- **Inference:** follows from stated premises.
- **Proposal:** candidate design not yet implemented.
- **Implemented:** present in a named revision or deployed artifact.
- **Validated:** passed specified tests under recorded conditions.
- **Unknown:** insufficient evidence to conclude.

## Autonomy boundaries

Automation may execute only within explicit permissions, budgets, time limits, and risk bounds. A model or agent may recommend a candidate but cannot grant itself authority. High-impact actions, upgrades, treasury control, and irreversible external effects require the authorization policy defined for those action classes.

## No appeal to labels

Calling something logical, decentralized, autonomous, secure, or lawful is not proof. Claims must be tied to explicit definitions, evidence, and tests.

## Review question

For every proposed step, ask:

**Does this follow from the governing law and verified premises, and can we demonstrate that the implementation obeys it?**

If not, do not treat it as established.
