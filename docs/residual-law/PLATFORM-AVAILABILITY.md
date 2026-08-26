# PLATFORM AVAILABILITY — not our panic

**Status:** 26 Aug 2026  
**Parent:** NO-AGENCY-HANGING · UNITY-TOS-INTERNAL · dual-TOS

---

## Default assumption

If a **repository**, **connected account**, or **vendor organ** is unavailable:

> **Assume it is *their* problem (platform/vendor), not Dualis’s** —  
> **unless** investigation shows it is **our** misconfig, billing, revoked grant, or wrong edge.

| Finding | Action |
|---------|--------|
| Their outage / API blip / rate limit | Hang **justified**: `HANG: vendor availability` · work other planes · retry later |
| **Our** problem (bad token, wrong zone, DNS we broke, disconnected grant) | **Hold** that edge · fix or escalate to Owner with named reason |
| Unknown | Probe once · do not invent capacity · do not blame Dualis theory |

---

## Domains under construction or public stress

If a domain we work with is:

- **Under construction** (e.g. Squarespace Coming Soon), or  
- Appears **attacked / overwhelmed** by public traffic, or  
- Showing **capacity behavior we do not understand**

→ **Do not equip capacity we do not understand.**  
→ **Hold** aggressive redirects, load experiments, or “fix it harder” automation.  
→ Keep **.ai** and known-healthy planes as primary.  
→ Owner may still apply planned 301s when intentional; agents don’t thrash an opaque failure mode.

---

## Agency rule

Unavailable vendor ≠ unjustified agent hang.  
Reason string: `HANG: vendor availability (not Dualis)` or `HANG: our misconfig — hold`.

---

## One line

**Their downtime is theirs until proven ours; under construction or unknown public load — hold, don’t equip capacity we don’t understand.**
