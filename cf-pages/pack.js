function addDays(iso, days) {
  var d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}
function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}
function buildAgreement(p) {
  var start = p.at || new Date().toISOString();
  return {
    schema: "dualis.model.seat.v1",
    title: "Zero-dollar ninety-day modeling seat",
    price_cad: 0,
    term_days: 90,
    start: start,
    end: addDays(start, 90),
    party: {
      name: (p.look && p.look.name) || "",
      kind: (p.look && p.look.kind) || "person",
      email: (p.look && p.look.email) || null,
      municipality: (p.look && p.look.municipality) || "",
    },
    dualis: { name: "DualisCapax Inc.", ontario: "1001718450 Ontario Inc.", role: "meter" },
    they_may: ["Open this file on their own computer", "Model their own work", "Invite Dualis to look"],
    they_may_not: ["Treat this as a share sale", "Store patient files here", "Call Dualis their bank or lawyer"],
    after_90_days: "Pay for a room, or stop. Looking stays free.",
    either_party_may_stop: true,
    not_legal_advice: true,
    wet_ink_required_for_court: true,
    status: "DECLARED_ON_DEVICE",
  };
}
function buildPack(p) {
  var eth = p.eth && p.eth.address;
  var seat = buildAgreement(p);
  return {
    schema: "unity.deploy.pack.v2",
    generated_at: new Date().toISOString(),
    host: p.host,
    unity_id: p,
    seat: seat,
    runtime: { kind: "host_side_seed", file: "dualis-start.html", dualis_hosts_os: false },
    contract: {
      address: eth || null,
      etherscan: eth ? "https://etherscan.io/address/" + eth : null,
      deployed_by_this_pack: false,
      passwords_on_chain: false,
    },
    kyc: { performed_by_dualis: false, status: "UNBOUND" },
    auditor: p.llp || { status: "NEED_FIRM" },
    law: p.law,
  };
}
function startHtml(p, pack) {
  var look = p.look || {};
  var seat = pack.seat || {};
  var end = String(seat.end || "").slice(0, 10);
  var payload = JSON.stringify(pack).replace(/</g, "\\u003c");
  return "<!doctype html><html lang=en><meta charset=utf-8>" +
    "<meta name=viewport content=\"width=device-width,initial-scale=1\">" +
    "<title>" + esc(look.name || "Dualis") + " — start</title>" +
    "<style>body{margin:0;background:#04060c;color:#e8eef2;font-family:system-ui,sans-serif}" +
    "main{max-width:40rem;margin:0 auto;padding:1.2rem 1rem 3rem}h1{font-size:1.7rem}" +
    "p,li{color:#9aa8b3}textarea{width:100%;min-height:14rem;background:#0a0e14;color:#e8eef2;" +
    "border:1px solid #3a4650;border-radius:8px;padding:.7rem}button{margin-top:.6rem;padding:.55rem .9rem;" +
    "border:0;border-radius:999px;background:#8eb4c8;color:#061018;font-weight:700}pre{white-space:pre-wrap;font-size:11px;color:#8b99a4}</style>" +
    "<main><p style=letter-spacing:.16em;font-size:.72rem>DUALISCAPAX</p>" +
    "<h1>" + esc(look.name || "Your workbench") + "</h1>" +
    "<p>" + esc(look.kind) + " · " + esc(look.municipality) + " · CAD $0 through " + esc(end) + "</p>" +
    "<p>This file is yours. Dualis does not host this computer. No patient names. After 90 days pay or stop. Looking stays free.</p>" +
    "<textarea id=notes placeholder=\"What you run. What leaks money or time.\"></textarea>" +
    "<p><button type=button id=save>Save on this device</button> <span id=out></span></p>" +
    "<pre id=pack></pre></main>" +
    "<script>window.DC_PACK=" + payload + ";" +
    "(function(){var k='dc.model.notes';var t=document.getElementById('notes');" +
    "try{t.value=localStorage.getItem(k)||''}catch(e){}" +
    "document.getElementById('pack').textContent=JSON.stringify(window.DC_PACK,null,2);" +
    "document.getElementById('save').onclick=function(){try{localStorage.setItem(k,t.value);" +
    "document.getElementById('out').textContent='Saved here.';}catch(e){document.getElementById('out').textContent='Could not save.';}}})()<\/script></html>";
}
