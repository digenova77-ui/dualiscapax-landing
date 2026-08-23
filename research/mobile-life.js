(function () {
  'use strict';
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function haptic(kind) {
    try {
      if (!navigator.vibrate) return;
      if (kind === 'light') navigator.vibrate(8);
      else if (kind === 'select') navigator.vibrate([6, 20, 10]);
      else if (kind === 'quark') navigator.vibrate([4, 12, 4]);
      else navigator.vibrate(12);
    } catch (e) {}
  }
  function quarkAt(x, y) {
    if (REDUCE) return;
    var el = document.createElement('div');
    el.className = 'quark-flash';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 600);
  }
  function quarkFromEvent(e) {
    var x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    var y = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    quarkAt(x, y);
    haptic('quark');
  }
  function initSpiritField() {
    if (REDUCE) return;
    var field = document.createElement('div');
    field.className = 'spirit-field';
    field.setAttribute('aria-hidden', 'true');
    var canvas = document.createElement('canvas');
    field.appendChild(canvas);
    document.body.appendChild(field);
    var ctx = canvas.getContext('2d');
    var w, h, dpr, dots = [];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.floor((w * h) / 28000);
      dots = [];
      for (var i = 0; i < n; i++) {
        dots.push({ x: Math.random() * w, y: Math.random() * h, r: 0.4 + Math.random() * 1.2, p: Math.random() * Math.PI * 2, s: 0.3 + Math.random() * 0.7 });
      }
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var tw = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 0.0015 * d.s + d.p));
        d.x += Math.sin(t * 0.0002 + d.p) * 0.08;
        d.y += Math.cos(t * 0.00015 + d.p) * 0.06;
        if (d.x < 0) d.x = w; if (d.x > w) d.x = 0;
        if (d.y < 0) d.y = h; if (d.y > h) d.y = 0;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,' + (0.08 + 0.22 * tw) + ')';
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(frame);
  }
  function initReveal() {
    var nodes = document.querySelectorAll('.card, .pillar, .idx, .mol-card, .fact, .hud-gauge');
    nodes.forEach(function (n) { n.classList.add('life-reveal', 'life-press'); });
    if (!('IntersectionObserver' in window) || REDUCE) {
      nodes.forEach(function (n) { n.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    nodes.forEach(function (n) { io.observe(n); });
  }
  function pathMap() {
    var path = location.pathname;
    if (path.indexOf('/dualiscapax-landing') === 0) {
      return {
        home: '/dualiscapax-landing/',
        seal: '/dualiscapax-landing/research/seal-index.html',
        als: '/dualiscapax-landing/research/healthcare/medical/neurological/als-simulation-report.html'
      };
    }
    if (path.indexOf('/neurological') >= 0) {
      return { home: '../../../../index.html', seal: '../../../seal-index.html', als: 'als-simulation-report.html' };
    }
    if (path.indexOf('/research') >= 0) {
      return { home: '../index.html', seal: 'seal-index.html', als: 'healthcare/medical/neurological/als-simulation-report.html' };
    }
    return { home: 'index.html', seal: 'research/seal-index.html', als: 'research/healthcare/medical/neurological/als-simulation-report.html' };
  }
  function initChrome() {
    if (document.querySelector('.life-dock')) return;
    document.body.classList.add('has-life-dock');
    var chip = document.createElement('div');
    chip.className = 'life-chip';
    chip.innerHTML = '<span class="dot"></span><span>SEAL · LIVE</span>';
    document.body.appendChild(chip);
    var dock = document.createElement('div');
    dock.className = 'life-dock';
    dock.innerHTML =
      '<a class="primary" data-nav="home" href="#">Home</a>' +
      '<a data-nav="seal" href="#">SEAL</a>' +
      '<a data-nav="als" href="#">ALS</a>' +
      '<button type="button" id="life-haptic-ping">Quark</button>';
    document.body.appendChild(dock);
    var map = pathMap();
    dock.querySelectorAll('[data-nav]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        quarkFromEvent(e);
        haptic('select');
        var k = a.getAttribute('data-nav');
        setTimeout(function () { location.href = map[k]; }, 140);
      });
    });
    var ping = document.getElementById('life-haptic-ping');
    if (ping) ping.addEventListener('click', function (e) { quarkFromEvent(e); haptic('quark'); });
  }
  function initPress() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('a, button, .card, .life-press, [role="tab"]');
      if (!t || t.id === 'life-haptic-ping') return;
      quarkFromEvent(e);
      haptic('light');
    }, { passive: true });
  }
  function init() {
    initChrome();
    initSpiritField();
    initReveal();
    initPress();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.DualisLife = { haptic: haptic, quarkAt: quarkAt };
})();
