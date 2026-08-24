/**
 * Adaptive Intelligence portal — residual dialogue + session posture
 */
(function () {
  var statusEl = document.getElementById('session-status');
  var log = document.getElementById('chat-log');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');

  function detectAccess() {
    var hasCf = document.cookie.split(';').some(function (c) {
      return c.trim().indexOf('CF_Authorization=') === 0;
    });
    if (hasCf) {
      statusEl.className = 'status ok';
      statusEl.textContent = 'Session: hybrid Access cookie detected. Edge gate is active for this host.';
      return 'gated';
    }
    statusEl.className = 'status warn';
    statusEl.textContent = 'Session: open hybrid (no CF Access cookie). Public research stays open; production model depth is not attached on this static surface.';
    return 'open';
  }

  function addMsg(who, text) {
    var d = document.createElement('div');
    d.className = 'msg ' + (who === 'you' ? 'user' : 'bot');
    d.innerHTML = '<div class="who">' + who + '</div><div></div>';
    d.lastChild.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  var KNOWLEDGE = [
    { keys: ['hybrid', 'access'], a: 'Hybrid access is one product name for all entry. Research and light paths stay open; Adaptive depth and commercial IP settlement can use different rails (including crypto on large IP deals). The label stays hybrid.' },
    { keys: ['research', 'journal', 'open'], a: 'The research hub is a static open plane: healthcare, engineering, energy, fields, philosophy. It does not require Fuel. AI depth is a separate surface.' },
    { keys: ['gate', 'cloudflare', 'login', 'session'], a: 'Production gating is Cloudflare Access on /ai (or ai host). This static portal detects a CF_Authorization cookie when the edge gate is live. Service tokens are for automation only, not browsers.' },
    { keys: ['narrative', 'storyboard', 'video', 'tour'], a: 'The eight-beat narrative is: Open, Prove, Depth, Seal, Fusion Meter, Dual capacity, Singularity clock, Unity. Video plays from assets/tour when present; otherwise residual canvas.' },
    { keys: ['fuel', 'meter', 'fusion', 'capacity'], a: 'Fusion Meter is closed prepaid capacity for plane cost — not an open-market coin in the public narrative. Individuals keep open research; enterprise can fund plane capacity.' },
    { keys: ['seal', 'ip', 'method'], a: 'IP and production method stay sealed. Medical and research surfaces stay complete and open where published. Hybrid access does not mean everything is free depth.' },
    { keys: ['help', 'hello', 'hi'], a: 'You are on the Adaptive Intelligence portal. Ask about hybrid access, research vs depth, narrative beats, or gating. Full production model streams attach behind Access when wired.' }
  ];

  function reply(q) {
    var s = (q || '').toLowerCase();
    for (var i = 0; i < KNOWLEDGE.length; i++) {
      var k = KNOWLEDGE[i].keys;
      for (var j = 0; j < k.length; j++) {
        if (s.indexOf(k[j]) !== -1) return KNOWLEDGE[i].a;
      }
    }
    return 'Residual reply: I can ground hybrid access, open research, narrative beats, Fusion Meter framing, and Cloudflare Access posture. Production model inference is not on this static host yet — use research pages for published material.';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = (input.value || '').trim();
    if (!q) return;
    addMsg('you', q);
    input.value = '';
    setTimeout(function () { addMsg('adaptive', reply(q)); }, 120);
  });

  document.getElementById('btn-suggest-access').onclick = function () {
    input.value = 'What is hybrid access?';
    form.requestSubmit();
  };
  document.getElementById('btn-suggest-research').onclick = function () {
    input.value = 'Research vs AI depth';
    form.requestSubmit();
  };

  detectAccess();
  addMsg('adaptive', 'Adaptive Intelligence portal online. Hybrid access mode. Ask a question or step the narrative.');

  if (window.DualisVideoEngine) {
    var eng = new DualisVideoEngine({
      root: '#tour-root',
      mediaBase: '../assets/tour/',
      autoplay: true
    }).start();
    var prev = document.querySelector('[data-tour=prev]');
    var next = document.querySelector('[data-tour=next]');
    if (prev) prev.onclick = function () { eng.prev(); };
    if (next) next.onclick = function () { eng.next(); };
  }
})();
