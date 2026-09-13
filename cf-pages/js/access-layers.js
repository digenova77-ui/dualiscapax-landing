/**
 * DualisCapax access ladder — V8 / payment-links.json
 * Look+Measure free. Leaf/Branch/Trunk/Atlas priced.
 * SEAL is NOT on the public face: Phase-3 / .org/.gov / SEAL-1 institutions only.
 * Jacket open flag gates card checkout. Never invent buy.stripe.com URLs.
 */
(function (g) {
  var LADDER = {
    look:   { key: "look",   sku: null,      cad: 0,    label: "Look",   unit: "public", status: "open",
              what: "Title, residual prose, simulation ≠ treatment. Free.",
              not: "Depth packs, sealed engines, Phase-3 workbooks." },
    measure:{ key: "measure",sku: null,      cad: 0,    label: "Measure",unit: "on-device", status: "open",
              what: "Poles + receipt on device. Free.",
              not: "IP unlock." },
    edu_leaf:{ key: "edu_leaf", sku: "SKU-016", cad: 19, label: "Edu Leaf", unit: "30-Day Pass", status: "closed",
              what: "Educational indication overview.",
              not: "ALS/MS sealed body." },
    leaf:   { key: "leaf",   sku: "SKU-017", cad: 49,   label: "Leaf",   unit: "12-Month Pass", status: "closed",
              what: "One named room / indication seat format.",
              not: "The program, sealed engine, or vault." },
    branch: { key: "branch", sku: "SKU-018", cad: 299,  label: "Branch", unit: "12-Month Pass", status: "closed",
              what: "One clade of 10–20 names (e.g. Neuro-10).",
              not: "Cross-clade vault." },
    trunk:  { key: "trunk",  sku: "SKU-019", cad: 499,  label: "Trunk",  unit: "12-Month Pass", status: "closed",
              what: "One super-trunk domain class name list.",
              not: "Transfer of sealed engines." },
    library:{ key: "library",sku: "SKU-029", cad: 1499, label: "Atlas",  unit: "Perpetual", status: "closed",
              what: "Taxonomic atlas / index across named kingdoms.",
              not: "Sealed-body dump or 'all medical simulation'." },
    seal:   { key: "seal",   sku: "SEAL-1",   cad: null, label: "SEAL",  unit: "identity / co-dev", status: "gated",
              what: "Phase-3 / market-path institutions only (.org / .gov / Dualis SEAL-1).",
              not: "Public unlock. Not for orgs with no commercialization path." },
    crown:  { key: "crown",  sku: "CROWN",   cad: null, label: "Crown", unit: "wet-ink", status: "never_agent",
              what: "Owner wet-ink only.",
              not: "Agent-sold on the lander." }
  };

  var LINK_KEYS = { leaf: "leaf", branch: "branch", trunk: "trunk", library: "library" };

  function catalog() {
    return (g.DCBuy && g.DCBuy.jacket) || null;
  }
  function isOpen() {
    var j = catalog();
    if (j && typeof j.open === "boolean") return j.open;
    return !!(g.DC_PAYMENTS && g.DC_PAYMENTS.jacket_open);
  }
  function liveUrl(key) {
    var j = catalog();
    if (j && j.skus && j.skus[key] && j.skus[key].live_url) return j.skus[key].live_url;
    if (j && j.payment_links && j.payment_links.live) return j.payment_links.live[key] || null;
    if (g.DC_PAYMENTS) {
      if (key === "leaf" && g.DC_PAYMENTS.leaf) return g.DC_PAYMENTS.leaf;
      if (key === "trunk" && g.DC_PAYMENTS.trunk) return g.DC_PAYMENTS.trunk;
      if (key === "research" && g.DC_PAYMENTS.research) return g.DC_PAYMENTS.research;
    }
    return null;
  }

  function institutionalGranted(hub) {
    if (hub === "engineering") {
      return !!(g.DC_ENGINEERING && typeof g.DC_ENGINEERING.granted === "function" && g.DC_ENGINEERING.granted());
    }
    return !!(g.DC_MEDICAL && typeof g.DC_MEDICAL.granted === "function" && g.DC_MEDICAL.granted());
  }

  /** Show SEAL UI only for institutional domain selection or granted session — not on every public leaf. */
  function showSealFace(item, hub, opts) {
    opts = opts || {};
    var tier = tierFor(item);
    if (tier === "seal") return true;
    if (opts.forceSeal) return true;
    var dom = opts.domain || "";
    if (dom === "institutional") return true;
    return institutionalGranted(hub);
  }

  function tierFor(item) {
    if (!item) return "look";
    var id = String(item.id || "");
    var layer = String(item.layer || item.tier || "").toLowerCase();
    if (layer) return layer;
    if (id === "pharma_triad" || /seal|triad|phase.?3|co-?dev/i.test(id + " " + (item.title || ""))) return "seal";
    if (id === "full_compendium" || id === "eng_grand_suite" || /compendium|atlas|grand.?suite|117/i.test(id)) return "library";
    if (/_pack$/.test(id) || (/branch|pack/i.test(id) && /10|all/i.test(item.title || ""))) return "branch";
    if (/trunk|super-?trunk/i.test(id + (item.title || ""))) return "trunk";
    return "leaf";
  }

  function priceLine(tier) {
    var t = LADDER[tier] || LADDER.leaf;
    if (t.cad == null) return t.label + " · " + t.unit;
    if (t.cad === 0) return "CAD $0 · " + t.label;
    return "CAD $" + t.cad.toLocaleString("en-CA") + " · " + t.label + " (" + (t.sku || "") + ")";
  }

  function gateCopy(tier, hub, sealVisible) {
    hub = hub || "medical";
    var t = LADDER[tier] || LADDER.leaf;
    var lines = [];
    lines.push("Look is free. Simulation is not treatment.");
    if (tier === "look" || tier === "measure") {
      lines.push("Public floor open.");
      return lines.join(" ");
    }
    if (tier === "seal" || sealVisible) {
      if (hub === "medical") {
        lines.push("SEAL depth is for Phase-3 / market-path institutions (.org / .gov / SEAL-1). Not shown as a public buy button.");
      } else {
        lines.push("Engineering SEAL: .edu/.org/.gov, plant allow-list, or Dualis SEAL-1. Not a P.Eng. stamp.");
      }
      if (tier === "seal") return lines.join(" ");
    }
    lines.push(t.what + " Not: " + t.not);
    if (!isOpen()) lines.push("Card checkout CLOSED (jacket). Priced for when open.");
    return lines.join(" ");
  }

  function renderGatePanel(el, item, hub, opts) {
    if (!el) return;
    opts = opts || {};
    var tier = tierFor(item);
    var t = LADDER[tier] || LADDER.leaf;
    var url = (tier in LINK_KEYS) ? liveUrl(LINK_KEYS[tier]) : null;
    var open = isOpen();
    var sku = item && item.sku ? item.sku : (t.sku || "—");
    var sealFace = showSealFace(item, hub, opts);
    var granted = institutionalGranted(hub);

    var html = "";
    html += '<div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.65rem;">';
    html += pill("Look", "open");
    if (tier !== "seal") html += pill(t.label, t.status === "open" ? "open" : "closed");
    if (sealFace) html += pill("SEAL", granted ? "open" : "seal");
    html += "</div>";

    html += '<div style="font-family:var(--font-mono);font-size:0.78rem;color:var(--accent-mint);font-weight:800;margin-bottom:0.35rem;">' +
      escapeHtml(priceLine(tier === "seal" ? "seal" : tier)) + "</div>";
    html += '<div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5;margin-bottom:0.75rem;">' +
      escapeHtml(gateCopy(tier, hub, sealFace)) + "</div>";
    html += '<div style="font-size:0.72rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:0.75rem;">Catalog SKU face: ' +
      escapeHtml(sku) + " · ladder " + escapeHtml(t.sku || tier) + " · jacket " + (open ? "OPEN" : "CLOSED") + "</div>";

    html += '<div style="display:flex;flex-wrap:wrap;gap:0.45rem;">';
    html += '<span class="action-pill" style="padding:0.45rem 0.75rem;font-size:0.75rem;cursor:default;">👁 Look free</span>';

    if (tier === "seal" || (sealFace && opts.domain === "institutional")) {
      if (granted) {
        html += '<a class="nav-btn-solid" href="#med-gate" style="text-decoration:none;font-size:0.78rem;padding:0.5rem 0.85rem;background:var(--accent-purple);">SEAL unlocked · continue →</a>';
      } else {
        html += '<button type="button" class="nav-btn-solid" style="font-size:0.78rem;padding:0.5rem 0.85rem;background:var(--accent-purple);" onclick="(window.DCAccess&&DCAccess.openSealDoor&&DCAccess.openSealDoor(\'' + (hub||"medical") + '\'))">Institutional SEAL door →</button>';
      }
    } else if (open && url) {
      html += '<a class="nav-btn-solid" href="' + url + '" target="_blank" rel="noopener" style="text-decoration:none;font-size:0.78rem;padding:0.5rem 0.85rem;">Stripe · ' +
        escapeHtml(t.label) + " →</a>";
    } else if (url && !open) {
      html += '<button type="button" class="nav-btn-solid" style="font-size:0.78rem;padding:0.5rem 0.85rem;opacity:0.75;" disabled title="Jacket closed">Priced · checkout closed</button>';
      html += '<a class="action-pill" href="payments.html" style="text-decoration:none;font-size:0.75rem;padding:0.45rem 0.75rem;">See rails →</a>';
    } else if (tier !== "seal") {
      html += '<button type="button" class="nav-btn-solid" style="font-size:0.78rem;padding:0.5rem 0.85rem;opacity:0.75;" disabled>Link pending · ' +
        escapeHtml(t.label) + "</button>";
    }
    html += "</div>";
    el.innerHTML = html;
  }

  function openSealDoor(hub) {
    hub = hub || "medical";
    var door = hub === "engineering" ? "physics.html#eng-gate" : "research.html#med-gate";
    // Soft deny for public: scroll to institutional gate copy, do not fake a Stripe SEAL checkout
    if (institutionalGranted(hub)) {
      location.href = door;
      return;
    }
    var box = document.getElementById(hub === "engineering" ? "eng-gate" : "med-gate");
    if (box) {
      box.scrollIntoView({ behavior: "smooth", block: "start" });
      var deny = document.getElementById("sealDenyNote");
      if (deny) {
        deny.style.display = "block";
        deny.textContent = "Access denied for public checkout. SEAL is for authorized .org / .gov / Phase-3 agencies only. Use the institutional door below — not a consumer payment link.";
      }
    } else {
      location.href = door;
    }
  }

  function pill(label, kind) {
    var color = kind === "open" ? "var(--accent-mint)" : kind === "seal" ? "var(--accent-purple)" : "var(--accent-orange)";
    return '<span style="font-size:0.68rem;font-family:var(--font-mono);font-weight:800;border:1px solid ' + color +
      ";color:" + color + ';padding:0.15rem 0.45rem;border-radius:4px;">' + escapeHtml(label) + "</span>";
  }
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  g.DCAccess = {
    LADDER: LADDER,
    tierFor: tierFor,
    priceLine: priceLine,
    gateCopy: gateCopy,
    renderGatePanel: renderGatePanel,
    showSealFace: showSealFace,
    openSealDoor: openSealDoor,
    isOpen: isOpen,
    liveUrl: liveUrl
  };
})(typeof window !== "undefined" ? window : globalThis);
