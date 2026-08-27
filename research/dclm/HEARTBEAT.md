# Firm heartbeat
2026-08-26 22:07 EDT

Dualis does not declare a firm dead because a crawl missed it.
Unknown ≠ dissolved.

## States

| state | meaning |
|-------|---------|
| LIVE | at least one P1 pulse inside the window |
| QUIET | last P1 pulse older than the window; legal status still active |
| UNKNOWN | no pulse, no dissolution. **Default.** |
| LEGAL_DEAD | registrar / court dissolution or bankruptcy order |
| LEGAL_ACTIVE_NO_PULSE | register says active, nothing Dualis can hear |

UNKNOWN never becomes LEGAL_DEAD by timeout.
LEGAL_DEAD never becomes LIVE from a Facebook page.

## Pulse rank

P1 (can keep LIVE):
- provincial / federal registry status = active + recent annual return
- SEDAR/EDGAR filing in window
- Corporations Canada last-annual-return date in window
- Open-data licence / GST/HST public listing still current (where published)
- corporate site DNS + TLS cert still issued to that legal name (supporting, not sole)

P2 / M (can move UNKNOWN → QUIET, cannot kill, cannot alone prove LIVE):
- job post under the legal name
- news under the legal name
- official social account that matches the legal name and points at the same domain
- self-declared "we are open" on a page Dualis does not control

Social is a whisper. Registrars are a pulse. Selfies are not dissolution.

## Window

Default listen window: 18 months (covers a missed annual return without executing the firm).
StatCan openings/closures are monthly — use them as **count** deltas, not as named death certificates.
"Almost real time" = registry dumps (federal daily) + domain/TLS check + filing feeds. Not a human watching every municipal sole prop.

## Gap this owns

Register says active ↔ no filing ↔ social still posts.
That triple is a Dualis join, not a kill switch.
