/**
 * DualisCapax long-page text scale control
 * Scales content inside fixed min/max so layout stays on screen.
 * Does not use browser zoom.
 */
(function () {
  var ROOT_KEY = 'dc-text-scale';
  var root = document.documentElement;
  var min = 0.9;
  var max = 1.35;
  var step = 0.08;

  function clamp(n) {
    return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
  }

  function read() {
    var stored = null;
    try {
      stored = localStorage.getItem(ROOT_KEY);
    } catch (e) {}
    var n = stored != null ? parseFloat(stored) : 1;
    if (!isFinite(n)) n = 1;
    return clamp(n);
  }

  function write(n) {
    n = clamp(n);
    root.style.setProperty('--dc-text-scale', String(n));
    try {
      localStorage.setItem(ROOT_KEY, String(n));
    } catch (e) {}
    updateUI(n);
    return n;
  }

  function label(n) {
    return Math.round(n * 100) + '%';
  }

  var btnMinus;
  var btnPlus;
  var lab;

  function updateUI(n) {
    if (lab) lab.textContent = label(n);
    if (btnMinus) btnMinus.disabled = n <= min + 0.001;
    if (btnPlus) btnPlus.disabled = n >= max - 0.001;
  }

  function build() {
    if (document.querySelector('.dc-text-ctrl')) return;

    var wrap = document.createElement('div');
    wrap.className = 'dc-text-ctrl';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Text size');

    btnMinus = document.createElement('button');
    btnMinus.type = 'button';
    btnMinus.setAttribute('aria-label', 'Decrease text size');
    btnMinus.textContent = 'A−';

    var sep1 = document.createElement('span');
    sep1.className = 'dc-text-sep';
    sep1.setAttribute('aria-hidden', 'true');

    lab = document.createElement('span');
    lab.className = 'dc-text-label';
    lab.setAttribute('aria-live', 'polite');

    var sep2 = document.createElement('span');
    sep2.className = 'dc-text-sep';
    sep2.setAttribute('aria-hidden', 'true');

    btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.setAttribute('aria-label', 'Increase text size');
    btnPlus.textContent = 'A+';

    btnMinus.addEventListener('click', function () {
      write(read() - step);
    });
    btnPlus.addEventListener('click', function () {
      write(read() + step);
    });

    wrap.appendChild(btnMinus);
    wrap.appendChild(sep1);
    wrap.appendChild(lab);
    wrap.appendChild(sep2);
    wrap.appendChild(btnPlus);
    document.body.appendChild(wrap);

    write(read());
  }

  function markRoot() {
    if (!document.body.classList.contains('dc-scale-root')) {
      document.body.classList.add('dc-scale-root');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      markRoot();
      build();
    });
  } else {
    markRoot();
    build();
  }
})();
