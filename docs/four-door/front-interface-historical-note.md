# FRONT-INTERFACE.md — Historical Note

**This is a new note file. It does not edit, move, or delete `handshake/FRONT-INTERFACE.md`, which remains on main exactly as written.**

As of the adopted Frontend Architecture Update & Father Authentication Simplification (Nov 3, 2026), the cross-domain authentication ceremony specified in `handshake/FRONT-INTERFACE.md` — one passkey carried across the .com → .ai navigation by the related-origin mechanism, a second ceremony on .ai, and a `DCCP/2` protocol line posted to `/api/v2/compute` — is **historical**:

- The ceremony is **retired as a mandatory authentication mechanism**. No current or future authentication flow may require it, depend on it, or treat its completion as evidence at any door of the four-door contract (`four-door-contract.md`).
- The document is retained as the design record of what was proposed, including its known flaw (Stage A audit finding F-3): the posted line carries no assertion bytes, so ceremony completion would have stood in for authorization. The record itself named the correction (PR #169's module: the line alone is forgeable and must never grant authority).
- The ceremony was never completed on main and was never implemented server-side; nothing running depends on it. Its dependents are dispositioned in `handoff-de-mandatory-package.md`.
- Terminology: "the handoff ceremony" in Stage B/C documents means this browser ceremony only. The other two mechanisms that share the word — scarlet's line dialect and the `unity_handoff` law op — are distinct referents; see `naming-glossary.md`.

Nothing in this note authorizes any change to `handshake/FRONT-INTERFACE.md` itself, to any branch, or to any live surface.

---

*Stage B, step 3. Branch `stage-b-four-door-contract-20261103`, docs only.*
