(function () {
  const $ = (id) => document.getElementById(id);
  const state = { phrase_sha256: null, passkey: null, eth_sig: null };

  async function sha256hex(text) {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || ""); }

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
      $("keyOut").textContent = "Passkey on this device.";
    } catch (e) { $("keyOut").textContent = (e && e.name) || "cancelled"; }
  };

  $("signEth").onclick = async function () {
    const addr = ($("eth").value || "").trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) { $("ethOut").textContent = "Need a full Ethereum address."; return; }
    const msg = "DualisCapax Unity bind " + location.host + " " + new Date().toISOString().slice(0, 10);
    if (!window.ethereum || !window.ethereum.request) { $("ethOut").textContent = "Address kept. No wallet on this browser."; return; }
    try {
      const sig = await window.ethereum.request({ method: "personal_sign", params: [msg, addr] });
      state.eth_sig = { addr: addr.toLowerCase(), msg: msg, sig: sig };
      $("ethOut").textContent = "Wallet signed.";
    } catch (e) { $("ethOut").textContent = "Wallet refused."; }
  };

  function packet() {
    const eth = ($("eth").value || "").trim().toLowerCase();
    const firm = ($("firm").value || "").trim();
    const email = ($("email").value || "").trim().toLowerCase();
    const org = ($("org").value || "").trim().toLowerCase();
    return {
      schema: "unity.id.v1",
      at: new Date().toISOString(),
      host: location.host,
      look: {
        name: $("name").value || "",
        kind: $("kind").value,
        municipality: $("muni").value || "",
        email: validEmail(email) ? email : null,
        org_domain: org || null,
        org_matches_email: org ? email.endsWith("@" + org) : null,
      },
      passphrase_sha256: state.phrase_sha256,
      passkey: state.passkey,
      eth: { address: /^0x[0-9a-fA-F]{40}$/.test(eth) ? eth : null, signature: state.eth_sig, contract: "not_deployed_from_this_page" },
      llp: { name: firm || null, role: firm ? $("firmRole").value : null, status: firm ? "declared" : "NEED_FIRM" },
      declaration: { checked: !!($("attest") && $("attest").checked) },
      grant: { class0_look: true, model_seat_cad: 0, model_seat_days: 90, fuel: 0 },
      law: ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"],
    };
  }

  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type || "application/json" }));
    a.download = name;
    a.click();
  }

  function emit(p) {
    const pack = buildPack(p);
    const seat = pack.seat;
    download("unity-deploy-pack.json", JSON.stringify(pack, null, 2), "application/json");
    download("unity-deploy-pack.html", packHtml(pack), "text/html");
    download("dualis-90-day-seat.html", agreementHtml(seat), "text/html");
    download("dualis-runtime.html", runtimeHtml(p, seat), "text/html");
    return pack;
  }

  $("seal").onclick = function () {
    if (!$("attest").checked) { $("log").textContent = "Check the box that this is you."; return; }
    if (!validEmail($("email").value)) { $("log").textContent = "Need an email."; return; }
    if (!($("muni").value || "").trim()) { $("log").textContent = "Need a town."; return; }
    if (!($("name").value || "").trim()) { $("log").textContent = "Need a name."; return; }
    const p = packet();
    try { localStorage.setItem("dc.unity.id", JSON.stringify(p)); } catch (e) {}
    const pack = emit(p);
    $("log").textContent = "Four files downloaded. Modeling seat CAD $0 until " + pack.seat.end.slice(0, 10) + ". Open dualis-runtime.html.";
    setTimeout(function () { location.href = "runtime.html"; }, 900);
  };

  $("mail").onclick = function () {
    const p = packet();
    if (!validEmail(p.look.email)) { $("log").textContent = "Email first."; return; }
    location.href =
      "mailto:" + p.look.email +
      "?subject=" + encodeURIComponent("Your Dualis files " + p.at.slice(0, 10)) +
      "&body=" + encodeURIComponent("Four files should already be in Downloads: pack, letter, runtime. Dualis did not send this mail from a server.");
  };

  $("dl").onclick = function () {
    emit(packet());
    $("log").textContent = "Files downloaded. Seal when you are ready to start the 90 days.";
  };
})();
