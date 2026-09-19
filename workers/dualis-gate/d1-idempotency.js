async function sha256Hex(s) {
  var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(s || "")));
  return [...new Uint8Array(buf)].map(function (x) {
    return x.toString(16).padStart(2, "0");
  }).join("");
}

/** Deterministic canonical JSON: sorted object keys; arrays preserve order. */
function canonicalize(value) {
  if (value === null || value === undefined) return "null";
  var t = typeof value;
  if (t === "string") return JSON.stringify(value);
  if (t === "boolean") return value ? "true" : "false";
  if (t === "number") {
    if (!Number.isFinite(value)) throw new Error("NON_FINITE_NUMBER");
    return String(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  if (t === "object") {
    var keys = Object.keys(value).sort();
    return "{" + keys.map(function (k) {
      return JSON.stringify(k) + ":" + canonicalize(value[k]);
    }).join(",") + "}";
  }
  throw new Error("UNSUPPORTED_TYPE");
}

function metaChanges(result) {
  return result && result.meta && typeof result.meta.changes === "number" ? result.meta.changes : 0;
}

function unityIdClaimFromEvent(event) {
  var meta = event && event.data && event.data.object && event.data.object.metadata;
  if (meta && typeof meta.unity_id === "string" && meta.unity_id.length > 0) return meta.unity_id;
  return null;
}

/**
 * Append webhook_event with FULL canonical event hash.
 * metadata.unity_id is a CLAIM only — never mints KYC.
 * Same event_id + different payload_hash → PAYLOAD_HASH_COLLISION / UNRESOLVED.
 * No entitlements. No fuel. No KYC write from metadata.
 */
export async function acceptStripeEvent(env, event) {
  if (!env || !env.DB || !event || !event.id) {
    return { duplicate: false, reason: "no-event", kyc_written: false, authority_effect: "NONE" };
  }
  var now = Date.now();
  var payloadHash = await sha256Hex(canonicalize(event));
  var unityClaim = unityIdClaimFromEvent(event);
  var existing = await env.DB.prepare(
    "SELECT event_id, payload_hash, unity_id FROM webhook_event WHERE event_id = ?1"
  ).bind(event.id).first();

  if (existing) {
    if (existing.payload_hash && existing.payload_hash !== payloadHash) {
      return {
        duplicate: true,
        status: "UNRESOLVED",
        reason: "PAYLOAD_HASH_COLLISION",
        kyc_written: false,
        authority_effect: "NONE",
        event_id: event.id,
        stored_hash: existing.payload_hash,
        computed_hash: payloadHash,
      };
    }
    return {
      duplicate: true,
      status: "REPLAY",
      kyc_written: false,
      authority_effect: "NONE",
      unity_id_claim: unityClaim,
    };
  }

  var ins = await env.DB.prepare(
    "INSERT INTO webhook_event (event_id, event_type, payload_hash, unity_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(event_id) DO NOTHING"
  ).bind(event.id, event.type || "unknown", payloadHash, unityClaim, now).run();

  if (metaChanges(ins) === 0) {
    // Race: another writer landed first — re-read and check hash.
    var raced = await env.DB.prepare(
      "SELECT event_id, payload_hash FROM webhook_event WHERE event_id = ?1"
    ).bind(event.id).first();
    if (raced && raced.payload_hash && raced.payload_hash !== payloadHash) {
      return {
        duplicate: true,
        status: "UNRESOLVED",
        reason: "PAYLOAD_HASH_COLLISION",
        kyc_written: false,
        authority_effect: "NONE",
      };
    }
    return { duplicate: true, status: "REPLAY", kyc_written: false, authority_effect: "NONE" };
  }

  // Identity verified events may RECORD a unity_id claim on the webhook row.
  // They must NOT mint unity_kyc. Metadata cannot mint KYC.
  return {
    duplicate: false,
    status: "ACCEPTED",
    kyc_written: false,
    authority_effect: "NONE",
    unity_id_claim: unityClaim,
    payload_hash: payloadHash,
    note: event.type === "identity.verification_session.verified"
      ? "metadata.unity_id is CLAIM_ONLY; KYC requires separate bound verification path"
      : undefined,
  };
}

export { canonicalize, sha256Hex };
