# Chosen setup

Live website: GitHub Pages at dualiscapax.ai (`DOMAIN.md`).
Spare copy: Pinata pin of the same public files, CID at tree root.
Checkout stays closed. Workers stay off the pin.

No other architecture is in play.

The only remaining action for the spare copy: put a Pinata JWT in GitHub Actions secret `PINATA_JWT`, then run workflow `pinata-pin`. That key cannot be created from chat.
