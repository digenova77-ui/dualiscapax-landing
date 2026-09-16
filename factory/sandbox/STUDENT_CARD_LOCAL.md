# STUDENT CARD — local only

Class list is an index. Each name opens a card.
The card lives in `localStorage` on her phone after phrase unlock.
It never enters git, Drive-as-SoR, Dualis servers, or a coin receipt.

Dualis does not invent children. Empty class → no cards.
Official marks / IEP / OSR stay with the board. This is her working copy.

## Record (`dc.sara.g2.card.${name}`)

```
{
  name: "first + last initial",
  learning: { style: "", strengths: "", needs: "", language: "" },
  marks: [{ subject, level: "4|3|2|1|R", saw: "", next: "", term: "" }],
  classWork: { worksWith: [], needsSupportWhen: "", grouping: "" },
  homeForSchool: { helpsAtSchool: "", caregiverAsk: "" },
  iepDraft: false,
  at: iso
}
```

`homeForSchool` is **not** a family dossier. It is only what a caregiver already told her so Monday works (sleep, pickup change she was asked to remember, language at home). No SIN. No OEN required. No address. No sibling map unless she types it for teaching.

`worksWith` may only reference names already on `dc.sara.g2.class`.

Receipt hash may count cards. It may not include names or notes.

## AND

Phrase open · teacher confirm · no student string in the commit · Iris mouth off these cards · Look $0 · Home not smashed.

If any bit is 0, keep the schema in the factory.
