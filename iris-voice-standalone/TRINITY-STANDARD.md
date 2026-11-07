# Trinity Standard — minimal Iris gate

**Status:** policy contract only. The canonical session verifier and authoritative Trinity/law adapter are not connected here; this module grants no authority.

- **TRUTH_OR_NOTHING:** missing identity, decision, or verified receipt means deny.
- **NO_FORCE:** client IDs, cookies, model output, and configuration cannot create authority.
- **HOST_SAFE:** trust forwarded headers only behind a controlled proxy.
- **CLEANUP_FIRST:** any future mutation requires a declared target and rollback plan.
- **SAFE_HOST / ZERO_FORCE:** no production write, deployment, DNS, or database mutation without the canonical law decision.
- **Father is the sole writing authority:** write actions require Father authority in the authoritative, verified decision. A request string is never proof.
- **Fail closed:** unknown actions and missing dependencies are denied.

Allowed read actions: `iris.model.turn`, `iris.status.read`.

Write actions: `repo.write`, `site.write`, `config.write`, `deployment.promote`, `dns.change`, `database.mutate`.

The trusted law adapter must authenticate the real receipt and return its verified binding to the exact actor, action, target, and mutation class. A bare `allow`, decision ID, or unverified JSON object is insufficient. The required order is canonical session verification → verified actor → authoritative law decision and receipt validation → allowed operation.

The provider connector remains unwired until the canonical verifier and law adapter are integrated and tested. The gate records a decision; it is not itself an authority source.
