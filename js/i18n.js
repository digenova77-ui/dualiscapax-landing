(function () {
  'use strict';
  const SUPPORTED = ['en', 'fr', 'es'];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'dc-lang';

  function detectLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const nav = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : DEFAULT_LANG;
  }

  let currentLang = detectLang();
  let translations = {};

  async function load(lang) {
    try {
      const res = await fetch(`/i18n/${lang}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      console.warn('i18n load failed for', lang, e);
      return {};
    }
  }

  function apply(t) {
    translations = t || {};
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      const val = translations[key];
      if (val == null) return;
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });
    document.documentElement.setAttribute('lang', currentLang);
    const sel = document.getElementById('dc-lang-switch');
    if (sel) sel.value = currentLang;
  }

  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    const t = await load(lang);
    apply(t);
    if (typeof window.DC_i18n_onChange === 'function') {
      window.DC_i18n_onChange(lang, t);
    }
  }

  window.DC_i18n = {
    setLang: setLang,
    get: function (key, fallback) { return translations[key] != null ? translations[key] : (fallback || key); },
    current: function () { return currentLang; },
    translations: function () { return translations; }
  };

  document.addEventListener('DOMContentLoaded', async function () {
    const t = await load(currentLang);
    apply(t);
  });
})();
