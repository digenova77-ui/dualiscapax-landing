# Iris UI × engine — Dual Primary Five Layer audit (internal)

ED-COM-20260912-IRIS-DCLM · Internal only. Public surface keeps **DCLM** wording (2P5L term retired on face).

## Frame
- **Dual Primary (2P):** Pole A = Human channel (athlete / operator). Pole B = System channel (Iris engine / sensors / KB).
- **Five Layer (5L):** L0 Law → L1 Sense → L2 Intent → L3 Act → L4 Bind.
- Full grid = **2 × 5 = 10 poles**; expanded 2⁵-style sweeps = check each layer for both primaries and their failure modes (~32 reads when you fan conflict / residual / cleanup / force).

## Scoreboard (Iris Spark redesign + ice handoff)

| Layer | Human primary | System primary | Verdict |
|---|---|---|---|
| **L0 Law** | NO_FORCE sensors; opt-in mic/cam/screen; soft iOS screen notice | CLEANUP_FIRST on stop; TRUTH_OR_NOTHING on prompts (echo KB, no invented grades) | **Hold** — screen `alert()` mostly replaced; still a few alert() paths on mic HTTPS |
| **L1 Sense** | Orb states: YOU listening / IRIS speaking / channel open | Mic STT + TTS + optional cam; screen often dead on iPhone | **Improving** — orb wired to listening/speaking; need live waveform only when channel open |
| **L2 Intent** | Starters execute on tap (one chat stage) | `submitSuggestedPrompt` → `processIrisPrompt` (bug fixed: was calling undefined `text`) | **Hold** — replace-turn mode reduces session bloat |
| **L3 Act** | Spark dock: cam / screen / orb / voice / clear + Ask | IrisHandoff + house KB; follow-ups still sometimes navigate away | **Watch** — follow-up jumps to other pages break “one ice” feel; prefer in-chat act |
| **L4 Bind** | Ice / À La Carte / Leak / Runtime chips | TeamSnap/Spordle claim on ice portal; founder pay-skip only | **Hold** — lander ALC section + ice claim path aligned |

## Residuals (what DCLM still sees)
1. **Dual-path conflict:** Chat replace-mode vs follow-up navigation — pick one primary for “act” (stay in chat unless bind requires a room).
2. **Sensor chrome:** Optical viewfinder + Landauer essay still heavier than Spark; keep sensors behind dock until open.
3. **STT gaps:** Firefox / some iOS — orb can open mic but no speech-to-text; copy must say “type it” without alarming.
4. **Public lexicon:** Say **DCLM** on lander; Dual Primary Five Layer is operator/internal.
5. **Proof:** Orb `id` was mismatched (`irisOrb` vs `micInputBtn`) — fixed; verify on device that listening/speaking classes paint.

## Recommendation
Ship the Spark dock + orb channel states + ALC lander section. Next DCLM pass: force follow-ups to in-chat only, and gate cam/screen UI until the dock button opens the channel.
