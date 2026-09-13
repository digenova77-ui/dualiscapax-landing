# TeamSnap ONE — notes for Dualis

**Checked:** 2026-09-12  
**URL:** https://www.teamsnap.com/one  
**Announce:** https://www.teamsnap.com/blog/announcements/teamsnap-unveils-teamsnap-one-next-generation-platform-future-youth-sports-technology (Nov 18, 2025)

## What it is
TeamSnap ONE is TeamSnap’s **club / league management product suite** (org-side), not a separate public developer API. Marketing pitch: registration → payments → schedules → comms → coach drills → **built-in livestream + highlights free for every team** → tournaments/websites. Falcon camera marketed for ONE livestreaming.

## Pricing
Quote / org-tailored — no public sticker price on `/one`.

## Dualis implication
- **Our OAuth pipe stays APIv3 + auth.teamsnap.com** (same Client ID we already registered for DualisCapaxICE). ONE is the product families/orgs use; it does not replace Cogsworth OAuth.
- Watch for: if Quinte / OMHA clubs migrate to ONE, schedule + roster objects we pull via OAuth may look the same or evolve — smoke-test after Connect.
- Livestream-in-ONE may eventually compete with / sit beside LiveBarn for Tape — still not a Dualis-hosted CDN; prefer pointers.
- Do **not** buy ONE as Dualis unless running a club ops business — Dualis is athlete seat, not league admin software.

## Related
- `TEAMSNAP-OAUTH.md` — Dualis client + worker token route
- LiveBarn / Hudl partner asks remain for sanctioned tape; ONE livestream is TeamSnap-native

## Dualis later potential (parked 2026-09-12)

Do **not** build now. Product idea only:

Bring **both** tape pipes into Ice Tape when a team has them:
1. **LiveBarn** — venue-mounted VOD / subscribe surfaces (partner ask / deeplink today)
2. **TeamSnap ONE livestream** — phone, RTMP, or **Falcon (~$799)** team camera; live watch free for ONE contacts; replays/clips via TeamSnap+

Dualis role: athlete hub that can **surface / stream-in** whichever pipe the seat’s team actually uses — not host a competing CDN, not force Falcon purchase, not drop LiveBarn.

Bake into roadmap language only until TeamSnap OAuth schedule + seat claim are solid.

### Bring-your-own private web stream (also parked)
Some teams already run **their own cameras** and a **private web stream**. Dualis Tape should later accept that as a third adaptive pipe (bind URL / embed when allowed) alongside LiveBarn and TeamSnap ONE. See `TAPE-PIPES-LATER.md`.

