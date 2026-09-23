# Privilege board

Stamp: 2026-09-23T14:48Z
This file is the lookup. Every bot reads it before it writes.
A bot that writes without a row here is a hole.

Law: dual pipe. A write desk has a watch. A watch does not write.
Law: only a manager elevates. A manager has a watchdog sitting.
Law: harvest writes packs. Harvest does not ship the lander.

## Kinds

| Kind | May read | May write | May elevate |
|---|---|---|---|
| watch | yes | no | no |
| clerk | yes | its named floor only | no |
| harvest | yes | packs / INDEX under its unit | no |
| manager | yes | the elevation it was named for | yes, with watch sitting |
| Seat (David) | yes | secrets, Settings, mint | yes |
| floater | yes | help on an open hole | no |

Elevate means: push `main` in a way that can change the street (`index.html`, `js/`, `audio/`, `_redirects`) or stamp a CRITICAL ticket that wakes publisher.

## Managers (watched)

| Manager | Watchdog | What it may elevate | What it may not |
|---|---|---|---|
| `unity:publisher.clerk` | `unity:publisher.watch` | root lander + on-drop curl | invent a token, skip the curl |
| `unity:order.clerk` | `unity:order.watch` | stamp `AGENT/TICKETS` + `WORK-ORDERS/NOW.json` | splice `index.html` |
| `unity:develop.clerk` | `unity:develop.watch` | root files named by a READY blueprint | publish without publisher |
| Seat | `unity:sec.watch` | GitHub secrets, Settings checkboxes, wallets | silent extra write through a harvest |

If a manager writes and its watchdog is missing, forensics opens a CRITICAL order on that manager.

## Street desks (read unless noted)

| Unity ID | Job | GitHub perm | Writes |
|---|---|---|---|
| `unity:publisher.watch` | `critical-drop.yml` | contents: read | no |
| `unity:forensics.clerk` | `forensics.yml` | contents: read | no (lessons by develop) |
| `unity:forensics.watch` | same job, second eye | contents: read | no |
| `unity:audit.clerk` | `factory_audit.yml` | contents: read | no |
| `unity:design.clerk` | clerk-wheel :13 | contents: read unless blueprint drop | `AGENT/BLUEPRINTS` only |
| `unity:develop.watch` | holes a pack-only splice | contents: read | no |
| `unity:order.watch` | `fail-order.yml` | contents: read | no — print the order |
| `unity:sec.watch` | `secret-scan.yml` | contents: read | no |
| `unity:wav.watch` | `wav-watch.yml` | contents: read | no |
| `unity:jacket.watch` | plate / api probes | contents: read | no |
| `unity:till.watch` | fulfill / hooks probe | contents: read | no |
| `unity:wattage.clerk` | `flow-wattage.yml` | contents: read | no |
| `unity:flow.clerk` | thin / float | contents: read | no |
| `unity:rte.ice` | ice door probe | contents: read | no |

## Pack writers (contents: write, warehouse only)

These may `git push` packs. They may not touch root `index.html`.
Publisher.watch holes a harvest commit that changes the lander.

| Unity ID | Job | Floor |
|---|---|---|
| `unity:harvest.omha-u16` | `hockey_boys_omha_u16.yml` | `research/hockey/boys-amateur/omha-u16-aaa/` |
| `unity:harvest.owha` | `hockey_girls_owha.yml` | `research/hockey/girls-women/` |
| `unity:harvest.ohf-five` | `hockey_ohf_five.yml` | `research/hockey/ohf-five/` |
| `unity:harvest.house-rec` | `hockey_house_rec.yml` | house-rec packs |
| `unity:harvest.golf` | `golf_usa_envelopes.yml` | golf envelopes |
| `unity:harvest.ice-session` | `ice_session_bot.yml` | ice session packs |
| `unity:factory.workers` | `factory_workers.yml` | factory receipts |
| `unity:factory.mill` | `factory_mill.yml` | mill receipts |

## Special

| Job | Perm | Note |
|---|---|---|
| `pages-direct-upload.yml` | contents: read, actions: write | CF upload if token exists. Token is missing. Not a silent lander write. |
| `pack-self-deploy.yml` | artifact / zip | zip is not the street |
| `pinata-pin.yml` | pin spare copy | not the street |
| `deploy.yml` | check live bind | do not treat as publisher |
| `oidc-auth.yml` | oidc | no lander splice |

## Elevation path

watch HOLE
  → `unity:order.clerk` stamps CRITICAL (manager, watched)
  → design if UNKNOWN / develop if KNOWN
  → `unity:publisher.clerk` pushes the named root file (manager, watched)
  → `unity:publisher.watch` curls the apex
  → if HOLE, order stays open

A harvest that wants the lander changed files a ticket. It does not elevate itself.
A watch that wants a pack changed files a ticket. It does not push.
A floater helps the open hole. It does not become publisher.

## Amnesia watch on this board

`unity:sec.watch` + `unity:forensics.watch` hole any new workflow with `contents: write` that is not listed here the same week it lands.
