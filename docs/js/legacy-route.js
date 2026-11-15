'use strict';

(() => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('modo');
  const language = params.get('lang') === 'en' ? '?lang=en' : '';
  const destinations = {
    viaje: 'viaje-del-polvo.html',
    planeta: 'planeta-completo.html',
    explorar: 'exploracion-manual.html'
  };
  window.location.replace((destinations[mode] || 'experiencias.html') + language);
})();
