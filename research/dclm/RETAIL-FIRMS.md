# DCLM retail firms — own tweak, subtract, never amalgam
2026-08-26 21:52 EDT

Amazon tweak stays Amazon.
On a Walmart drop: mint `tweak.business.consumer_discretionary.retail.walmart`.
Do not copy the Amazon parent and rename it.

## Subtract

Start from a thin retail parent (offer, inventory, store-or-FC, last-mile, return, labor, policy).
Add only functions Walmart actually runs and Dualis can validate.
Remove Amazon-only rows this instance does not operate (e.g. AWS as a core Amazon meter — not a Walmart meter unless that instance truly runs an equivalent cloud residual).
Stores vs marketplace mix is Walmart-shaped, not Amazon-shaped.

A meter Walmart does not operate is not weighted at zero on an Amazon clone. It is **absent** from the Walmart tweak.

## Firm 3

Mint `tweak.business.consumer_discretionary.retail.<firm3>`.
Own name. Own function list.
Smash against Amazon and Walmart tweaks only to see which meters **drop** (present in 2+ and actually operated + filled).
Shared meter ID required. Story correlation is graft.

Firm 3 is not turned into Amazon, Walmart, or Am-Mart.
Am-Mart = amalgam pack. Forbidden.

## Drop test

After smash, leftover meters that only one firm owns stay on that firm's tweak.
Meters all three own and can fill may sit on the thin retail parent.
Drop any firm tweak → parent if present → `dclm.base`.

## Honest bound

No Walmart or Amazon internal feed tonight. All firm scores WAIT.
Public 10-K language is P1 only if cited. Department weights stay empty until measured.
