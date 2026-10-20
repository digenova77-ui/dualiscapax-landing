(function () {
  'use strict';

  const SUPPORTED = ['en', 'fr', 'es'];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'dc-lang';
  const EN_URL = '/i18n/en.json';
  let currentLang = DEFAULT_LANG;
  let translations = {};
  let requestId = 0;
  let pendingLang = null;

  function normaliseLang(value) {
    const lang = String(value || '').trim().toLowerCase().replace(/_/g, '-');
    if (SUPPORTED.includes(lang)) return lang;
    const base = lang.split('-')[0];
    return SUPPORTED.includes(base) ? base : DEFAULT_LANG;
  }

  function readStoredLang() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) return normaliseLang(stored);
    } catch (_) {
      // Storage may be disabled in private browsing or restricted contexts.
    }
    return normaliseLang(navigator.language || navigator.userLanguage);
  }

  function saveLang(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {
      // Language still works for this page even when persistence is unavailable.
    }
  }

  async function load(lang) {
    const response = await fetch('/i18n/' + lang + '.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const value = await response.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Translation catalog must be a JSON object');
    }
    return value;
  }

  function writeText(el, value) {
    if (el.hasAttribute('data-i18n-html')) {
      // Only use data-i18n-html for trusted repository-authored catalog values.
      el.innerHTML = value;
      return;
    }
    if (el.childElementCount === 0) {
      el.textContent = value;
      return;
    }
    // Preserve nested icons/controls: replace a direct text node only.
    const textNode = Array.from(el.childNodes).find(function (node) {
      return node.nodeType === Node.TEXT_NODE && node.nodeValue.trim();
    });
    if (textNode) textNode.nodeValue = value;
  }

  function apply(catalog) {
    translations = catalog || {};
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      const value = translations[key];
      if (value == null) return;
      writeText(el, String(value));
    });
    document.documentElement.setAttribute('lang', currentLang);
    document.querySelectorAll('#dc-lang-switch').forEach(function (select) {
      select.value = currentLang;
    });
  }

  async function setLang(value) {
    const lang = normaliseLang(value);
    if (pendingLang === lang) return;
    if (lang === currentLang && pendingLang === null && Object.keys(translations).length) {
      document.querySelectorAll('#dc-lang-switch').forEach(function (select) {
        select.value = currentLang;
      });
      return;
    }
    pendingLang = lang;
    currentLang = lang;
    saveLang(lang);
    const thisRequest = ++requestId;
    try {
      const english = lang === DEFAULT_LANG ? {} : await load(DEFAULT_LANG);
      const selected = lang === DEFAULT_LANG ? english : await load(lang);
      if (thisRequest !== requestId) return;
      pendingLang = null;
      apply(Object.assign({}, english, selected));
    } catch (error) {
      if (thisRequest !== requestId) return;
      pendingLang = null;
      console.warn('i18n load failed for ' + lang + '; using available English fallback.', error);
      try {
        const english = await load(DEFAULT_LANG);
        if (thisRequest !== requestId) return;
        apply(english);
      } catch (fallbackError) {
        console.warn('i18n English fallback unavailable.', fallbackError);
        if (thisRequest === requestId) apply({});
      }
    }
    if (typeof window.DC_i18n_onChange === 'function') {
      window.DC_i18n_onChange(currentLang, translations);
    }
  }

  window.DC_i18n = {
    setLang: setLang,
    get: function (key, fallback) {
      return translations[key] != null ? translations[key] : (fallback || key);
    },
    current: function () { return currentLang; },
    translations: function () { return translations; },
    supported: function () { return SUPPORTED.slice(); }
  };

  function bindSwitchers() {
    document.querySelectorAll('#dc-lang-switch').forEach(function (select) {
      if (select.dataset.dcI18nBound === 'true') return;
      select.dataset.dcI18nBound = 'true';
      select.addEventListener('change', function () { setLang(select.value); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindSwitchers();
    setLang(readStoredLang());
  });
})();
