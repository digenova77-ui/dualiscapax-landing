# Multi-Provider Identity Verification: Regional Matrix and Adapter Contract

**Status:** Proposed design; not implemented or security-tested.
**Scope:** Provider-neutral identity-verification boundary for DualisCapax.
**Non-goals:** This document does not declare legal KYC compliance, approve any provider for production, or authorize payment movement, account access, or production deployment.

## 1. Design decision

Use a provider-neutral verification orchestration layer. Evaluate Stripe Identity first because Stripe is also a candidate payment provider, with Sumsub and Trulioo as initial cross-provider candidates. Persona is a reserve candidate for workflow flexibility. These are candidates for due diligence, not a claim of universal or objectively ranked “top three.”

Provider eligibility must be confirmed for the actual business location, industry, intended use, and target jurisdictions before implementation or purchase. Document-country coverage is not the same as provider-business eligibility or regulatory sufficiency.

## 2. Initial regional evaluation matrix

| Region / initial market | Primary candidate to evaluate | Independent alternatives | Evidence needed before selection |
| --- | --- | --- | --- |
| Canada / North America | Stripe Identity | Trulioo; Sumsub; Persona as reserve | Canadian business and use-case eligibility; supported provincial IDs; privacy/data residency; false-rejection and retry rates; price; support; AML/sanctions capabilities if required |
| European Economic Area / UK | Sumsub | Stripe Identity where eligible; Trulioo; Persona | Country-specific documents; GDPR/UK GDPR roles and retention; biometric consent and non-biometric alternative; local regulatory suitability |
| APAC | Sumsub | Trulioo; Stripe Identity where eligible; regional provider after country-specific review | Exact country/document coverage; local data residency; local regulatory checks; language and accessibility |
| Latin America | Sumsub | Trulioo; Stripe Identity where eligible; country-specific provider after review | Exact country/document coverage; trusted data sources; local privacy requirements; fraud performance |
| Africa / Middle East | Sumsub | Trulioo; regional provider after country-specific review | Country-level support; document quality; local data availability; sanctions/PEP screening where required; human escalation |
| Global business/entity verification | Trulioo | Sumsub; Stripe Connect onboarding where applicable | Beneficial ownership support; entity registries; jurisdictional availability; data provenance; business verification vs person verification |

**Important:** The table is a procurement shortlist only. It must not automatically route users based solely on geography, nationality, or a vendor marketing claim. The policy must consider where the service is offered, applicable requirements, user consent, risk, and actual provider capabilities.

## 3. Provider evaluation scorecard

Score each candidate from 0–5 and attach evidence and date for every score. Do not compute a “winner” while mandatory eligibility gates remain unresolved.

- Legal and contractual eligibility for the actual use case (mandatory gate)
- Country and document coverage, verified at document-type level
- False-accept and false-reject performance on a representative test set
- Completion rate, latency, retry rate, manual-review rate
- Accessibility, localization, mobile capture, and supported non-biometric path
- Liveness and anti-spoofing capabilities where justified
- AML/sanctions/PEP screening only where required and explicitly in scope
- Privacy terms, data-processing roles, retention, deletion/redaction, subprocessors, data residency
- Webhook authenticity, retry semantics, idempotency, event ordering, and incident response
- Price per completed check, manual review, retries, and support
- Portability and ability to export minimal audit evidence
- Vendor outage, termination, and migration path

No provider should be selected solely on a vendor's claimed global coverage or a market-ranking article. Run an independently reviewed pilot and record the test population and limitations.

## 4. Provider-neutral adapter contract

All provider adapters map vendor-specific states into a small internal result vocabulary:

- pending: verification has started or is awaiting a provider result.
- verified: provider reports the configured check succeeded; this is evidence, not authorization.
- requires_review: result is ambiguous, inconsistent, or needs a trained reviewer.
- not_verified: check failed or could not be completed.
- expired: evidence no longer meets the applicable freshness policy.
- revoked: previously accepted status has been invalidated or withdrawn.
- unavailable: provider cannot be reached or service is not eligible/available.

Required normalized record:

- verification_id: random internal identifier, never a government ID.
- unity_id: internal participant ID, attached only after the account session is authenticated.
- provider: stable provider key.
- provider_session_ref: vendor session identifier, access-controlled.
- purpose: explicit purpose and requested assurance level.
- jurisdiction: applicable service/jurisdiction context; avoid inferring nationality from IP.
- method: document, database, liveness, NFC, business verification, or other explicit check type.
- status: one of the normalized states above.
- reason_codes: allowlisted codes, not untrusted free-form instructions.
- created_at, updated_at, expires_at: UTC timestamps.
- provider_event_id: deduplication key for incoming events.
- policy_version: exact policy version used to interpret the result.
- evidence_ref: access-controlled reference to provider evidence; do not copy raw documents into ordinary app logs.
- consent_ref: evidence of informed consent where required.
- review_ref: reference to human review and decision, if any.

