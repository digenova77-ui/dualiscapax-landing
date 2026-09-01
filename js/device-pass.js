/** Device-only passphrase. Never sent to Dualis. Knowledge class K. */
(function (g) {
  var STORE = 'dc_vault_v1';
  var WORDS = (
    'able acid aged aim air ale all amber amp ant ape arc ark arm art ash ask ' +
    'atom auk awe axe bad bag bald barn bead beam bean bear beat bed bee bell ' +
    'belt bend berg best bike bind bird bite blue boat bolt bone book boot born ' +
    'bowl brag brew brick brim brook brush buck bulb bulk burn bush cafe cake ' +
    'calf camp cane cap card cart cave cell chat chin chip city clam clap claw ' +
    'clay clip cloud clover club coal coat cob coil coin cold colt comb cone ' +
    'cook cord cork corn cot cove crab crag crew crib crow cube cuff curb ' +
    'curl cusp dart dawn deal deck deer desk dew dice dim dock doe doll dome ' +
    'door dove draw drum dual duck dune dusk dust earl east echo edge eel egg ' +
    'elm emu end eon epic etch eve face fact fade fall fan far farm fern field ' +
    'fig film fin firm fish flag flame flask flax flint flock foam fog foil ' +
    'fold font ford fork form fort fox frame frost fry fume fuse gale game ' +
    'gate gear gem gift gill glow gnu goal gold golf gong good gore gown grab ' +
    'grain grape grid grin grip grit grove gull gust hail hair halo hand harp ' +
    'hat hawk hay haze helm herb hide hill hive hold holly home hood hook horn ' +
    'host howl huge hull ice idle inch ink iris iron isle ivy jade jazz jest ' +
    'jolt jute kale keel kelp key kiln kind king kite kiwi knob lace lake lamp ' +
    'lark lava leaf leap left lens lichen lime line lion list loaf lock loft ' +
    'log loom loop lord lark lot luck lure lute lynx maid maple mask mast maze ' +
    'mead mesh mint mist moat monk moon moss moth mule musk nave nest net ' +
    'noon oak oar oat odd oil olive opal orb orca oven owl ox pact page palm ' +
    'pane park path peat peck peel perch pike pine pint pipe pith plank plum ' +
    'pond port puff pulp quay quilt raft rain reed reef rest rice ridge rim ' +
    'ring rite road roar rock roof room root rose row ruby ruin rush rust rye ' +
    'sage sail salt sand seal seed silk silt sky snow soap soil spark star ' +
    'stem step stone storm sun surf swan tide tile toad torch trail tree trout ' +
    'true tube tuna turf urn vale vane vase veil vein vest vine volt vote ' +
    'wade wake wall warp wasp wave well wheat wheel whip wick willow wind ' +
    'wing wolf wood wool yarn year yolk zeal zinc zone'
  ).split(/\s+/).filter(Boolean);

  function bytesToB64(buf) {
    var u = new Uint8Array(buf);
    var s = '';
    for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
    return btoa(s);
  }
  function b64ToBytes(b64) {
    var s = atob(b64);
    var u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }
  function randWords(n) {
    var out = [];
    var buf = new Uint32Array(n);
    crypto.getRandomValues(buf);
    for (var i = 0; i < n; i++) out.push(WORDS[buf[i] % WORDS.length]);
    return out.join(' ');
  }
  function normalize(p) {
    return String(p || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim().replace(/\s+/g, ' ');
  }
  async function derive(pass, salt) {
    var enc = new TextEncoder();
    var keyMat = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 120000, hash: 'SHA-256' },
      keyMat,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  g.DCVault = {
    readMeta: function () {
      try {
        var raw = localStorage.getItem(STORE);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    hasVault: function () {
      var m = this.readMeta();
      return !!(m && m.ct && m.salt && m.iv);
    },
    generate: function () {
      return randWords(8);
    },
    create: async function (pass, role) {
      var phrase = normalize(pass);
      if (phrase.split(' ').length < 8) throw new Error('Need eight words.');
      var salt = crypto.getRandomValues(new Uint8Array(16));
      var iv = crypto.getRandomValues(new Uint8Array(12));
      var key = await derive(phrase, salt);
      var id = (crypto.randomUUID && crypto.randomUUID()) || ('dc-' + Date.now().toString(16));
      var payload = JSON.stringify({
        id: id,
        role: role || 'visitor',
        at: new Date().toISOString(),
        v: 1
      });
      var ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(payload));
      var rec = {
        salt: bytesToB64(salt),
        iv: bytesToB64(iv),
        ct: bytesToB64(ct),
        role: role || 'visitor',
        at: new Date().toISOString(),
        v: 1
      };
      localStorage.setItem(STORE, JSON.stringify(rec));
      if (g.DCSession && DCSession.stamp) DCSession.stamp();
      return { id: id, role: rec.role, at: rec.at };
    },
    unlock: async function (pass) {
      var rec = this.readMeta();
      if (!rec) throw new Error('No vault on this device.');
      var key = await derive(normalize(pass), b64ToBytes(rec.salt));
      var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(rec.iv) }, key, b64ToBytes(rec.ct));
      var s = JSON.parse(new TextDecoder().decode(pt));
      sessionStorage.setItem('dc.portal.open', JSON.stringify({ id: s.id, role: s.role, at: new Date().toISOString() }));
      if (g.DCSession && DCSession.stamp) DCSession.stamp();
      return s;
    },
    session: function () {
      try {
        var raw = sessionStorage.getItem('dc.portal.open');
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    lock: function () {
      sessionStorage.removeItem('dc.portal.open');
    },
    clearDevice: function () {
      localStorage.removeItem(STORE);
      sessionStorage.removeItem('dc.portal.open');
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
