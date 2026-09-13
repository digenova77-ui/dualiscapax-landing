/**
 * DualisCapax SEC-01 hockey template — browser port of literature-prior clocks.
 * Source: research/SEC01-*.md + hockey_performance_manifold.py
 * NO_FORCE · simulation ≠ treatment · no named-minor PII · checkout CLOSED
 */
(function (g) {
  var LN2 = Math.log(2);
  var T_HALF_FAST_S = 22;
  var T_HALF_SLOW_S = 170;
  var POSITION_PRIOR = {
    F: { shift_s: 42, bench_s: 90, bursts_per_shift: 6, peak_kmh: 32, mean_kmh: 16.5 },
    D: { shift_s: 48, bench_s: 110, bursts_per_shift: 5, peak_kmh: 28, mean_kmh: 15 },
    G: { shift_s: 1200, bench_s: 0, bursts_per_shift: 2, peak_kmh: 12, mean_kmh: 4 }
  };
  var SKUS = {
    look: { id: "L0", cad: 0, ticks: 0, label: "Look", note: "LOOP / priors — free" },
    measure: { id: "L1", cad: 0, ticks: 1, label: "Measure", note: "1 synthetic shift receipt — free" },
    leaf: { id: "SEC01-LEAF", sku: "SKU-017", cad: 49, ticks: 8, label: "Leaf", note: "One seat · 8 GameTicks / 12 mo" },
    bench: { id: "SEC01-BENCH", sku: "SKU-018", cad: 299, ticks: 40, label: "Bench", note: "Coach F vs D · 40 ticks / 12 mo" },
    club: { id: "SEC01-CLUB", sku: "SKU-019", cad: 499, ticks: 160, label: "Club", note: "≤20 de-ID seats · 160 ticks / 12 mo" }
  };

  function pcrRemaining(t_s, a_fast, a_slow, tau_fast) {
    var hole = a_fast * Math.exp(-LN2 * t_s / tau_fast) + a_slow * Math.exp(-LN2 * t_s / T_HALF_SLOW_S);
    return Math.max(0, Math.min(1, 1 - hole));
  }
  function secondsToTarget(a_fast, a_slow, target, tau_fast) {
    var lo = 0, hi = 900;
    for (var i = 0; i < 40; i++) {
      var mid = 0.5 * (lo + hi);
      if (pcrRemaining(mid, a_fast, a_slow, tau_fast) >= target) hi = mid;
      else lo = mid;
    }
    return hi;
  }
  async function sha256Hex(str) {
    var buf = new TextEncoder().encode(str);
    var dig = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(dig)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  function runShift(input) {
    var pos = input.position || "F";
    var prior = POSITION_PRIOR[pos] || POSITION_PRIOR.F;
    var shift_s = num(input.shift_s, prior.shift_s);
    var bench_s = num(input.bench_s, prior.bench_s);
    var bursts = num(input.bursts, prior.bursts_per_shift);
    var peak = num(input.peak_kmh, prior.peak_kmh);
    var mean = num(input.mean_kmh, prior.mean_kmh);
    var hr_peak = num(input.hr_peak, 185);
    var hr_bench = num(input.hr_bench, 110);
    var evidence = input.tape_present ? "MEASURED_TAPE" : "LITERATURE_PRIOR";

    var raw = Math.min(0.8, 0.1 * bursts + 0.006 * shift_s);
    var a_fast = 0.62 * raw;
    var a_slow = 0.38 * raw;
    var tau = T_HALF_FAST_S;
    var rest_for_80 = secondsToTarget(a_fast, a_slow, 0.8, tau);
    var pcr_after = pcrRemaining(bench_s, a_fast, a_slow, tau);
    var q_strain = (shift_s / 45) * (hr_peak / 185);
    var glycogen_leak = 0.012 * (shift_s / 45) * (1 + 0.08 * bursts);
    if (pos === "D") glycogen_leak *= 1.15;
    var peak_ne_mean = peak - mean;
    var flag = pcr_after >= 0.8 && q_strain < 1.1 ? "OPTIMAL_BURST" : pcr_after >= 0.7 ? "PARTIAL_PCR_REFILL" : "FATIGUE_MANAGED";

    return {
      claim_floor: {
        evidence_class: evidence,
        simulation_is_not_treatment: true,
        named_minor_pii: false,
        quinte_tape_present: !!input.tape_present,
        sportlogiq_usd: "14.95 is THEIR meter — not Dualis"
      },
      position: pos,
      inputs: { shift_s: shift_s, bench_s: bench_s, bursts: bursts, peak_kmh: peak, mean_kmh: mean, hr_peak: hr_peak, hr_bench: hr_bench },
      clocks: {
        peak_minus_mean_kmh: round1(peak_ne_mean),
        pcr_after_bench: round3(pcr_after),
        seconds_to_pcr_80: round1(rest_for_80),
        glycogen_leak_frac: round3(glycogen_leak),
        q_strain: round3(q_strain),
        flag: flag
      },
      pipe: {
        teamsnap: "roster / RSVP — Dualis does not schedule",
        gamesheet: "score pull — never paste when league has GameSheet",
        livebarn: "tape pointer only — Dualis does not host video",
        hudl: "optional coach tags — Dualis does not replace Sportscode",
        dualis: "four clocks + receipt"
      },
      sku_hint: SKUS.leaf,
      law: "CLOSED — request grant. Youth sold to org/guardian, never a prescription to the player."
    };
  }

  function num(v, d) {
    var n = Number(v);
    return isFinite(n) && n >= 0 ? n : d;
  }
  function round1(n) { return Math.round(n * 10) / 10; }
  function round3(n) { return Math.round(n * 1000) / 1000; }

  function $(id) { return document.getElementById(id); }

  function readForm() {
    return {
      position: ($("hkPos") && $("hkPos").value) || "F",
      shift_s: $("hkShift") && $("hkShift").value,
      bench_s: $("hkBench") && $("hkBench").value,
      bursts: $("hkBursts") && $("hkBursts").value,
      peak_kmh: $("hkPeak") && $("hkPeak").value,
      mean_kmh: $("hkMean") && $("hkMean").value,
      hr_peak: $("hkHrPeak") && $("hkHrPeak").value,
      hr_bench: $("hkHrBench") && $("hkHrBench").value,
      tape_present: !!( $("hkTape") && $("hkTape").checked ),
      seat_label: ($("hkSeat") && $("hkSeat").value.trim()) || "SEAT-DEID-01"
    };
  }

  function fillPriors() {
    var pos = ($("hkPos") && $("hkPos").value) || "F";
    var p = POSITION_PRIOR[pos] || POSITION_PRIOR.F;
    if ($("hkShift")) $("hkShift").value = p.shift_s;
    if ($("hkBench")) $("hkBench").value = p.bench_s;
    if ($("hkBursts")) $("hkBursts").value = p.bursts_per_shift;
    if ($("hkPeak")) $("hkPeak").value = p.peak_kmh;
    if ($("hkMean")) $("hkMean").value = p.mean_kmh;
    if ($("hkHrPeak")) $("hkHrPeak").value = 185;
    if ($("hkHrBench")) $("hkHrBench").value = 110;
    if ($("hkTape")) $("hkTape").checked = false;
  }

  async function renderResult(out, seat) {
    var box = $("hkResult");
    if (!box) return;
    var c = out.clocks;
    var receipt = await sha256Hex([seat, out.position, c.pcr_after_bench, c.seconds_to_pcr_80, Date.now().toString().slice(0, 10)].join("|"));
    out.receipt_hash = receipt;
    try { localStorage.setItem("dc.hockey.lastReceipt", JSON.stringify(out)); } catch (e) {}

    box.style.display = "block";
    box.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem;">' +
        pill(out.claim_floor.evidence_class, "cyan") +
        pill(c.flag, c.flag === "OPTIMAL_BURST" ? "mint" : "orange") +
        pill("sim ≠ treatment", "pink") +
      "</div>" +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.55rem;margin-bottom:1rem;">' +
        metric("PCr after bench", (c.pcr_after_bench * 100).toFixed(1) + "%") +
        metric("Seconds to 80% PCr", c.seconds_to_pcr_80 + " s") +
        metric("Peak − mean", c.peak_minus_mean_kmh + " km/h") +
        metric("Glycogen leak", (c.glycogen_leak_frac * 100).toFixed(2) + "%") +
      "</div>" +
      '<p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5;margin-bottom:0.65rem;">' +
        "Seat <code style=\"font-family:var(--font-mono);color:var(--accent-cyan);\">" + esc(seat) + "</code> · position " + esc(out.position) +
        ". Residual $ only if ice-waste is measured in a signed book — not on this prior." +
      "</p>" +
      '<div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);word-break:break-all;margin-bottom:0.85rem;">receipt ' + receipt.slice(0, 32) + "…</div>" +
      '<div style="display:flex;flex-wrap:wrap;gap:0.45rem;">' +
        '<button type="button" class="nav-btn-solid" style="font-size:0.8rem;padding:0.5rem 0.85rem;opacity:0.85;" disabled title="Jacket closed">CLOSED — request grant</button>' +
        '<a class="action-pill" href="fuel.html" style="text-decoration:none;font-size:0.75rem;padding:0.45rem 0.75rem;">Extra ticks = Fuel →</a>' +
        '<button type="button" class="action-pill" style="font-size:0.75rem;padding:0.45rem 0.75rem;" onclick="DCHockey.downloadReceipt()">Download receipt JSON</button>' +
      "</div>";
  }

  function metric(label, val) {
    return '<div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:10px;padding:0.65rem;">' +
      '<div style="font-size:0.65rem;font-family:var(--font-mono);color:var(--text-muted);text-transform:uppercase;">' + esc(label) + "</div>" +
      '<div style="font-size:1.15rem;font-weight:900;color:var(--accent-mint);margin-top:0.2rem;">' + esc(val) + "</div></div>";
  }
  function pill(t, kind) {
    var c = kind === "mint" ? "var(--accent-mint)" : kind === "orange" ? "var(--accent-orange)" : kind === "pink" ? "var(--accent-pink)" : "var(--accent-cyan)";
    return '<span style="font-size:0.68rem;font-family:var(--font-mono);font-weight:800;border:1px solid ' + c + ";color:" + c + ';padding:0.15rem 0.45rem;border-radius:4px;">' + esc(t) + "</span>";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  async function run() {
    var form = readForm();
    // Block obvious named-minor attempts in seat label
    if (/^[A-Z][a-z]+ [A-Z]/.test(form.seat_label) || /\b(jr|u1[0-9]|minor)\b/i.test(form.seat_label) && /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(form.seat_label)) {
      alert("Use a de-identified seat id (e.g. SEAT-DEID-07). No named-minor PII on this page.");
      return;
    }
    var out = runShift(form);
    await renderResult(out, form.seat_label);
    var pipe = $("hkPipeStatus");
    if (pipe) {
      pipe.textContent = form.tape_present
        ? "measured_tape path · quinte_tape_present true (fields pasted)"
        : "literature prior · quinte_tape_present false — paste LiveBarn PA / watch numbers when you have them";
    }
  }

  function downloadReceipt() {
    try {
      var raw = localStorage.getItem("dc.hockey.lastReceipt");
      if (!raw) return;
      var blob = new Blob([raw], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "dualis-sec01-receipt.json";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    } catch (e) {}
  }

  function boot() {
    if ($("hkPos")) $("hkPos").addEventListener("change", fillPriors);
    if ($("btnHkPriors")) $("btnHkPriors").onclick = fillPriors;
    if ($("btnHkRun")) $("btnHkRun").onclick = function () { run(); };
    fillPriors();
  }

  g.DCHockey = { SKUS: SKUS, runShift: runShift, run: run, fillPriors: fillPriors, downloadReceipt: downloadReceipt };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);
