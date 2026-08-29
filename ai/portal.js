/** Adaptive Intelligence portal — talks through the house kernel. */
(function () {
  var statusEl = document.getElementById('session-status');
  var log = document.getElementById('chat-log');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');
  if (!form || !input || !log) return;

  function detectAccess() {
    if (!statusEl) return 'open';
    var hasCf = document.cookie.split(';').some(function (c) {
      return c.trim().indexOf('CF_Authorization=') === 0;
    });
    if (hasCf) {
      statusEl.className = 'status ok';
      statusEl.textContent = 'Kernel live. Edge cookie present.';
      return 'gated';
    }
    statusEl.className = 'status warn';
    statusEl.textContent = 'Kernel live. Public look. Depth still spends Fuel.';
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

  function fallback(q) {
    var s = (q || '').toLowerCase();
    if (s.indexOf('measure') !== -1) return 'One Ontario sheet is live. Time-of-use leftover. I speak from the kernel.';
    if (s.indexOf('fuel') !== -1) return 'Fuel is prepaid time. Crypto. Not a coin.';
    return "I don't know that leftover. I won't invent it.";
  }

  function speak(q) {
    if (window.DCLMLook && typeof window.DCLMLook.run === 'function') {
      return window.DCLMLook.run(q, { voice: 'you', case_id: 'portal' }).then(function (recu) {
        return recu && recu.spoken ? recu.spoken : fallback(q);
      });
    }
    return Promise.resolve(fallback(q));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = (input.value || '').trim();
    if (!q) return;
    addMsg('you', q);
    input.value = '';
    speak(q).then(function (text) { addMsg('iris', text); });
  });

  var a = document.getElementById('btn-suggest-access');
  var r = document.getElementById('btn-suggest-research');
  if (a) a.onclick = function () { input.value = 'What is Fuel?'; form.requestSubmit(); };
  if (r) r.onclick = function () { input.value = 'Ontario measure sheet'; form.requestSubmit(); };

  detectAccess();
  addMsg('iris', "I'm Iris. House kernel. Ask.");
})();
