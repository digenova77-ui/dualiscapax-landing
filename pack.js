function addDays(iso, days) {
  var d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
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
    dualis: {
      name: "DualisCapax Inc.",
      ontario: "1001718450 Ontario Inc.",
      role: "meter",
    },
    they_may: [
      "Open the downloaded runtime on their own computer or phone",
      "Measure and model their own shop, school, or work on that host",
      "Invite Dualis to look at what they modeled",
    ],
    they_may_not: [
      "Treat this letter as a share sale",
      "Store patient files in this runtime",
      "Call Dualis their bank, their lawyer, or their government ID office",
    ],
    dualis_does_not: [
      "Host their operating system",
      "Charge CAD $0-seat during these 90 days",
      "Run a government ID check",
      "Keep their secret phrase",
    ],
    after_90_days: "Pay for a room, or stop. Looking stays free.",
    either_party_may_stop: true,
    not_legal_advice: true,
    wet_ink_required_for_court: true,
    status: "DECLARED_ON_DEVICE",
  };
}

function buildPack(p) {
  var eth = p.eth && p.eth.address;
  var scan = eth ? "https://etherscan.io/address/" + eth : null;
  var seat = buildAgreement(p);
  return {
    schema: "unity.deploy.pack.v2",
    generated_at: new Date().toISOString(),
    host: p.host,
    unity_id: p,
    seat: seat,
    runtime: {
      kind: "host_side_seed",
      file: "dualis-runtime.html",
      platforms: ["browser", "desktop", "phone"],
      dualis_hosts_os: false,
      start: ["open dualis-runtime.html", "keep the phrase off the internet", "model for 90 days at CAD $0"],
    },
    contract: {
      mode: eth ? "lookup_declared_address" : "no_address",
      address: eth || null,
      etherscan: scan,
      deployed_by_this_pack: false,
      passwords_on_chain: false,
    },
    kyc: { performed_by_dualis: false, status: "UNBOUND" },
    books: {
      passphrase: p.passphrase_sha256 ? "sha256_only" : "missing",
      passkey: p.passkey ? "device_bound" : "missing",
      raw_secret_in_pack: false,
    },
    auditor: p.llp || { status: "NEED_FIRM" },
    pay: { after_seat: "https://dualiscapax.ai/pay.html" },
    law: p.law,
  };
}

function packHtml(pack) {
  var s = pack.seat || {};
  return "<!doctype html><meta charset=utf-8><title>Your Dualis file</title>" +
    "<body style=\"font-family:system-ui;background:#04060c;color:#e8eef2;max-width:40rem;margin:2rem auto;padding:1rem\">" +
    "<h1>Your Dualis file</h1>" +
    "<p>This runs on your machine. Dualis does not host your computer.</p>" +
    "<p>Modeling seat: CAD $0 until " + (s.end || "").slice(0, 10) + ".</p>" +
    "<p>Firm on file: " + ((pack.auditor && pack.auditor.status) || "none yet") + ".</p>" +
    "<p><a href=\"dualis-runtime.html\" style=\"color:#8eb4c8\">Open the runtime next to this file</a></p>" +
    "<pre style=\"white-space:pre-wrap;font-size:12px\">" + JSON.stringify(pack, null, 2).replace(/</g, "") + "</pre></body>";
}

function agreementHtml(seat) {
  var p = seat.party || {};
  return "<!doctype html><meta charset=utf-8><title>90-day modeling seat</title>" +
    "<body style=\"font-family:Georgia,serif;background:#f4f1ea;color:#1a1a1a;max-width:40rem;margin:2rem auto;padding:1.2rem\">" +
    "<p>DualisCapax Inc. · 1001718450 Ontario Inc.</p>" +
    "<h1>Zero-dollar ninety-day modeling seat</h1>" +
    "<p>Name: " + (p.name || "—") + "<br>Kind: " + (p.kind || "") + "<br>Town: " + (p.municipality || "") + "<br>Email: " + (p.email || "") + "</p>" +
    "<p>Price: CAD $0<br>Starts: " + (seat.start || "").slice(0, 10) + "<br>Ends: " + (seat.end || "").slice(0, 10) + "</p>" +
    "<p>You may open the downloaded runtime on your own computer and start modeling your work the same day. Dualis keeps the meter. You keep the machine.</p>" +
    "<p>This is not a share sale. This is not legal advice. A court still wants wet ink if you need a court. Either side may stop. After ninety days you pay for a room or you stop. Looking stays free.</p>" +
    "<p>No patient files in this runtime. Dualis does not run your government ID check.</p>" +
    "<p>Status: declared on the device that sealed it.</p></body>";
}

function runtimeHtml(p, seat) {
  var look = p.look || {};
  var name = look.name || "Guest";
  var town = look.municipality || "your town";
  var kind = look.kind || "person";
  var end = (seat && seat.end || "").slice(0, 10);
  return "<!doctype html><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\">" +
    "<title>" + name.replace(/</g, "") + " — Dualis runtime</title>" +
    "<body style=\"font-family:system-ui;background:#04060c;color:#e8eef2;max-width:40rem;margin:0 auto;padding:1.2rem\">" +
    "<p style=\"letter-spacing:.18em;font-size:.75rem\">DUALISCAPAX RUNTIME</p>" +
    "<h1>" + name.replace(/</g, "") + "</h1>" +
    "<p>" + kind + " · " + town.replace(/</g, "") + "</p>" +
    "<p>This file is your workbench. It lives on this device. Dualis does not host it.</p>" +
    "<p>Modeling window: CAD $0 through " + end + ".</p>" +
    "<h2>Start today</h2>" +
    "<ol>" +
    "<li>Write what you run (shop, school, desk).</li>" +
    "<li>Write what leaks money or time.</li>" +
    "<li>Keep patient names and passwords out of this file.</li>" +
    "<li>When you want a paid room, open pay.html on dualiscapax.ai.</li>" +
    "</ol>" +
    "<textarea id=notes style=\"width:100%;min-height:12rem;background:#0a0e14;color:#e8eef2;border:1px solid #3a4650;border-radius:8px;padding:.6rem\" placeholder=\"Model here. Saved only on this device.\"></textarea>" +
    "<p><button id=save type=button>Save on this device</button> <span id=out></span></p>" +
    "<script>" +
    "(function(){var k='dc.model.notes';var t=document.getElementById('notes');try{t.value=localStorage.getItem(k)||''}catch(e){}" +
    "document.getElementById('save').onclick=function(){try{localStorage.setItem(k,t.value);document.getElementById('out').textContent='Saved here.';}catch(e){document.getElementById('out').textContent='Could not save.';}}})()" +
    "<\/script></body>";
}
