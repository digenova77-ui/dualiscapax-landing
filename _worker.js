/* Cloudflare Pages Advanced Mode.
 * Preserve the existing landing routes and ASSETS fallback.
 * HUD routes are served by this Pages Worker so they do not depend on a
 * separately deployed Worker route. Apex remains owned by Pages assets.
 * Unity seal verification added: read-only, no-store, fail-closed.
 */
const MAP = {
  "/look": "/look.html",
  "/look/": "/look.html",
  "/look.html": "/look.html",
  "/alacarte": "/alacarte.html",
  "/alacarte/": "/alacarte.html",
  "/alacarte.html": "/alacarte.html",
  "/sima": "/rte/sima-dclm/index.html",
  "/sima/": "/rte/sima-dclm/index.html",
  "/rte": "/rte/index.html",
  "/rte/": "/rte/index.html",
  "/aide": "/rte/sima-dclm/index.html",
  "/aide/": "/rte/sima-dclm/index.html",
  "/desk": "/rte/sima-dclm/index.html",
  "/desk/": "/rte/sima-dclm/index.html"
};

const HUD_RAW = "https://raw.githubusercontent.com/digenova77-ui/dualiscapax-hud/main";
const HUD_ROUTES = new Map([
  ["/holographic-core/v2", [HUD_RAW + "/holographic-core/v2/index.html", "text/html; charset=utf-8"]],
  ["/holographic-core/v2/", [HUD_RAW + "/holographic-core/v2/index.html", "text/html; charset=utf-8"]],
  ["/holographic-core/v2/index.html", [HUD_RAW + "/holographic-core/v2/index.html", "text/html; charset=utf-8"]],
  ["/assets/holographic-hostess-40/hostess.svg", [HUD_RAW + "/assets/holographic-hostess-40/hostess.svg", "image/svg+xml; charset=utf-8"]]
]);

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

function noStoreHeaders(extra = {}) {
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

export default {
  async fetch(request, env) {
    const assets = env && env.ASSETS;
    if (!assets || !assets.fetch) {
      return new Response("Pages ASSETS binding unavailable", {
        status: 503,
        headers: noStoreHeaders()
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Read-only route proves which runtime is answering; no user/request data.
    if (path === "/iris/status" || path === "/iris/status.json") {
      return Response.json({
        runtime: "cloudflare-pages-advanced-mode",
        route_owner: "dualiscapax-web Pages _worker.js",
        hud_source: "digenova77-ui/dualiscapax-hud main",
        hud_path: "/holographic-core/v2",
        apex_overwrite: false,
        cache: "no-store"
      }, { headers: noStoreHeaders({ "x-dc-iris": "pages-bridge" }) });
    }

    // Unity seal verification: read-only, fail-closed, no-store.
    if (path === "/seal" || path === "/seal.json" || path === "/unity/status" || path === "/unity/status.json") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", {
          status: 405,
          headers: noStoreHeaders({ allow: "GET, HEAD" })
        });
      }
      try {
        const computed = await sha256Hex(SEAL_BODY);
        const match = computed === EXPECTED_UNITY_HASH;
        const body = {
          seal: "UNITY_SEAL_v1",
          center: "empty",
          mirror: "0|1",
          exempt: false,
          unity_hash: computed,
          expected: EXPECTED_UNITY_HASH,
          match: match,
          status: match ? "PASS" : "DRIFT",
          runtime: "cloudflare-pages-advanced-mode",
          cache: "no-store"
        };
        return Response.json(body, { headers: noStoreHeaders({ "x-dc-unity": match ? "seal-match" : "seal-drift" }) });
      } catch {
        return new Response("Seal verification unavailable", {
          status: 503,
          headers: noStoreHeaders({ "x-dc-unity": "error" })
        });
      }
    }

    // Isolated HUD paths are explicitly served from the HUD repository.
    // The homepage and every other path continue through the Pages asset binding.
    const hud = HUD_ROUTES.get(path);
    if (hud) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", {
          status: 405,
          headers: noStoreHeaders({ allow: "GET, HEAD" })
        });
      }

      let upstream;
      try {
        upstream = await fetch(hud[0], {
          method: request.method,
          headers: { accept: request.headers.get("accept") || "*/*" }
        });
      } catch {
        return new Response("HUD upstream unavailable", {
          status: 502,
          headers: noStoreHeaders({ "x-dc-iris": "upstream-error" })
        });
      }

      if (!upstream.ok) {
        return new Response("HUD upstream unavailable", {
          status: 502,
          headers: noStoreHeaders({ "x-dc-iris": "upstream-error" })
        });
      }

      return new Response(request.method === "HEAD" ? null : await upstream.arrayBuffer(), {
        status: 200,
        headers: noStoreHeaders({
          "content-type": hud[1],
          "x-dc-iris": "pages-bridge",
          "x-dc-hud-source": "github-raw"
        })
      });
    }

    // Pure diamond / frontier / Omni edge routes (no-store, fail-closed).
    if (path === "/omni" || path === "/omni/") {
      return jsonNoStore(omniSnapshot());
    }
    if (path === "/frontier" || path === "/frontier/") {
      return jsonNoStore(frontierReport());
    }
    if (path === "/purity" || path === "/purity/") {
      return textNoStore(purityText());
    }
    if (path === "/standing-probe" || path === "/standing-probe/") {
      return jsonNoStore(standingProbe());
    }

        const dest = MAP[path];
    if (dest) {
      const target = new URL(request.url);
      target.pathname = dest;
      try {
        return await assets.fetch(new Request(target.toString(), request));
      } catch {
        // Keep the existing Pages asset fallback if a friendly route mapping fails.
      }
    }

    // In particular, "/" is never rewritten to the HUD; Pages serves the apex.
    return assets.fetch(request);
  }
};

