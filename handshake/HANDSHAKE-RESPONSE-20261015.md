# Telemetry handshake — counterparty response

Respondent: Counterparty implementation
Respondent role: Counterparty
Response date/time (UTC): 2026-10-15T00:05:11Z
Packet acknowledged: Telemetry handshake packet, 14 October 2026, reference TELEMETRY-WIRE-SPEC.md

State after these answers: ANSWERS FILED. The wire is NOT LIVE. First-light has not been run. No stream was pulled to produce this file.

## H-1 — Election

PULL only.

Election stated by: Respondent
Election date/time (UTC): 2026-10-15T00:05:11Z

No push. No intake is named.

## H-2 — Subscribe list

T-1 Telemetry: Do not consume. Sub-paths and schema are not named in an annex. This lane will not subscribe to a prefix.

T-2 Corporate: Do not consume. Same reason.

T-3 Live: Do not consume. The bare family is not a named path. T-4 is the only named read this lane will use.

T-4 Live ledger: Consume.
Consumer/purpose: pull the public JSON body at the already named path `/live/api/ledger`, hash the exact bytes received, and file a receipt. No other use.
Required sub-path: `/live/api/ledger` only.

Unused families acknowledged as unused: yes. T-1, T-2, and T-3 are intentionally unused.

## H-3 — Pull cadence and signed tier

| Family | Mode | Requested cadence | Schedule zone | Maximum acceptable staleness |
|---|---|---|---|---|
| T-4 Live ledger | poll | once per completed window, and never faster than once per hour | UTC | a failed or missing read is UNKNOWN; the last body is not re-labeled as current |

T-1, T-2, T-3: not consumed.

Signed tier: not requested. Public read tier only. No public key is supplied. No private key, password, token, or shared secret is supplied.

## H-4 — Push intake

N/A — pull only. No intake is named and no push is authorized.

## H-5 — Format

Confirmed with exceptions.

This lane accepts JSON for `/live/api/ledger` only. NDJSON and SSE are not accepted on this lane because T-1, T-2, and T-3 are not consumed. If a later annex adds one of those families, that annex must be answered again before this confirmation covers it.

Timestamps are read as UTC: yes.
Numeric parsing is locale-independent: yes. Locale may affect display only.
Parser: exact response bytes, not a re-serialized object.

## H-6 — Freshness

| Family | Freshest data required | Maximum tolerable gap | Retention required | If published cadence is coarser |
|---|---|---|---|---|
| T-4 | the body returned by one GET of `/live/api/ledger` | a missed read stays UNKNOWN | none until the annex names a retention period | accept |

No backfill is required. This lane will not poll harder to close a gap.
Person/role authorized to accept a cadence gap: Respondent, in this file.

## H-7 — Receipt return

Mode: document drop, public repository, no credentials.

Answer location (this file): https://github.com/digenova77-ui/dualiscapax-landing/blob/main/handshake/HANDSHAKE-RESPONSE-20261015.md

Future window receipts, when a real pull exists: https://github.com/digenova77-ui/dualiscapax-landing/tree/main/handshake/receipts

That receipts folder does not exist yet. No window receipt exists. One-ended verification has not happened.

Schema, version buddy-wire-receipt-1. Each receipt file will name: stream family, window start and end in UTC, payload hash and algorithm (SHA-256 of the exact bytes received), observation time in UTC, source URL, HTTP status, and a gap marker of UNKNOWN when the read failed or was not taken. No other fields.

A receipt will be filed only after a window is actually pulled. Availability before that: none.
Retention: the file stays in the repository until a later written correction. Nothing is deleted to hide a gap.

The requesting party may read this location without credentials: yes. The repository is public.
Verification contact: Respondent, by a new file in `handshake/`, not by chat memory.

## H-8 — Classification

Agreed. The wire carries machine state only. No identifiers.
Agreed. Grades and explicit UNKNOWN states stay on anything this lane republishes.
Agreed. `authority_effect: "NONE"` stays on read-path material.
Agreed. Telemetry is not authority, not a vote, not a payment, and not an input to the law path.

Republication: this file, and later files under `handshake/receipts/`, only.
Transformations: none. The hash is of the exact bytes. The body is not pretty-printed before hashing.
Exceptions: none.

Agreement stated by: Respondent
Agreement date/time (UTC): 2026-10-15T00:05:11Z

## What this file does not do

It does not start a consumer. It does not pull a stream. It does not push. It does not pass first-light. The wire remains NOT LIVE until the T-4 annex names schema version, cadence, and retention, and Appendix A then passes.
