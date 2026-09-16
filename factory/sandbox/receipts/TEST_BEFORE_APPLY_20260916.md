# TEST BEFORE APPLY — 2026-09-16 17:55Z

Law: do not push vault v2 / CSP / phrase-bound mint onto `cf-pages/` until this receipt is green.

## Live plate curls

| Path | Result | Gate |
|---|---|---|
| `/` | Home loads | PASS |
| `/look` | Look, no phrase | PASS |
| `/portal` | Make / Open / I already have my words | PASS |
| `/ice` | Ice loads | PASS |
| `/curtain` | Mint Unity ID $0 with no phrase | PASS-page / FAIL-security |
| `/unity` | U1 `DC1-H1-0001` operator seat, no phrase field | PASS-page / FAIL-uniqueness |
| `/rte/unity/` | 404 | FAIL |
| `/rte/boards/` | 404 | FAIL |
| `/rte/boards/phrase.html` | 404 | FAIL |
| `/js/unity-bind.js` | 404 | FAIL |
| `/rte/easthill/` | 404 | FAIL |

## Git static (device-pass.js still v1)

| Check | Result |
|---|---|
| PBKDF2 iterations | 120000 — FAIL vs 310000 target |
| Versioned iters on record | missing — old vaults would break if we only bump |
| Idle lock | missing |
| create() overwrite guard | missing |
| Word list `lark` duplicate | present |
| Phrase sent to Dualis | not in this file — PASS |
| UnityID.mintU1() unique | FAIL — constant DC1-H1-0001 |
| UnityBind.hatch without phrase | refused in git — not live |
| DC_UNITY.mint without phrase | allowed — FAIL |
| Teacher confirm spoofable localStorage | FAIL (expected for $0 local) |

## AND gate (all must be 1 before apply)

- [ ] Live 200 on every path a commit would touch
- [ ] Old 120k vault still decrypts after any KDF change
- [ ] Wrong phrase fails closed (AES-GCM)
- [ ] Mint refused unless `DCVault.session()` is open
- [ ] Look still $0 / Home + ice.html bytes unchanged
- [ ] No student names in the commit
- [ ] Private-tab retest after swallow

**Verdict: DO NOT APPLY.**
Teacher door and Unity bind exist in git `cf-pages/` and are 404 on dualiscapax.ai. Hardening a 404 is not security.
