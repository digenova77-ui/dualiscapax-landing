# DMARC SCOREBOARD (internal)

**Status:** Dualis-native · Grafana **not required**  
**Domain:** dualiscapax.ai  
**Policy (public DNS):** `p=reject` · SPF = Cloudflare inbound only  
**Goal:** Same visibility as Grafana DMARC dashboards — pass/fail/reject by source — under residual law.

## Law

Outbound that claims Dualis must **prove** it (SPF and/or DKIM aligned).  
`p=reject` means failed proof does not deliver.  
Scoreboard closes the gap before we treat admin@ From as production.

## Pipeline (no Grafana)

```
rua@ (when published)
  → save .xml.gz
  → parsedmarc -o ./out   (or agent parse)
  → state/dmarc-latest.json
  → ops/dmarc-scoreboard.html  (this system’s UI)
```

Grafana remains optional if Operator already has it; agents default to **internal** scoreboard.

## DNS residual

| Item | Need |
|------|------|
| `rua=mailto:…` on `_dmarc.dualiscapax.ai` | Collect aggregate reports |
| Outbound SPF include (Workspace or SMTP) | Legit send path passes |
| DKIM for send path | Alignment under strict DMARC |
| G3 Send-as | Gmail From: admin@ |

## Metrics (Grafana-equivalent)

| Panel | Meaning |
|-------|--------|
| Volume by day | count |
| SPF / DKIM / aligned | pass vs fail |
| Disposition | none / quarantine / **reject** |
| Top source IPs | who sent as us |

## Operator

Grafana access is **optional**. Prefer this file + `ops/dmarc-scoreboard.html` + `state/dmarc-latest.json`.