Never store raw identity-document images, full document numbers, selfies, or biometric templates in Unity ID records or normal application logs. Keep the minimum necessary provider reference and audit metadata. Define retention and deletion paths before live use.

## 5. Unity ID and authorization boundary

1. Authenticate the user before creating a verification session.
2. Create a server-side internal verification record and bind it to the authenticated session.
3. Create a provider session on the server; never trust a client-supplied verified flag or arbitrary provider ID.
4. Accept provider outcomes only through authenticated server-to-server webhooks or an authenticated server-side retrieval of the session.
5. Verify webhook signatures; reject invalid signatures; deduplicate event IDs; handle retries and out-of-order events.
6. Resolve the internal verification record and confirm that the event belongs to the expected session and user.
7. Map the provider outcome through the versioned policy; contradictory results become requires_review.
8. Link a verified state to Unity ID using the internal verification ID and provider reference—not by using the provider customer ID as Unity ID.
9. Re-evaluate freshness, revocation, account recovery, and step-up checks when policy requires.
10. Ask Trinity to authorize each protected action independently using principal, action, scope, request ID, and input digest as applicable.

**Invariant:** Verification is evidence about an identity check. It is never, by itself, permission to access a resource, move funds, mint credentials, enroll an agent, or execute a protected action. No provider adapter may call around Trinity or create a parallel authorization path.

## 6. Provider selection and fallback policy

- Select one eligible primary provider for the requested jurisdiction and assurance level.
- Do not send a user's sensitive data to multiple providers by default.
- Retry the same provider only within configured attempt and cost limits.
- Use a secondary provider only when policy permits and there is a documented reason: unsupported document, provider outage, unresolved ambiguity, or independent assurance requirement.
- Obtain any required consent before collecting or sharing data with another provider.
- If providers disagree, stop automatic progression and require review or additional evidence.
- Offer an accessible non-biometric path where feasible and legally required; do not treat refusal of optional biometrics as proof of fraud.
- Provider outage must fail closed for protected actions, but must not erase existing accounts or block safe read-only support.
- Never lower assurance requirements silently to improve conversion.

## 7. Test plan and acceptance gates

Use synthetic fixtures and provider sandbox modes wherever possible. Some vendors may require a real identity check to activate an account; do not upload a real ID merely to test this architecture without informed approval and a reviewed test plan.

Required tests:
1. Valid signed success event maps to verified but grants no authorization by itself.
2. Invalid signature is rejected.
3. Duplicate webhook is idempotent.
4. Out-of-order event cannot roll back a newer verified/revoked state incorrectly.
5. Event for another session or user is rejected.
6. Client-side fake success cannot create a verified record.
7. Provider timeout/outage maps to unavailable and protected actions remain blocked.
8. Conflicting provider outcomes map to requires_review.
9. Expired and revoked evidence triggers policy re-evaluation.
10. Secondary provider is invoked only under a permitted, auditable fallback rule.
11. Logs and Unity ID records contain no raw ID images, document numbers, selfie images, or biometric templates.
12. Account recovery cannot transfer a verified identity link based only on possession of a provider session URL.
13. Consent and retention/deletion workflow is recorded and testable.
14. Every protected action still requires a Trinity allow.
15. Audit record preserves provider, policy version, timestamps, result, reason codes, and evidence reference.

Acceptance gates before production:
- Written confirmation of business/use-case eligibility for each selected vendor.
- Jurisdiction-by-jurisdiction requirements review by qualified counsel/compliance advisor.
- Documented privacy impact and retention/deletion policy.
- Synthetic and sandbox tests pass, including signature, replay, race, outage, and recovery cases.
- git diff --check and relevant repository tests pass.
- Explicit human approval for any live identity collection or production rollout.

## 8. Rollout phases

A. Review this contract and confirm initial market/use case.
B. Implement schema and pure deterministic state mapping with synthetic fixtures only.
C. Implement one sandbox adapter and webhook verification.
D. Run measured pilot and compare eligible alternatives using the same scorecard.
E. Add secondary adapter and fallback routing only after test results justify it.
F. Enable production only after legal/privacy/vendor eligibility and explicit deployment approval.

## 9. Sources to verify during procurement

- Stripe Identity: https://docs.stripe.com/identity
- Stripe Identity supported use cases and locations: https://docs.stripe.com/identity/use-cases
- Stripe Identity before going live: https://docs.stripe.com/identity/before-going-live
- Sumsub ID verification: https://docs.sumsub.com/docs/identity-verification
- Sumsub supported documents and countries: https://docs.sumsub.com/docs/supported-documents-and-countries
- Trulioo identity verification: https://www.trulioo.com/products/identity-verification
- Trulioo multi-region hosting: https://developer.trulioo.com/reference/multi-region-hosting

Vendor documentation and availability change. Re-check the live source and contract before implementation or procurement.
