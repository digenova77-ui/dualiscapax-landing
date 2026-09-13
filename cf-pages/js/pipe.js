/* DualisCapax pipe — documentary matrix engine.
 * Baseline: DualisCapax_Website_Storyboard_Refinement_2026-09-02
 * Circuit-tunnel fly-through prohibited. First paint is the house, not a desk.
 */
(function () {
  var pipe = document.getElementById("pipe");
  var cardsEl = document.getElementById("cards");
  var probeEl = document.getElementById("iris-probe");
  var streamEl = document.getElementById("iris-stream");
  var modal = document.getElementById("modal");
  if (!pipe || !cardsEl) return;

  var HOUSE = {
    id: "",
    code: "HOUSE",
    name: "Pick a desk. Same walk for every room.",
    short: "House",
    img: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=1600&q=80",
    alt: "Industrial operations floor and instrumentation",
    thesis: "Friction finds holes. Affinity binds what already holds. They smash to one answer. Your books stay with you. Look. Leave if you want. Nothing is owed.",
    metrics: [["Desks","10"],["Net retention","81.0%"],["Upfront","$0.00"],["Access","CLOSED"]],
    steps: []
  };

  var SECTORS = [
    {id:"sec-01",code:"SEC-01",name:"Commercial Biophysical AI & Pharma",short:"Pharma primes",img:"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80",alt:"Accredited laboratory workbench and instrumentation",thesis:"15-day clinical-trial data ingress under zero-knowledge encryption. Predictive yield and thermal offset, then independent regulatory audit.",metrics:[["Window","15 / 90 days"],["Net retention","81.0%"],["Upfront","$0.00"],["Access","CLOSED"]],steps:[["Days 1-15","Frictionless ingress and baseline calibration of trial and reactor telemetry."],["Days 16-45","Vector isolation: molecule-yield load balancing without recipe disclosure."],["Days 46-75","Peak shaving on bioreactor thermal offset and utility draw."],["Days 76-90","CPA / regulatory audit of accelerated synthesis milestones."]]},
    {id:"sec-02",code:"SEC-02",name:"Public Education & School Boards",short:"School boards",img:"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80",alt:"School operations and classroom morning",thesis:"Dispatch and smart-meter ingest, bus-route optimization, HVAC setback, trustee audit of retained capital.",metrics:[["Window","90 days"],["Net retention","81.0%"],["Upfront","$0.00"],["Access","CLOSED"]],steps:[["Days 1-15","Historical transportation dispatch and facility smart-meter ingestion."],["Days 16-45","Bus fleet route optimization against weather and bell windows."],["Days 46-75","HVAC setback and peak-shave on empty wings."],["Days 76-90","Certified trustee audit yielding capital retention."]]},
    {id:"sec-03",code:"SEC-03",name:"Municipal Governments & Utilities",short:"Municipal / utility",img:"https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1600&q=80",alt:"Electrical distribution infrastructure at dusk",thesis:"SCADA ingest, off-peak pumping, transformer thermal cycles, treasury audit for rate stability.",metrics:[["Window","90 days"],["Net retention","81.0%"],["Upfront","$0.00"],["Access","CLOSED"]],steps:[["Days 1-15","Ingestion of supervisory SCADA telemetry."],["Days 16-45","Water pumping schedule load-balancing off-peak."],["Days 46-75","Transformer thermal cycle optimization."],["Days 76-90","Municipal treasury audit yielding citizen rate stabilization."]]},
    {id:"sec-04",code:"SEC-04",name:"Athletic Telemetry & Performance",short:"Athletic telemetry",img:"https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80",alt:"Team huddle on an ice surface before play",thesis:"Training-load ingress, fatigue balancing, facility chiller stagger, zero-PII athlete sovereignty.",metrics:[["Window","90 days"],["Net retention","81.0%"],["Upfront","$0.00"],["Access","CLOSED"]],steps:[["Days 1-15","Historical training load and recovery metric ingress."],["Days 16-45","Predictive player fatigue balancing."],["Days 46-75","Training-facility chillers staggered cycling."],["Days 76-90","Team performance audit verifying zero-PII athlete sovereignty."]]},
    {id:"sec-05",code:"SEC-05",name:"Food Service Logistics",short:"Food service",img:"https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1600&q=80",alt:"High-volume commercial kitchen prep line",thesis:"POS and meter ingest, labor staging, oven peak-shave, independent CPA audit. Year-1 net retention floor 81%. Recipes unaltered.",metrics:[["Window","90 days"],["Net retention","81.0%"],["Upfront","$0.00"],["Access","CLOSED"]],steps:[["Days 1-15","POS, meter, invoice, and schedule ingress. CPA seals the baseline."],["Days 16-45","Predictive labor staging and batch controls."],["Days 46-75","Deck-oven peak shave, delivery staging, asset upkeep."],["Days 76-90","Independent CPA audit and capital distribution. Culinary sovereignty held."]]},
    {id:"sec-06",code:"SEC-06",name:"Industrial Manufacturing & SCADA",short:"Industrial SCADA",img:"https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1600&q=80",alt:"Manufacturing plant floor and industrial tooling",thesis:"Vibration ingest, predictive wear, staggered compressor start to kill Class-B peaks, plant-controller audit.",metrics:[["Window","90 days"],["Net retention","81.0%"],["Upfront","$0.00"],["Access","CLOSED"]],steps:[["Days 1-15","Vibration and telemetry sensor data ingress."],["Days 16-45","Machine-tool predictive wear balancing."],["Days 46-75","Staggered startup of heavy compressor banks."],["Days 76-90","Plant controller audit."]]},
    {id:"sec-07",code:"SEC-07",name:"Legal Tech & Corporate Counsel",short:"Corporate counsel",img:"https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80",alt:"Formal working table with contracts and counsel",thesis:"Contract-repository ingest, clause-drift detection, outside-counsel fee optimization, GC-certified audit.",metrics:[["Window","90 days"],["Net retention","81.0%"],["Upfront","$0.00"],["Access","CLOSED"]],steps:[["Days 1-15","Historical contract repository and compliance audit ingestion."],["Days 16-45","Automated clause drift detection."],["Days 46-75","Outside counsel fee optimization."],["Days 76-90","General counsel certified audit."]]},
    {id:"sec-08",code:"SEC-08",name:"Defense & Air-Gapped Primes",short:"Air-gapped defense",img:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80",alt:"Physical server room racks and fiber plant",thesis:"Air-gapped ledger validation, deterministic state checks, thermal-signature suppression, procurement audit.",metrics:[["Window","90 days"],["Net retention","81.0%"],["Upfront","$0.00"],["Access","CLOSED"]],steps:[["Days 1-15","Cryptographic air-gapped ledger validation."],["Days 16-45","Deterministic state transition verification."],["Days 46-75","Electromagnetic thermal signature suppression."],["Days 76-90","Formal defense procurement audit."]]},
    {id:"sec-09",code:"SEC-09",name:"Public Healthcare Networks",short:"Healthcare networks",img:"https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1600&q=80",alt:"Hospital corridor and acute-care operations",thesis:"PIPEDA/HIPAA bed and device ingest, suite load-balance, sterilizer / medical-gas peak shave, hospital-board audit.",metrics:[["Window","90 days"],["Net retention","81.0%"],["Upfront","$0.00"],["Access","CLOSED"]],steps:[["Days 1-15","Bed turnover and biomedical device telemetry under PIPEDA/HIPAA."],["Days 16-45","Surgical suite prep load balancing."],["Days 46-75","Sterilizer and medical-gas HVAC peak shaving."],["Days 76-90","Hospital board audit."]]},
    {id:"sec-10",code:"SEC-10",name:"Government Grants & SR&ED",short:"SR&ED / grants",img:"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80",alt:"Forensic accounting desk with binders and ledger screens",thesis:"Eligible R&D timesheet ingest, experimental-activity categorization, discrepancy audit, contingency filing at $0 upfront.",metrics:[["Window","90 days"],["Net retention","81.0%"],["Upfront","$0.00"],["Access","CLOSED"]],steps:[["Days 1-15","Trailing eligible R&D timesheets and technical commit-log ingestion."],["Days 16-45","Predictive experimental activity categorization."],["Days 46-75","Technical documentation discrepancy auditing."],["Days 76-90","Contingency tax-credit filing with zero upfront cost."]]}
  ];

  var active = null;
  function $(id) { return document.getElementById(id); }
  function log(obj) {
    if (streamEl) streamEl.textContent = JSON.stringify(obj);
  }
  function paintHero(sec) {
    var img = $("hero-img");
    var cap = $("hero-cap");
    var title = $("hero-title");
    var lede = $("hero-lede");
    var metrics = $("hero-metrics");
    if (img) { img.src = sec.img; img.alt = sec.alt; }
    if (cap) cap.textContent = sec.id ? (sec.code + " \u00b7 " + sec.name) : "Ten desks \u00b7 same rank";
    if (title) title.textContent = sec.name;
    if (lede) lede.textContent = sec.thesis;
    if (metrics) {
      metrics.innerHTML = "";
      sec.metrics.forEach(function (row) {
        var d = document.createElement("div");
        d.innerHTML = "<em>" + row[0] + "</em><b>" + row[1] + "</b>";
        metrics.appendChild(d);
      });
    }
    pipe.setAttribute("data-sector", sec.id || "");
    document.querySelectorAll(".card").forEach(function (el) {
      el.classList.toggle("on", !!(sec.id && el.getAttribute("data-id") === sec.id));
    });
    document.querySelectorAll(".iris-probe button").forEach(function (el) {
      el.classList.toggle("on", !!(sec.id && el.getAttribute("data-id") === sec.id));
    });
  }
  function select(id, source) {
    var sec = SECTORS.filter(function (s) { return s.id === id; })[0];
    if (!sec) return;
    active = sec;
    paintHero(sec);
    try { history.replaceState(null, "", "#" + sec.id); } catch (e) {}
    log({ t: Date.now(), src: source || "probe", sector: sec.code, access: "CLOSED", earned_cad: 0 });
    if (window.DCX_PLATE && window.DCX_PLATE.paintGauge) window.DCX_PLATE.paintGauge(81);
  }
  function openModal() {
    if (!modal) return;
    if (!active) {
      var m = document.getElementById("matrix");
      if (m) m.scrollIntoView({ behavior: "smooth" });
      return;
    }
    $("modal-kicker").textContent = active.code + " \u00b7 90-day binding pilot";
    $("modal-title").textContent = "Four-step onboarding \u2014 " + active.short;
    var ol = $("steps");
    ol.innerHTML = "";
    active.steps.forEach(function (st, i) {
      var li = document.createElement("li");
      li.innerHTML = "<strong>Step " + (i + 1) + " \u00b7 " + st[0] + "</strong><span>" + st[1] + "</span>";
      ol.appendChild(li);
    });
    modal.hidden = false;
    log({ t: Date.now(), src: "onboard", sector: active.code, step: "open" });
  }
  function closeModal() { if (modal) modal.hidden = true; }
  SECTORS.forEach(function (sec) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "card";
    b.setAttribute("data-id", sec.id);
    b.innerHTML = "<img src=\"" + sec.img + "\" alt=\"\"/><b>" + sec.short + "</b><span>" + sec.code + "</span>";
    b.addEventListener("click", function () { select(sec.id, "matrix"); });
    cardsEl.appendChild(b);
    if (probeEl) {
      var p = document.createElement("button");
      p.type = "button";
      p.setAttribute("data-id", sec.id);
      p.textContent = sec.code.replace("SEC-0", "").replace("SEC-", "");
      p.title = sec.name;
      p.addEventListener("click", function () { select(sec.id, "iris"); });
      probeEl.appendChild(p);
    }
  });
  var hotspot = $("hotspot");
  if (hotspot) hotspot.addEventListener("click", openModal);
  var mx = $("modal-x");
  if (mx) mx.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  var raw = (location.hash || "").replace(/^#/, "").toLowerCase();
  if (raw) select(raw, "hash");
  else {
    paintHero(HOUSE);
    log({ t: Date.now(), src: "boot", sector: "HOUSE", access: "CLOSED", earned_cad: 0 });
  }
  var beats = [
    "T-0 DCLM Layer[0] invariant check <1.0ms",
    "T-1 M-S watchdog fiduciary align <4.20ms",
    "T-2 ledger commit finality <10.0ms",
    "T-3 public surface sync <16.6ms",
    "INV-PII residual bits = 0",
    "ACCESS flag = CLOSED"
  ];
  var bi = 0;
  setInterval(function () {
    log({ t: Date.now(), beat: beats[bi % beats.length], sector: active ? active.code : "HOUSE" });
    bi++;
  }, 4200);
})();
