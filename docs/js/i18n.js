'use strict';

(() => {
  const app = window.ListenToEarth;
  if (!app?.text || !window.ListenToEarthEnglish) return;

  const params = new URLSearchParams(window.location.search);
  const requested = params.get('lang');
  let stored = null;
  try { stored = window.localStorage.getItem('listen-to-earth-language'); } catch {}
  const language = ['es', 'en'].includes(requested) ? requested
    : ['es', 'en'].includes(stored) ? stored : 'es';

  app.locales = { es: app.text, en: window.ListenToEarthEnglish };
  app.language = language;
  app.locale = language === 'en' ? 'en-US' : 'es-DO';
  app.text = app.locales[language];
  app.format = (key, values = {}) => (app.text[key] || key)
    .replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
  document.documentElement.lang = language;

  function translate(root = document) {
    root.querySelectorAll('[data-text]').forEach(node => {
      const value = app.text[node.dataset.text];
      if (value !== undefined) node.textContent = value;
    });
    root.querySelectorAll('[data-alt]').forEach(node => {
      const value = app.text[node.dataset.alt];
      if (value !== undefined) node.alt = value;
    });
    root.querySelectorAll('[data-label]').forEach(node => {
      const value = app.text[node.dataset.label];
      if (value !== undefined) node.setAttribute('aria-label', value);
    });
    const titleKey = document.body?.dataset.pageTitle;
    if (titleKey && app.text[titleKey]) document.title = app.text[titleKey];
    const descriptionKey = document.body?.dataset.metaDescription;
    const description = document.querySelector('meta[name="description"]');
    if (descriptionKey && description && app.text[descriptionKey]) {
      description.content = app.text[descriptionKey];
    }
  }

  function keepLanguageInLinks(root = document) {
    root.querySelectorAll('a[href]').forEach(link => {
      const raw = link.getAttribute('href');
      if (!raw || raw.startsWith('#') || raw.startsWith('mailto:')) return;
      let url;
      try { url = new URL(raw, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin || !url.pathname.endsWith('.html')) return;
      if (language === 'en') url.searchParams.set('lang', 'en');
      else url.searchParams.delete('lang');
      link.href = `${url.pathname.split('/').pop()}${url.search}${url.hash}`;
    });
  }

  function addLanguageButton() {
    const nav = document.querySelector('.site-header nav');
    if (!nav || nav.querySelector('.language-toggle')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'language-toggle';
    button.setAttribute('aria-label', app.text.languageSwitchLabel);
    button.innerHTML = `<span lang="es" class="${language === 'es' ? 'active' : ''}">ES</span><span aria-hidden="true">/</span><span lang="en" class="${language === 'en' ? 'active' : ''}">EN</span>`;
    button.addEventListener('click', () => {
      const next = language === 'es' ? 'en' : 'es';
      try { window.localStorage.setItem('listen-to-earth-language', next); } catch {}
      const url = new URL(window.location.href);
      if (next === 'en') url.searchParams.set('lang', 'en');
      else url.searchParams.delete('lang');
      window.location.href = url.toString();
    });
    nav.append(button);
  }

  translate();
  addLanguageButton();
  keepLanguageInLinks();
  app.translatePage = translate;
})();
