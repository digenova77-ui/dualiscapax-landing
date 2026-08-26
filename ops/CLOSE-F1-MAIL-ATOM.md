# CLOSE F1 — mail atom (most granular)

**Live fact (propagated):** no `*._domainkey` · SPF = CF only · DMARC = reject+strict · MX = CF Routing  
**Not a propagation lag — records not published.**

## Atom to close

```text
DKIM DNS for dualiscapax.ai  +  SPF authorizes signer  +  signer actually signs
```

## Sequence (Owner organ + Bridge)

### A — Workspace (or SMTP) exists
1. Google Workspace on **dualiscapax.ai** (or SMTP organ chosen)
2. Admin → Apps → Gmail → **Authenticate email** → Generate DKIM
3. Copy **selector** + **DNS host/value** (often CNAME)

### B — DNS publish (CF API token with DNS Edit **or** CF dashboard)
```text
1. {selector}._domainkey.dualiscapax.ai  →  (value from Admin)
2. SPF TXT merge to ONE record:
   v=spf1 include:_spf.google.com include:_spf.mx.cloudflare.net ~all
3. Optional: verification TXT from Workspace setup
4. Optional later: MX cutover to Google when receive path is planned
5. Optional: add rua=mailto:dmarc@dualiscapax.ai on _dmarc (keep p=reject only if send path ready)
```
Bridge: `ops/apiv2/bridges/google_workspace_dns.py` → `workspace_dns_bundle(...)`

### C — Identity
1. Users/aliases **admin@** · **ceo@**
2. Send-as verified if still on Gmail UI path
3. **External** send to a non-Google inbox; read `Authentication-Results`
   - Need: `dkim=pass` with `d=dualiscapax.ai` (aligned under adkim=s)

### D — Close
Chat: **`MAIL_UNITY_CLOSE DONE`**  
Agents: `runtime.law.done` · re-probe DNS · gate F1

## Parallel (do not block F1)
- F2: CF Redirect Rules → **G2 DONE**
- Website/Unity agent plane: already forward

## One line
Publish key → SPF include signer → sign → external pass → DONE.
