# CHILD_CARD — device only

A class list is names. A desk is cards.
Cards never leave the phone. Never git. Never Look. Never coin.
Dualis does not invent a child, a mark, or a home.

## Schema (`dc.sara.g2.cards`)

```
{
  id: "c" + createdAt,
  name: "First L.",          // teacher typed
  marks: "",                 // Growing Success notes, not a ministry markbook
  home: "",                  // only what she chooses to remember; not a social score
  classmates: "",            // how they work with the room
  learn: "",                 // how they learn, as she saw it
  next: "",                  // next step she will try
  at: iso
}
```

Forbidden in this object: OEN, health number, address, photos, parent phone, chart IDs.
If a field is empty, that is a hole, not a zero personality.

Wipe = localStorage remove. Dualis cannot restore.
