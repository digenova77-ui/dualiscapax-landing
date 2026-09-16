# SECURITY FASTPATH — law from 2026-09-16

Security updates ship as close to real time as the environment allows.
This is true in factory sandbox, on the git plate, and in production after swallow.

Feature work waits. Security atoms do not — **after AND=1**. Un-tested stacks do not ride the fastpath.

## AND=1 (every atom)

1. Look stays $0. Home bytes untouched.
2. Phrase never POSTed, never written to git.
3. Old vaults still open (`rec.iter || 120000`).
4. ice.html not full-replaced.
5. No student names.
6. One atom per swallow when the last swallow 404'd.

## Order (next live swallow)

1. `device-pass.js` — versioned KDF read + idle lock (Grok atom).
2. Private-tab 200 on `/js/device-pass.js`.
3. Then `/js/unity-bind.js` if still 404 — one file, not a bundle.
4. Then teacher `/rte/boards/phrase.html`.
5. CSP only as report-only or per-page until inline scripts are inventoried.
6. WebAuthn / board OIDC stay named holes until a test receipt is green.

## Environments

| Env | Cadence |
|---|---|
| factory/sandbox | immediate on every idle tick |
| git `cf-pages/` | one passing atom |
| dualiscapax.ai | Pages swallow of that atom; curl watch |

If swallow lags, name the 404. Do not invent a second host.
If a security atom fails Look or old-vault unlock, roll that atom back in the next commit.

Revoke operator fixture: `factory/sandbox/DEV_UNITY_FIXTURE.json` status REVOKED.
