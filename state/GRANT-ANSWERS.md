# GRANT ANSWERS (locked)

Operator: **YES TO ALL THAT HELP** — 26 Aug 2026  
**G2:** **EXECUTE AUTHORIZED** — 26 Aug 2026 14:03 EDT

| ID | Question | Answer | Scope |
|----|----------|--------|-------|
| **G1** | Redirect dualiscapax.com + www → https://dualiscapax.ai (301) | **YES · EXECUTE** | dualiscapax.com zone |
| **G2** | Cloudflare API token / zone edit for Dualis redirects | **YES · EXECUTE AUTHORIZED** | Token artifact still required for agent API path |
| **G3** | Gmail Send-as admin@ + ceo@ | **YES** | Operator UI |
| **G4** | Agents send as after G3 | **YES** | Connected Gmail |
| **G5** | Standing law | **YES** | Dualis realm |
| **G6** | Connected Google only | **YES** | Dualis only |
| **G7** | Realtime auto-send | **YES SEND** | Automation live |

## G2 execute package (authorized)

**Targets (301 / 302 permanent preferred):**

| From | To |
|------|-----|
| `https://dualiscapax.com/*` | `https://dualiscapax.ai/$1` |
| `https://www.dualiscapax.com/*` | `https://dualiscapax.ai/$1` |
| `http://dualiscapax.com/*` | `https://dualiscapax.ai/$1` |
| `http://www.dualiscapax.com/*` | `https://dualiscapax.ai/$1` |
| `https://ratio-dualis.com/*` | `https://dualiscapax.ai/$1` |
| `https://www.ratio-dualis.com/*` | `https://dualiscapax.ai/$1` |

**Agent status:** No Cloudflare tool connected · no `CF_API_TOKEN` in environment · cannot call CF API until token is supplied once (zone DNS/Page Rules/Redirects edit only).

**Operator one-shot (no further YES):** paste token with Zone · Redirect · DNS edit for Dualis zones, **or** apply rules in CF dashboard; then reply `G2 DONE`.
