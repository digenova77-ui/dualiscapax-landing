# UNITY SECURITY TEST RECEIPT — do not apply until AND=1

Captured: 2026-09-16T17:55:00Z
Target: live `cf-pages/js/device-pass.js` SHA 1350840 (v1, 120k) + `unity-bind.js` + `unity-id.js`
Rule: TEST EVERYTHING BEFORE APPLICATION. This folder only.

## Matrix (pass = current behavior is as coded; fail = unsafe if treated as identity)

| ID | Test | Result | Apply? |
|---|---|---|---|
| T01 | Word list size | 420 tokens, 419 unique, dup `lark` | cite |
| T02 | Entropy if generated 8 words | ~69.7 bits | cite |
| T03 | `rand % n` bias | remainder 256 / 2^32 ≈ 6e-8 | negligible |
| T04 | normalize punctuation → 8 words | PASS | keep |
| T05 | reject <8 words | PASS | keep |
| T06 | accept 8× `ice` | PASS (weak phrase allowed) | hole |
| T07 | mintU1 public | always `DC1-H1-0001` | hole |
| T08 | check2 | 10-bit Crockford, not MAC | hole |
| T09 | current phraseOpen trusts sessionStorage | SPOOF OPENS | FAIL — must fix in v2 |
| T10 | proposed ticket bound to vault ct+salt+id | spoof fails, real ticket passes | APPLY after review |
| T11 | attachTeacher without phrase | awaiting_phrase | PASS gate |
| T12 | attachTeacher with spoof session + confirmed JSON | HATCHED | FAIL same as T09 |
| T13 | Look ungated | PASS | keep $0 |
| T14 | PBKDF2 120k SHA-256 | live | below OWASP 310k |
| T15 | est derive time 310k on this REPL | ~0.11s | ok for phone |
| T16 | AES-GCM shape (salt 16, iv 12, WebCrypto) | cite in source | keep |
| T17 | phrase POST to Dualis | not in device-pass.js | keep never-send |
| T18 | CSP / _headers | not found in cf-pages | hole awaiting_csp |
| T19 | WebAuthn required | no | hole |
| T20 | old vault 120k still decrypt after v2 code | NOT TESTED IN BROWSER YET | block apply |
| T21 | Home smash | none this receipt | keep |
| T22 | student names in vault | none | keep |

## AND gate to apply v2 to plate

1. Browser test: create 120k vault, load v2 code, unlock still works
2. Browser test: new vault writes iterations=310000 and v=2
3. Browser test: session spoof without ticket fails phraseOpen
4. Browser test: Look / and /look still 200 without vault
5. Browser test: Ice phrase still unlocks teacher phrase page
6. No Home rewrite
7. No student names

T20 is still 0. **Do not apply device-pass.js to cf-pages this tick.**

## Proposed ticket (sandbox only — not live)

On unlock, write session:
`{id, role, at, ticket}` where `ticket = sha256(ct + id + salt)[:16]`
phraseOpen: compare_digest(ticket, sha256(live_vault.ct + id + salt)[:16])
Spoof without vault ciphertext fails. XSS can still steal after unlock. CSP is the XSS control.

## Pass along to mill

Idle bots: implement v2 in `factory/sandbox/vault/` first. Promote one file only after T20–T21 are 1.
