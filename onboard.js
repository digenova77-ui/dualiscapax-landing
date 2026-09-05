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
    if (!p || p.length < 8) { $("phraseOut").textContent = "Phrase too short."; return; }
    state.phrase_sha256 = await sha256hex(p);
    $("phrase").value = "";
    $("phraseOut").textContent = "sha256 " + state.phrase_sha256.slice(0, 16) + "… raw cleared.";
  };

  $("makeKey").onclick = async function () {
    if (!window.PublicKeyCredential) { $("keyOut").textContent = "No WebAuthn."; return; }
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
      $("keyOut").textContent = "Passkey " + cred.id.slice(0, 18) + "…";
    } catch (e) { $("keyOut").textContent = (e && e.name) || "cancelled"; }
  };

  $("signEth").onclick = async function () {
    const addr = ($("eth").value || "").trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) { $("ethOut").textContent = "Need 0x + 40 hex."; return; }
    const msg = "DualisCapax Unity bind " + location.host + " " + new Date().toISOString().slice(0, 10);
    if (!window.ethereum || !window.ethereum.request) { $("ethOut").textContent = "Address kept. No wallet."; return; }
    try {
      const sig = await window.ethereum.request({ method: "personal_sign", params: [msg, addr] });
      state.eth_sig = { addr: addr.toLowerCase(), msg: msg, sig: sig };
      $("ethOut").textContent = "Signed " + sig.slice(0, 18) + "…";
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
      grant: { class0_look: true, fuel: 0, stripe_fuel40: "https://buy.stripe.com/fZu3cxcyj2jvfOV0RLffy05" },
      law: ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"],
    };
  }

  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type || "application/json" }));
    a.download = name;
    a.click();
  }

  $("seal").onclick = function () {
    if (!$("attest").checked) { $("log").textContent = "Check the declaration."; return; }
    if (!validEmail($("email").value)) { $("log").textContent = "Need email."; return; }
    if (!($("muni").value || "").trim()) { $("log").textContent = "Need municipality."; return; }
    const p = packet();
    try { localStorage.setItem("dc.unity.id", JSON.stringify(p)); } catch (e) {}
    const pack = buildPack(p);
    $("log").textContent = JSON.stringify(pack, null, 2);
    download("unity-deploy-pack.json", JSON.stringify(pack, null, 2), "application/json");
    download("unity-deploy-pack.html", packHtml(pack), "text/html");
  };

  $("mail").onclick = function () {
    const p = packet();
    if (!validEmail(p.look.email)) { $("log").textContent = "Email first."; return; }
    location.href = "mailto:" + p.look.email + "?subject=" + encodeURIComponent("Unity deploy pack " + p.at.slice(0, 10)) +
      "&body=" + encodeURIComponent("Seed sealed locally. Open unity-deploy-pack.html. Dualis did not SMTP this.");
  };

  $("dl").onclick = function () {
    const p = packet();
    const pack = buildPack(p);
    download("unity-deploy-pack.json", JSON.stringify(pack, null, 2), "application/json");
    download("unity-deploy-pack.html", packHtml(pack), "text/html");
  };
})();
