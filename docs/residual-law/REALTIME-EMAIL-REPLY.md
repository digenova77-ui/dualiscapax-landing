# REALTIME EMAIL REPLY

**Status:** Automation created 26 Aug 2026  
**Name:** `dualis-admin-inbound-realtime-reply`  
**Trigger:** Gmail `new_email` → to `admin@dualiscapax.ai` or `ceo@dualiscapax.ai`

## Law

Users should not wait on human eyes for a first substantive answer.  
A 24h / 3–5 business day ack is **unacceptable residual**.  
Target: full-context reply in the window others only acknowledge receipt.

## Flow

1. New mail to admin@ / ceo@ (Cloudflare → connected Gmail)  
2. Automation runs Dualis model  
3. Answer every ask · visitor eyes · residual honesty  
4. Threaded send to original sender  
5. Prefer `from: admin@dualiscapax.ai` when Send-as is live (G3); else connected account + Admin signature

## Skip

noreply · mailer-daemon · pure spam · empty non-asks · our own auto-replies

## Not

Securities offers · cure claims · FOMO · invented facts

## Operator residual

G3 Send-as still required for native admin@ From header.
