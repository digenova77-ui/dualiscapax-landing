const WRITE_ACTIONS = new Set([
  "repo.write",
  "site.write",
  "config.write",
  "deployment.promote",
  "dns.change",
  "database.mutate",
]);

const deny = reason => ({ ok: false, reason, authority: "NONE" });

/**
 * Deterministic, fail-closed policy seam for Iris.
 *
 * This is not an identity provider or a Trinity authority source. Callers must
 * inject the existing canonical session verifier and the authoritative law
 * decision function. No local cookie, browser ID, model output, or config
 * default can manufacture either dependency.
 */
export async function authorizeIrisAction({
  request,
  action,
  sessionVerifier,
  lawDecision,
}) {
  if (!request || typeof request !== "object") return deny("request-required");
  if (typeof action !== "string" || !action.trim()) return deny("action-required");
  if (!sessionVerifier || typeof sessionVerifier.verify !== "function") {
    return deny("canonical-session-verifier-unavailable");
  }
  if (typeof lawDecision !== "function") return deny("trinity-law-decision-unavailable");

  let session;
  try {
    session = await sessionVerifier.verify(request);
  } catch {
    return deny("session-verification-failed");
  }
  if (!session || session.ok !== true || typeof session.actorId !== "string" || !session.actorId.trim()) {
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
  } catch {
    return deny("trinity-decision-failed");
  }

  if (!decision || decision.allow !== true || typeof decision.decisionId !== "string" || !decision.decisionId.trim()) {
    return deny("trinity-decision-not-explicitly-allowed");
  }

  if (WRITE_ACTIONS.has(action) && decision.authority !== "FATHER") {
    return deny("father-authority-required");
  }

  return {
    ok: true,
    actorId: session.actorId,
    action,
    decisionId: decision.decisionId,
    authority: "NONE",
  };
}

export const TRINITY_WRITE_ACTIONS = Object.freeze([...WRITE_ACTIONS]);
