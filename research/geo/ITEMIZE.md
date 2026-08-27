# Itemize — no compress
2026-08-26 22:53 EDT

Do not compress the archive to make it pretty.
Small n is the reason to go **more** granular, not less. Few movers means each line is the model. Skipping a line because "there are only twelve camps" deletes the model.

## Dedup (allowed)

- Same legal name / same OCN / same federal corp number appearing twice
- Same cite pasted twice
- Trade-name row that later locks to a legal name already held — merge into one instance, keep both names

## Dedup (forbidden)

- Two restaurants sharing a cost because they are both food
- A Belleville garage using a Toronto garage's line
- Sector average standing in for a missing cell

Sector is a **filter** for the queue (Deep does one NAICS). It is not a blender.

## Item

Every proved cell, M-possible, pointer, empty shelf, and unsearched shelf is an item with a name.
If it does not have a name it will get compressed by accident.