function jsonNoStore(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }
  });
}
function textNoStore(body) {
  return new Response(body + "\n", {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }
  });
}
const DEFAULT_FACETS = [
  { name: "foundation", kind: "floor", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "DCLM", kind: "ring", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "Iris", kind: "ring", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "Twain²", kind: "ring", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "summer", kind: "tree", clarity: "VS", color: "E", cut: "Very Good", reflects: "purity" },
  { name: "winter", kind: "tree", clarity: "VS", color: "F", cut: "Very Good", reflects: "purity" },
  { name: "merit", kind: "economy", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "standing", kind: "economy", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" },
  { name: "ceiling", kind: "ceiling", clarity: "FL", color: "D", cut: "Excellent", reflects: "purity" }
];
const CLARITY_PASS = new Set(["FL", "VVS", "VS"]);
const COLOR_PASS = new Set(["D", "E", "F"]);
const CUT_PASS = new Set(["Excellent", "Very Good"]);
function grade(f) {
  const pure = CLARITY_PASS.has(f.clarity) && COLOR_PASS.has(f.color) && CUT_PASS.has(f.cut) && f.reflects === "purity";
  return { pure, verdict: pure ? "PASS" : "GLASS" };
}
function facesFrontier(f) {
  return f.clarity === "FL" && f.color === "D" && f.cut === "Excellent" && f.reflects === "purity";
}
function frontierReport() {
  const facing = [], held = [];
  for (const f of DEFAULT_FACETS) {
    if (f.kind === "ceiling") continue;
    if (facesFrontier(f)) facing.push(f.name); else held.push(f.name);
  }
  const floor = DEFAULT_FACETS.find(f => f.kind === "floor");
  return { protocol: "DIAMOND.FRONTIER.MAX.v1", facing, held, ceiling_claimable: held.length === 0 && grade(floor).pure, law: "LAW WINS", origin: "immutable", learning: "advisory only — NOT_FOR_EMISSION" };
}
function omniSnapshot() {
  const facets = DEFAULT_FACETS.filter(f => f.kind !== "ceiling").map(f => ({ name: f.name, verdict: grade(f).verdict }));
  const fr = frontierReport();
  const floor = DEFAULT_FACETS.find(f => f.kind === "floor");
  const glass = facets.some(x => x.verdict === "GLASS");
  return { label: "OMNI", diamond: { floor_holds: grade(floor).pure, rise_ok: !glass, ceiling_reached: !glass, facets }, frontier: { protocol: fr.protocol, facing: fr.facing, held_count: fr.held.length, ceiling_claimable: fr.ceiling_claimable }, contract: { law: "LAW WINS", origin: "immutable", boundary: "NOT_FOR_EMISSION" }, integrity: "UNCHANGED — core not touched" };
}
function purityText() {
  const o = omniSnapshot();
  const lines = ["DIAMOND PURITY (edge)", "floor: " + (o.diamond.floor_holds ? "HOLD" : "FAIL")];
  for (const f of o.diamond.facets) lines.push((f.verdict === "PASS" ? "◆ " : "◇ ") + f.name + " " + f.verdict);
  lines.push("frontier_claimable: " + o.frontier.ceiling_claimable);
  lines.push("boundary: NOT_FOR_EMISSION");
  return lines.join("\n");
}
function standingProbe() {
  return { standing_callable: true, emission_source: "standing() — origin only", boundary: "NOT_FOR_EMISSION" };
}
