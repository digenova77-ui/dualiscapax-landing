(function () {
  'use strict';
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) {} }
  function quarkSpirit(el) {
    if (!el || REDUCE) return;
    el.classList.remove('quark-hit');
    void el.offsetWidth;
    el.classList.add('quark-hit');
    haptic(10);
  }
  function bindQuark(root) {
    (root || document).querySelectorAll('a, button, .card, .cta, .pillar').forEach(function (el) {
      if (el.dataset.quarkBound) return;
      el.dataset.quarkBound = '1';
      el.addEventListener('pointerdown', function () { quarkSpirit(el); }, { passive: true });
    });
  }
  function quarkField() {
    if (REDUCE || document.querySelector('.quark-field')) return;
    var c = document.createElement('canvas');
    c.className = 'quark-field';
    c.setAttribute('aria-hidden', 'true');
    document.body.prepend(c);
    var ctx = c.getContext('2d'), w, h, dpr, dots = [];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      c.style.width = w + 'px'; c.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(48, Math.floor((w * h) / 28000));
      dots = [];
      for (var i = 0; i < n; i++) {
        dots.push({ x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.4, p: Math.random() * Math.PI * 2, s: 0.2 + Math.random() * 0.6 });
      }
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var a = 0.12 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.0015 * d.s + d.p));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
        ctx.arc(d.x + Math.sin(t * 0.0003 + d.p) * 8, d.y + Math.cos(t * 0.00025 + d.p) * 6, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(frame);
  }
  function chrome() {
    if (document.querySelector('.mobile-chrome')) return;
    var bar = document.createElement('div');
    bar.className = 'mobile-chrome';
    bar.innerHTML = '<span style="display:flex;align-items:center;gap:.5rem"><span class="pulse" aria-hidden="true"></span> DualisCapax · live</span><span id="life-clock" style="color:rgba(255,255,255,.75)">--:--:--Z</span>';
    document.body.prepend(bar);
    function tick() {
      var n = document.getElementById('life-clock');
      if (n) n.textContent = new Date().toISOString().slice(11, 19) + 'Z';
    }
    tick(); setInterval(tick, 1000);
  }
  function domainChips() {
    var domains = document.getElementById('domains');
    if (!domains) return;
    var headings = domains.querySelectorAll('h2');
    if (!headings.length) return;
    var row = document.createElement('div');
    row.className = 'domain-chips';
    row.setAttribute('role', 'tablist');
    headings.forEach(function (h, i) {
      var id = 'dom-' + i;
      h.id = id;
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = (h.textContent || '').split('·')[0].trim() || ('D' + i);
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () {
        row.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
        b.setAttribute('aria-selected', 'true');
        quarkSpirit(b);
        h.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
      });
      row.appendChild(b);
    });
    var stats = document.getElementById('stats');
    if (stats && stats.parentNode) stats.parentNode.insertBefore(row, stats.nextSibling);
  }
  function ticker() {
    if (document.querySelector('.life-ticker')) return;
    var t = document.createElement('div');
    t.className = 'life-ticker';
    t.innerHTML = '<span>SEAL · equal toll · one mirror · residual open · ALS reference depth · cancer indexed · communicable indexed · one health · ocean · plant · fungi · no tribe preferred · </span>';
    var wrap = document.querySelector('.wrap');
    if (wrap) {
      var stats = document.getElementById('stats');
      if (stats) wrap.insertBefore(t, stats);
      else wrap.prepend(t);
    }
  }
  function init() {
    chrome(); quarkField(); bindQuark(document);
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (document.querySelector('#domains h2') || tries > 40) {
        clearInterval(iv); domainChips(); ticker(); bindQuark(document);
      }
    }, 100);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
