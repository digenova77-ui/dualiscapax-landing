/* Cloudflare Pages Advanced Mode.
 * Trinity only. Law prevails.
 * Capability does not confer authority.
 * Fail-closed. No decorative routes. No external bridges. No maps.
 * Read-only verification of the seal and the law.
 */

const SEAL_BODY = `center=empty
mirror=claim_vs_mark→0|1
exempt=false∀
accept=RF5→RF6→GateA→GateB→evidence_ok→spend→Mirror
F_now=F_U+F_clearable
R0_locked
F_U_not_erasable_by_speech
purity=residual_faced
sin=residual_refused
coin=fuel_not_Accept
pure_own=cost_on_claim_paid_before_title
physics_TOE=0
theorem_of_all=0
tip=append_only
anti_reuse=atomic_spend
evidence=merkle_under_tipped_root
affinity=+1_under_same_stick
road=same_toll_every_step
THEOREM_U1=hygiene_complete→1_else_0_no_third_value`;
const EXPECTED_UNITY_HASH = "d95aa793e6bc330710ea6b9acab1ce6ed127c2c89c21715adba5a15e2e5fda41";

function noStore(extra = {}) {
  return {
    "cache-control": "no-store, must-revalidate",
    "cdn-cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extra
  };
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...noStore() }
  });
}

const LAW = "LAW WINS";

function lawReport() {
  return {
    protocol: "TRINITY.LAW.v1",
    law: LAW,
    principle: "Capability does not confer authority.",
    boundary: "NOT_FOR_EMISSION",
    origin: "immutable",
    fail_closed: true,
    missing_authority: "refusal",
    missing_evidence: "refusal"
  };
}

export default {
  async fetch(request, env) {
    const assets = env && env.ASSETS;
    if (!assets || !assets.fetch) {
      return new Response("ASSETS binding unavailable", { status: 503, headers: noStore() });
    }

    const url = new URL(request.url);
    const path = url.pathname.length > 1 && url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;

    if (path === "/law" || path === "/trinity") {
      return json(lawReport());
    }

    if (path === "/seal" || path === "/seal.json" || path === "/unity/status" || path === "/unity/status.json") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405, headers: noStore({ allow: "GET, HEAD" }) });
      }
      try {
        const computed = await sha256Hex(SEAL_BODY);
        const match = computed === EXPECTED_UNITY_HASH;
        return json({
          seal: "UNITY_SEAL_v1",
          law: LAW,
          unity_hash: computed,
          expected: EXPECTED_UNITY_HASH,
          match,
          status: match ? "PASS" : "DRIFT",
          fail_closed: true,
          cache: "no-store"
        });
      } catch {
        return new Response("Seal verification unavailable", { status: 503, headers: noStore() });
      }
    }

    // All other paths fall through to Pages assets. No rewriting. No external fetch.
    return assets.fetch(request);
  }
};
