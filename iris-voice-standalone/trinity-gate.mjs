const READ_ACTIONS = new Set(["iris.model.turn", "iris.status.read"]);
const WRITE_ACTIONS = new Set([
  "repo.write", "site.write", "config.write",
  "deployment.promote", "dns.change", "database.mutate",
]);
const deny = reason => ({ ok: false, reason, authority: "NONE" });

/**
 * Minimal Trinity enforcement seam, not an authority source.
 * Inject only the canonical session verifier and a law adapter that validates
 * the authoritative receipt's authenticity and binds it to this exact request.
 */
export async function authorizeIrisAction({ request, action, sessionVerifier, lawDecision }) {
  if (!request || typeof request !== "object") return deny("request-required");
  if (!READ_ACTIONS.has(action) && !WRITE_ACTIONS.has(action)) return deny("action-not-allowlisted");
  if (typeof sessionVerifier?.verify !== "function") return deny("session-verifier-unavailable");
  if (typeof lawDecision !== "function") return deny("trinity-decision-unavailable");

  let session;
  try { session = await sessionVerifier.verify(request); }
  catch { return deny("session-verification-failed"); }
  if (session?.ok !== true || typeof session.actorId !== "string" || !session.actorId.trim()) {
    return deny("session-unverified-or-actor-unbound");
  }

  const mutation = WRITE_ACTIONS.has(action);
  const input = {
    actorId: session.actorId,
    action,
    target: "iris",
    mutation,
    requestId: typeof request.requestId === "string" ? request.requestId : null,
  };

  let decision;
  try { decision = await lawDecision(input); }
  catch { return deny("trinity-decision-failed"); }

  // A bare allow or decision ID is insufficient. The trusted adapter must
  // authenticate the real receipt and return its verified request bindings.
  if (
    decision?.allow !== true ||
    typeof decision.decisionId !== "string" || !decision.decisionId.trim() ||
    decision.actorId !== input.actorId ||
    decision.action !== input.action ||
    decision.target !== input.target ||
    decision.mutation !== input.mutation
  ) return deny("trinity-receipt-invalid-or-mismatched");

  if (mutation && decision.authority !== "FATHER") return deny("father-authority-required");

  // This result is an authorization check, not a transferable capability.
  return { ok: true, actorId: input.actorId, action, decisionId: decision.decisionId, authority: "NONE" };
}
