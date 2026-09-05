(function () {
  const $ = (id) => document.getElementById(id);
  const state = {
    phrase_sha256: null,
    passkey: null,
    eth_sig: null,
  };

  function b64(buf) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
  }

  async function sha256hex(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  $("hashPhrase").onclick = async function () {
    const p = $("phrase").value;
    if (!p || p.length < 8) {
      $("phraseOut").textContent = "Phrase too short.";
      return;
    }
    state.phrase_sha256 = await sha256hex(p);
    $("phrase").value = "";
    $("phraseOut").textContent = "sha256 " + state.phrase_sha256.slice(0, 16) + "… raw cleared.";
  };

  $("makeKey").onclick = async function () {
    if (!window.PublicKeyCredential) {
      $("keyOut").textContent = "This browser has no WebAuthn.";
      return;
    }
    const userId = crypto.getRandomValues(new Uint8Array(16));
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "DualisCapax", id: location.hostname },
          user: { id: userId, name: $("name").value || "unity", displayName: $("name").value || "unity" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          timeout: 60000,
          authenticatorSelection: { userVerification: "preferred", residentKey: "preferred" },
        },
      });
      state.passkey = {
        id: cred.id,
        type: cred.type,
        transports: cred.response && cred.response.getTransports ? cred.response.getTransports() : [],
      };
      $("keyOut").textContent = "Passkey id " + cred.id.slice(0, 18) + "… on this device.";
    } catch (e) {
      $("keyOut").textContent = "Passkey cancelled or failed. " + (e && e.name ? e.name : "");
    }
  };

  $("signEth").onclick = async function () {
    const addr = ($("eth").value || "").trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      $("ethOut").textContent = "Need a 0x + 40 hex address you control.";
      return;
    }
    const msg = "DualisCapax Unity bind " + location.host + " " + new Date().toISOString().slice(0, 10);
    if (!window.ethereum || !window.ethereum.request) {
      $("ethOut").textContent = "Address kept. No injected wallet — paste-only bind.";
      return;
    }
    try {
      const sig = await window.ethereum.request({
        method: "personal_sign",
        params: [msg, addr],
      });
      state.eth_sig = { addr: addr.toLowerCase(), msg: msg, sig: sig };
      $("ethOut").textContent = "Signed. " + sig.slice(0, 18) + "…";
    } catch (e) {
      $("ethOut").textContent = "Wallet refused. Address still on the packet if you seal.";
    }
  };

  function packet() {
    const eth = ($("eth").value || "").trim().toLowerCase();
    const firm = ($("firm").value || "").trim();
    return {
      schema: "unity.id.v1",
      at: new Date().toISOString(),
      host: location.host,
      look: {
        name: $("name").value || "",
        kind: $("kind").value,
        municipality: $("muni").value || "",
      },
      passphrase_sha256: state.phrase_sha256,
      passkey: state.passkey,
      eth: {
        address: /^0x[0-9a-fA-F]{40}$/.test(eth) ? eth : null,
        signature: state.eth_sig,
        contract: "not_deployed_from_this_page",
      },
      llp: {
        name: firm || null,
        role: firm ? $("firmRole").value : null,
        status: firm ? "declared" : "NEED_FIRM",
      },
      grant: { class0_look: true, fuel: 0, seat: null },
      law: ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"],
      not: ["coin", "share", "diagnosis", "P.Eng stamp"],
    };
  }

  $("seal").onclick = function () {
    const p = packet();
    try {
      localStorage.setItem("dc.unity.id", JSON.stringify(p));
    } catch (e) {}
    $("log").textContent = JSON.stringify(p, null, 2);
  };

  $("dl").onclick = function () {
    const p = packet();
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "unity-id-runtime-seed.json";
    a.click();
  };
})();
