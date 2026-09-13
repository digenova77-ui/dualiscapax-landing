(function () {
  'use strict';
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var field, flash;
  function haptic(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }
  var H = { tap: [8], soft: [5, 20, 5], quark: [4, 12, 8], confirm: [10, 30, 12], warn: [20, 40, 20] };
  function ensureField() {
    if (field) return field;
    field = document.createElement('div');
    field.className = 'quark-field';
    field.setAttribute('aria-hidden', 'true');
    document.body.appendChild(field);
    flash = document.createElement('div');
    flash.className = 'collapse-flash';
    flash.setAttribute('aria-hidden', 'true');
    document.body.appendChild(flash);
    return field;
  }
  function spawnQuark(x, y) {
    if (REDUCE) return;
    ensureField();
    var n = document.createElement('span');
    n.className = 'quark-spirit';
    n.style.left = (x - 2) + 'px';
    n.style.top = (y - 2) + 'px';
    field.appendChild(n);
    void n.offsetWidth;
    n.classList.add('go');
    setTimeout(function () { n.remove(); }, 750);
  }
  function collapsePulse(x, y) {
    if (REDUCE) return;
    ensureField();
    if (typeof x === 'number') {
      flash.style.left = x + 'px';
      flash.style.top = y + 'px';
    }
    flash.classList.remove('go');
    void flash.offsetWidth;
    flash.classList.add('go');
    haptic(H.quark);
  }
  function injectChrome() {
    if (document.querySelector('.mob-chrome')) return;
    var base = '/dualiscapax-landing/';
    var bar = document.createElement('div');
    bar.className = 'mob-chrome';
    bar.innerHTML =
      '<a class="brand" href="' + base + '" data-life="tap">' +
      '<img src="' + base + 'emblem-ring.svg" width="18" height="18" alt="">' +
      '<span>DualisCapax</span></a>' +
      '<div class="mob-actions">' +
      '<button type="button" id="lifeHapticTest" data-life="confirm">Pulse</button>' +
      '<a href="' + base + 'research/seal-index.html" data-life="tap">SEAL</a>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);
    var dock = document.createElement('nav');
    dock.className = 'mob-dock';
    dock.setAttribute('aria-label', 'Mobile dock');
    dock.innerHTML =
      '<a href="' + base + '" data-life="tap">Home</a>' +
      '<a href="' + base + 'research/" data-life="tap">Research</a>' +
      '<a href="' + base + 'research/seal-index.html" data-life="tap">SEAL</a>' +
      '<a href="' + base + 'research/healthcare/medical/neurological/als-simulation-report.html" data-life="tap">ALS</a>' +
      '<a href="' + base + 'manifesto.html" data-life="tap">Law</a>';
    document.body.appendChild(dock);
    document.body.classList.add('has-mob-dock');
  }
  function bind() {
    document.addEventListener('pointerdown', function (e) {
      var t = e.target.closest('[data-life], a, button, .life-card, .tabs button, .cta, .pillar, .card');
      if (!t) return;
      var kind = t.getAttribute('data-life') || 'tap';
      if (kind === 'confirm') haptic(H.confirm);
      else if (kind === 'warn') haptic(H.warn);
      else haptic(H.tap);
      spawnQuark(e.clientX, e.clientY);
    }, { passive: true });
    var pulseBtn = document.getElementById('lifeHapticTest');
    if (pulseBtn) {
      pulseBtn.addEventListener('click', function (e) {
        collapsePulse(e.clientX, e.clientY);
        haptic(H.confirm);
      });
    }
    if (window.matchMedia('(max-width: 720px)').matches && !REDUCE) {
      document.querySelectorAll('.center, .pillar, .card, .life-card, .head, .mol-card').forEach(function (n, i) {
        n.classList.add('life-rise');
        n.style.animationDelay = (Math.min(i, 12) * 0.05) + 's';
      });
    }
  }
  function init() {
    ensureField();
    injectChrome();
    bind();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.DualisLife = { haptic: haptic, quark: spawnQuark, collapse: collapsePulse, patterns: H };
})();
