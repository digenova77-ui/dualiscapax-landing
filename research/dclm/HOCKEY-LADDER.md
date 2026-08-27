# DCLM hockey specialization ladder
2026-08-26 21:49 EDT

Sector: `tweak.sport.ice_hockey`
Each row below is a tweak. Same sector. Different n, k, complexity, style, wait.
NHL weights do not score house league. AAA weights do not score the NHL.
Drop any row → hockey sector empty → `dclm.base`.

## Amateur / developmental

| id | notes |
|----|-------|
| tweak.sport.ice_hockey.house | rec, thin box, acuity = shift not line-matching |
| tweak.sport.ice_hockey.select | one step up, still limited tracked stats |
| tweak.sport.ice_hockey.A | |
| tweak.sport.ice_hockey.AA | |
| tweak.sport.ice_hockey.AAA | declared pack; instance WAIT for schedule drop |

## Canadian junior (CHL is a parent, not a substitute for its leagues)

| id | notes |
|----|-------|
| tweak.sport.ice_hockey.CHL | parent only — do not score a CHL game without the member league |
| tweak.sport.ice_hockey.OHL | Ontario Hockey League |
| tweak.sport.ice_hockey.WHL | |
| tweak.sport.ice_hockey.QMJHL | |

## College / other junior-pro

| id | notes |
|----|-------|
| tweak.sport.ice_hockey.NCAA_D1 | |
| tweak.sport.ice_hockey.ECHL | |
| tweak.sport.ice_hockey.AHL | |
| tweak.sport.ice_hockey.KHL | |
| tweak.sport.ice_hockey.NHL | |
| tweak.sport.ice_hockey.pro_other | named league required before score |

## Load rule

Classify to the **narrowest** id the instance supports.
A AAA weekend does not load NHL. An OHL game does not load as generic CHL if the member league is known.
Peer smash only inside the same specialization, or against a declared parent when the child has no peers yet (and label that as parent-grain, not child-grain).

Unknown league → `tweak._pending.ice_hockey.<slug>` WAIT.
No kid name or team on the public site.
