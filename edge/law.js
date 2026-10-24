/**
 * Trinity edge. Law only.
 * Capability does not confer authority.
 * LAW WINS. Fail-closed. NOT_FOR_EMISSION.
 */

export const LAW = "LAW WINS";

export const PRINCIPLE = "Capability does not confer authority.";

export const BOUNDARY = "NOT_FOR_EMISSION";

export function lawReport() {
  return {
    protocol: "TRINITY.LAW.v1",
    law: LAW,
    principle: PRINCIPLE,
    boundary: BOUNDARY,
    origin: "immutable",
    fail_closed: true,
    missing_authority: "refusal",
    missing_evidence: "refusal"
  };
}

export function assertAuthorized(evidence) {
  if (!evidence || evidence.authority !== true || evidence.proof == null) {
    return { ok: false, reason: "missing authority or evidence", law: LAW, boundary: BOUNDARY };
  }
  return { ok: true, law: LAW };
}

export function refuse(reason = "unauthorized") {
  return { ok: false, reason, law: LAW, boundary: BOUNDARY, fail_closed: true };
}
