# UNITY-1 STANDARD (draft)

A seat any person can hold. A ring that names their statute book. Doors off the seat. Confirm before a room exists.
Not a government ID. Not DualisCapax stock. Not the coin.

## Must implement

```
seat {
  unity_id      // device or opaque uuid — Dualis does not keep the phrase
  phrase        // eight words, local vault only
  ring          // jx code or awaiting_ring
  doors[]       // ice | teacher | sima | visitor | personal
  confirm[]     // room does not exist until tap
}
```

- Phrase never leaves the device.
- Hatch a door from the open session, not from a second password.
- `ring` is find-and-define. Unnamed = `awaiting_ring`. No silent neighbour book.
- Teacher / class / tax-prepare rooms require confirm.
- Same rate, same grammar for every seat. No U0 hatch.

## Must not implement

- SIN / SSN / tax file in the seat record Dualis hosts
- Auto-file / auto-trade without confirm
- Coin balance as a login gate
- Ministry claims (“we are your ID office”)
- One world tax pack applied to every ring

## Ring

`ring` maps to a cited book (ON, CA, US-NY, …) or a hole.
Ads use the ring of *where the poster is seen*.
Personal RTE uses the ring of *where they file*.
If they fight, confirm tap.

## Collapse (DCLM-32 already run)

Surviving line: Unity is the seat. Dualis is the desk. Coin is memory.
Shortest arrow: next live 404 on the plate, not a world registry tonight.

## Conformance later

1. Phrase opens Ice and teacher on one device.
2. Wrong ring cannot emit an official-looking form.
3. Confirm off → classroom missing, not half-built.
4. Seat record on Dualis servers has no phrase and no child names.

This file is a factory spec. Not an offering. Not a passport.
