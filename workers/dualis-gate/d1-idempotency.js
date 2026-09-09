async function sha256Hex(s) {
  var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(s || "")));
  return [...new Uint8Array(buf)].map(function (x) {
    return x.toString(16).padStart(2, "0");
  }).join("");
}

function metaChanges(result) {
  return result && result.meta && typeof result.meta.changes === "number" ? result.meta.changes : 0;
}

function unityIdFromEvent(event) {
  var meta = event && event.data && event.data.object && event.data.object.metadata;
  if (meta && typeof meta.unity_id === "string" && meta.unity_id.length > 0) return meta.unity_id;
  return null;
}

/** Append webhook_event. Replay of same evt_ is a no-op. No entitlements. No fuel. */
export async function acceptStripeEvent(env, event) {
  if (!env || !env.DB || !event || !event.id) return { duplicate: false, reason: "no-event" };
  var now = Date.now();
  var payloadHash = await sha256Hex(JSON.stringify({ id: event.id, type: event.type || "" }));
  var unityId = unityIdFromEvent(event);
  var ins = await env.DB.prepare(
    "INSERT INTO webhook_event (event_id, event_type, payload_hash, unity_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(event_id) DO NOTHING"
  ).bind(event.id, event.type || "unknown", payloadHash, unityId, now).run();
  if (metaChanges(ins) === 0) return { duplicate: true };
  if (event.type === "identity.verification_session.verified" && unityId) {
    await env.DB.prepare(
      "INSERT INTO unity_kyc (unity_id, kyc) VALUES (?1, 1) ON CONFLICT(unity_id) DO UPDATE SET kyc = 1"
    ).bind(unityId).run();
  }
  return { duplicate: false };
}
