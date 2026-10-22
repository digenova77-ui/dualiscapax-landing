const READ_ACTIONS = new Set(["iris.model.turn", "iris.status.read"]);
const WRITE_ACTIONS = new Set([
  "repo.write", "site.write", "config.write",
  "deployment.promote", "dns.change", "database.mutate",
]);
const deny = reason => ({ ok: false, reason, authority: "NONE" });

/**
 * Minimal Trinity enforcement seam, not an authority source.
 * Production must inject the canonical session verifier and law decision.
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

  let decision;
  try {
    decision = await lawDecision({
      actorId: session.actorId,
      action,
      target: "iris",
      mutation: WRITE_ACTIONS.has(action),
      requestId: typeof request.requestId === "string" ? request.requestId : null,
    });
  } catch { return deny("trinity-decision-failed"); }

  if (decision?.allow !== true || typeof decision.decisionId !== "string" || !decision.decisionId.trim()) {
    return deny("trinity-decision-not-explicitly-allowed");
  }
  if (WRITE_ACTIONS.has(action) && decision.authority !== "FATHER") {
    return deny("father-authority-required");
  }

  // The gate records a decision; it does not itself possess writing authority.
  return { ok: true, actorId: session.actorId, action, decisionId: decision.decisionId, authority: "NONE" };
}
