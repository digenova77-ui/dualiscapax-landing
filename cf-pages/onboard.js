(function () {
  const $ = (id) => document.getElementById(id);
  const state = { phrase_sha256: null, passkey: null, eth_sig: null, step: 1 };

  // Sync hidden #kind from radios (no visible dropdown)
  (function syncKindFromRadios() {
    var box = $("sectorRadios");
    if (!box) return;
    function apply() {
      var checked = box.querySelector('input[name="sectorSeat"]:checked');
      if (checked && $("kind")) $("kind").value = checked.value;
    }
    box.addEventListener("change", apply);
    apply();
  })();


  async function sha256hex(text) {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || ""); }

  function unityFor(kind) {
    if (!window.UnityID) return null;
    var root = UnityID.mintU1();
    var seed = 1;
    if (kind === "shop") seed = 2;
    if (kind === "school") seed = 3;
    if (kind === "llp" || kind === "auditor" || kind === "lawyer" || kind === "corp") seed = 4;
    var name = ($("name").value || "").trim().toLowerCase();
    if (name.indexOf("david") === 0 && name.indexOf("genova") !== -1 && kind === "person") return root;
    var n = 1;
    try {
      n = (parseInt(localStorage.getItem("dc.unity.hatch.n") || "0", 10) || 0) + 1;
      localStorage.setItem("dc.unity.hatch.n", String(n));
    } catch (e) {}
    return UnityID.hatch(root, seed, n);
  }

  function setStep(n) {
    state.step = n;
    document.querySelectorAll(".ob-step").forEach(function (el) {
      el.classList.toggle("on", Number(el.getAttribute("data-panel")) === n);
    });
    document.querySelectorAll("#obProgress .ob-pill").forEach(function (el) {
      var s = Number(el.getAttribute("data-step"));
      el.classList.remove("on", "done");
      if (s < n) el.classList.add("done");
      if (s === n) el.classList.add("on");
    });
    try {
      var panel = $("step" + n);
      if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {}
  }

  // Sector radios → hidden #kind (compat with packet())
  /* sector radios → #kind */);
  }

  function validateStep1() {
    if (!($("name").value || "").trim()) { if ($("log")) $("log").textContent = "Need a name."; return false; }
    if (!($("muni").value || "").trim()) { if ($("log")) $("log").textContent = "Need a town."; return false; }
    if (!validEmail($("email").value)) { if ($("log")) $("log").textContent = "Need an email."; return false; }
    return true;
  }

  if ($("next1")) {
    $("next1").onclick = function () {
      if (!validateStep1()) {
        setStep(1);
        var log = $("log");
        if (log && !log.textContent) log.textContent = "Name, town, and email first.";
        // show feedback on step1 via temporary alert text under actions
        var existing = document.getElementById("step1Hint");
        if (!existing) {
          existing = document.createElement("p");
          existing.id = "step1Hint";
          existing.className = "ob-out";
          $("step1").appendChild(existing);
        }
        existing.textContent = $("log") ? $("log").textContent : "Name, town, and email first.";
        existing.style.color = "var(--accent-pink)";
        return;
      }
      var hint = document.getElementById("step1Hint");
      if (hint) hint.textContent = "";
      setStep(2);
    };
  }
  if ($("back2")) $("back2").onclick = function () { setStep(1); };
  if ($("next2")) {
    $("next2").onclick = function () {
      // Phrase fingerprint recommended but NO_FORCE — allow continue; seal still works
      setStep(3);
    };
  }
  if ($("back3")) $("back3").onclick = function () { setStep(2); };

  $("hashPhrase").onclick = async function () {
    const p = $("phrase").value;
    if (!p || p.length < 8) { $("phraseOut").textContent = "Use at least eight characters."; return; }
    state.phrase_sha256 = await sha256hex(p);
    $("phrase").value = "";
    $("phraseOut").textContent = "Fingerprint saved. The phrase itself was cleared.";
  };

  $("makeKey").onclick = async function () {
    if (!window.PublicKeyCredential) { $("keyOut").textContent = "This browser has no passkeys."; return; }
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "DualisCapax", id: location.hostname },
          user: { id: crypto.getRandomValues(new Uint8Array(16)), name: $("email").value || "unity", displayName: $("name").value || "unity" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          timeout: 60000,
          authenticatorSelection: { userVerification: "preferred", residentKey: "preferred" },
        },
      });
      state.passkey = { id: cred.id, type: cred.type };
      if (window.DCPasskey && DCPasskey.saveCredFromCredential) {
        DCPasskey.saveCredFromCredential(cred, { userName: ($("email").value || "unity") });
      }
      $("keyOut").textContent = "Passkey on this device · unlocks ice + identity handshakes.";
    } catch (e) { $("keyOut").textContent = (e && e.name) || "cancelled"; }
  };


  function ethProvider() {
    var eth = window.ethereum;
    if (!eth) return null;
    // Prefer a real injected provider; if multiple, try the first that can request
    if (eth.providers && eth.providers.length) {
      var prefer = eth.providers.find(function (p) { return p.isTrust || p.isMetaMask || p.isCoinbaseWallet || p.isBraveWallet; });
      return prefer || eth.providers[0];
    }
    return eth;
  }

  function showWalletAdvice(reason) {
    var out = $("ethOut");
    if (!out) return;
    out.innerHTML =
      (reason ? reason + " " : "") +
      '<a href="wallet-advice.html">Get neutral wallet tips</a> (no Dualis affiliation). Or skip — wallet is optional.';
  }

  async function connectWallet() {
    var out = $("ethOut");
    var provider = ethProvider();
    if (!provider || !provider.request) {
      showWalletAdvice("No wallet detected in this browser.");
      return null;
    }
    try {
      var accounts = await provider.request({ method: "eth_requestAccounts" });
      var addr = (accounts && accounts[0]) ? String(accounts[0]) : "";
      if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
        if (out) out.textContent = "Wallet connected but no address returned.";
        return null;
      }
      if ($("eth")) $("eth").value = addr;
      var label = provider.isTrust ? "Trust Wallet" :
        provider.isMetaMask ? "MetaMask" :
        provider.isCoinbaseWallet ? "Coinbase Wallet" :
        provider.isBraveWallet ? "Brave Wallet" : "Browser wallet";
      if (out) out.textContent = label + " connected · " + addr.slice(0, 6) + "…" + addr.slice(-4) + ". Optional: Prove with signature.";
      return addr;
    } catch (e) {
      var msg = (e && (e.message || e.code)) || "cancelled";
      if (String(msg).indexOf("4001") !== -1 || /reject|denied|cancel/i.test(String(msg))) {
        if (out) out.textContent = "Wallet prompt dismissed. You can try again or skip.";
      } else {
        if (out) out.textContent = "Wallet error: " + msg;
      }
      return null;
    }
  }

  if ($("connectEth")) {
    $("connectEth").onclick = function () { connectWallet(); };
  }

  // Open Advanced when linked with #advanced
  try {
    if (location.hash === "#advanced") {
      var det = document.querySelector("details");
      if (det) det.open = true;
    }
  } catch (e) {}

  $("signEth").onclick = async function () {
    var out = $("ethOut");
    var addr = ($("eth").value || "").trim();
    var provider = ethProvider();
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      // Try connect first if empty
      addr = (await connectWallet()) || "";
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      showWalletAdvice("Need a wallet address to prove.");
      return;
    }
    if (!provider || !provider.request) {
      showWalletAdvice("Address kept locally. No wallet on this browser to sign.");
      return;
    }
    const msg = "DualisCapax Unity bind " + location.host + " " + new Date().toISOString().slice(0, 10);
    try {
      // Some wallets want hex-encoded message; personal_sign with address works for MetaMask/Trust
      const sig = await provider.request({ method: "personal_sign", params: [msg, addr] });
      state.eth_sig = { addr: addr.toLowerCase(), msg: msg, sig: sig };
      if (out) out.textContent = "Wallet signed · local prove only. Dualis does not hold your keys.";
    } catch (e) {
      if (out) out.textContent = "Wallet refused or closed. Address still optional — you can seal without it.";
    }
  };



  async function mintContractId(p) {
    var raw = JSON.stringify({
      at: p.at,
      host: p.host,
      name: p.look && p.look.name,
      kind: p.look && p.look.kind,
      email: p.look && p.look.email,
      muni: p.look && p.look.municipality,
      aud: p.auditor && p.auditor.email
    });
    var hex = await sha256hex(raw);
    return "dc90_" + hex.slice(0, 16);
  }

  function packet() {
    const eth = ($("eth").value || "").trim().toLowerCase();
    const firm = ($("firm").value || "").trim();
    const email = ($("email").value || "").trim().toLowerCase();
    const org = ($("org").value || "").trim().toLowerCase();
    const kind = $("kind").value;
    const p = {
      schema: "unity.id.v1",
      at: new Date().toISOString(),
      host: location.host,
      look: {
        name: $("name").value || "",
        kind: kind,
        municipality: $("muni").value || "",
        email: validEmail(email) ? email : null,
        org_domain: org || null,
        org_matches_email: org ? email.endsWith("@" + org) : null,
      },
      passphrase_sha256: state.phrase_sha256,
      passkey: state.passkey,
      eth: { address: /^0x[0-9a-fA-F]{40}$/.test(eth) ? eth : null, signature: state.eth_sig, contract: "not_deployed_from_this_pack" },
      llp: { name: firm || null, role: firm ? $("firmRole").value : null, status: firm ? "declared" : "NEED_FIRM" },
      auditor: (function () {
        var an = ($("audNameOn") && $("audNameOn").value || "").trim();
        var ae = ($("audEmailOn") && $("audEmailOn").value || "").trim().toLowerCase();
        if (!an && !ae) return { named: false, name: null, email: null, status: "NONE" };
        return {
          named: true,
          name: an || null,
          email: validEmail(ae) ? ae : (ae || null),
          status: "NAMED_AT_SEAL",
          role: "auditor"
        };
      })(),
      declaration: { checked: !!($("attest") && $("attest").checked) },
      grant: { class0_look: true, model_seat_cad: 0, model_seat_days: 90, fuel: 0 },
      law: ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"],
    };
    var u = unityFor(kind);
    if (u) p.unity = u;
    return p;
  }

  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type || "text/html" }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  async function goLive(p) {
    var cid = await mintContractId(p);
    p.contract_id = cid;
    p.seat = p.seat || {};
    p.seat.contract_id = cid;
    p.seat.cad = 0;
    p.seat.days = 90;
    if (p.auditor && p.auditor.named) {
      p.auditor.contract_id = cid;
      p.auditor.audit_path = "runtime.html?audit=" + encodeURIComponent(cid);
    }
    const pack = buildPack(p);
    pack.contract_id = cid;
    try { localStorage.setItem("dc.unity.id", JSON.stringify(p)); } catch (e) {}
    try { localStorage.setItem("dc.unity.pack", JSON.stringify(pack)); } catch (e) {}
    try {
      var store = {};
      try { store = JSON.parse(localStorage.getItem("dc.contracts") || "{}"); } catch (e2) {}
      store[cid] = {
        contract_id: cid,
        at: p.at,
        look: p.look,
        auditor: p.auditor || { named: false },
        grant: p.grant,
        unity: p.unity || null,
        measure: null,
        attestation: null
      };
      localStorage.setItem("dc.contracts", JSON.stringify(store));
    } catch (e3) {}
    download("dualis-start.html", startHtml(p, pack), "text/html");
    if (p.auditor && p.auditor.named) {
      var invite = {
        schema: "dualis.auditor.invite.v1",
        contract_id: cid,
        seat_holder: p.look && p.look.name,
        auditor: { name: p.auditor.name, email: p.auditor.email },
        open: (location.origin || "") + "/runtime.html?audit=" + encodeURIComponent(cid),
        note: "Open this link on your device. Back-check math for this contract only. Books stay with the seat holder unless they share a local report."
      };
      download("dualis-auditor-invite-" + cid + ".json", JSON.stringify(invite, null, 2), "application/json");
    }
    return pack;
  }

  function done(pack, p) {
    var end = (pack.seat && pack.seat.end || "").slice(0, 10);
    var u = pack.unity_id && pack.unity_id.unity;
    var tag = u ? (u.human + " · " + u.public) : "number attaches later";
    var cid = (p && p.contract_id) || pack.contract_id || "";
    var aud = "";
    if (p && p.auditor && p.auditor.named) {
      aud = " Auditor named (" + (p.auditor.name || p.auditor.email || "named") + "). Share link: " +
        "<a href=\"runtime.html?audit=" + encodeURIComponent(cid) + "\"><strong>runtime.html?audit=" + cid + "</strong></a> (also downloaded invite JSON).";
    } else {
      aud = " No auditor named — you can add one later in runtime.";
    }
    $("log").innerHTML =
      "Unity " + tag + ". Seat CAD $0 · contract <code style=\"font-family:var(--font-mono);font-size:0.75rem\">" + cid + "</code> through " + end +
      "." + aud + " Opening on-device runtime… " +
      "<a href=\"runtime.html\"><strong>Enter workbench now</strong></a>";
  }

  $("seal").onclick = async function () {
    if (!$("attest").checked) { $("log").textContent = "Check the box that this is you."; setStep(3); return; }
    if (!validateStep1()) { setStep(1); return; }
    var an = ($("audNameOn") && $("audNameOn").value || "").trim();
    var ae = ($("audEmailOn") && $("audEmailOn").value || "").trim();
    if ((an && !ae) || (!an && ae)) {
      $("log").textContent = "Auditor: fill both name and email, or leave both blank.";
      return;
    }
    if (ae && !validEmail(ae)) { $("log").textContent = "Auditor email looks invalid — fix or clear both fields."; return; }
    var p = packet();
    var pack = await goLive(p);
    done(pack, p);
    try { localStorage.setItem("dc.runtime.handoff", "1"); } catch (e) {}
    setTimeout(function () { location.href = "runtime.html?from=onboard"; }, 1100);
  };

  $("mail").onclick = function () {
    const p = packet();
    if (!validEmail(p.look.email)) { $("log").textContent = "Email first."; setStep(1); return; }
    location.href =
      "mailto:" + p.look.email +
      "?subject=" + encodeURIComponent("Dualis start file") +
      "&body=" + encodeURIComponent("Open dualis-start.html from Downloads, or open runtime.html (on-device workbench) on the site. Load books on runtime — they stay local. Dualis did not send this from a server.");
  };

  $("dl").onclick = async function () {
    if (!validateStep1()) { setStep(1); return; }
    var p = packet();
    var pack = await goLive(p);
    done(pack, p);
    try { localStorage.setItem("dc.runtime.handoff", "1"); } catch (e) {}
    setTimeout(function () { location.href = "runtime.html?from=onboard"; }, 1100);
  };

  setStep(1);
})();
