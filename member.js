(function () {
  var $ = function (id) { return document.getElementById(id); };
  var state = { phrase_sha256: null, passkey: null };
  var ALIAS = [
    "admin@dualiscapax.ai",
    "ceo@dualiscapax.ai",
    "digenova77@gmail.com",
    "daviddigenova@gmail.com",
    "zarkmuckerbarn@gmail.com"
  ];

  async function sha256hex(text) {
    var hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(hash)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  $("hashPhrase").onclick = async function () {
    var p = $("phrase").value;
    if (!p || p.length < 8) { $("phraseOut").textContent = "Eight characters if you use a phrase."; return; }
    state.phrase_sha256 = await sha256hex(p);
    $("phrase").value = "";
    $("phraseOut").textContent = "Fingerprint saved. Phrase cleared.";
  };

  $("makeKey").onclick = async function () {
    if (!window.PublicKeyCredential) { $("keyOut").textContent = "No passkeys on this browser."; return; }
    try {
      var cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "DualisCapax", id: location.hostname },
          user: { id: crypto.getRandomValues(new Uint8Array(16)), name: $("email").value || "u1", displayName: $("name").value || "U1" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          timeout: 60000,
          authenticatorSelection: { userVerification: "preferred", residentKey: "preferred" },
        },
      });
      state.passkey = { id: cred.id, type: cred.type };
      $("keyOut").textContent = "Passkey on this device.";
    } catch (e) { $("keyOut").textContent = (e && e.name) || "cancelled"; }
  };

  $("seal").onclick = async function () {
    if (!$("attest").checked) { $("log").textContent = "Check the box."; return; }
    var name = ($("name").value || "").trim();
    var muni = ($("muni").value || "").trim();
    var email = ($("email").value || "").trim().toLowerCase();
    if (name.toLowerCase().indexOf("david") === -1 || name.toLowerCase().indexOf("genova") === -1) {
      $("log").textContent = "Number one is reserved for David John Di Genova."; return;
    }
    if (!muni) { $("log").textContent = "Need a town."; return; }

    var unity = window.UnityID ? UnityID.mintU1() : { human: "U1", public: "DC1-H1-0001", serial: 1 };
    var look = {
      name: name,
      kind: "person",
      municipality: muni,
      email: email,
      emails: ALIAS.slice(),
      region: "Ontario",
      country: "CA"
    };
    var iris = "iris:id:pub_" + (await sha256hex(JSON.stringify({ look: look, human: "U1" }))).slice(0, 20);
    var packet = {
      schema: "unity.id.v1",
      role: "unity_member",
      at: new Date().toISOString(),
      host: location.host,
      look: look,
      unity: unity,
      iris_public: iris,
      l5: "unpublished",
      passphrase_sha256: state.phrase_sha256,
      passkey: state.passkey,
      kyc: { performed_by_dualis: false, status: "SELF_DECLARED" },
      founder_reserved: { human: "U0", unity_verification: "NOT_PASSED" },
      grant: null,
      seat_90_day: false,
      fuel: 0,
      law: ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"]
    };
    try { localStorage.setItem("dc.unity.id", JSON.stringify(packet)); } catch (e) {}
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" }));
    a.download = "unity-U1.json";
    a.click();
    $("done").hidden = false;
    $("human").textContent = unity.human;
    $("pub").textContent = unity.public + (unity.check ? " · " + unity.check : "");
    $("iris").textContent = iris;
    $("log").textContent = "U1 bound to " + email + ". Aliases stored. File: unity-U1.json.";
  };
})();
