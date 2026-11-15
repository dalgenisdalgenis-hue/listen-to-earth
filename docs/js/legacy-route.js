'use strict';

(() => {
  const mode = new URLSearchParams(window.location.search).get('modo');
  const destinations = {
    viaje: 'viaje-del-polvo.html',
    planeta: 'planeta-completo.html',
    explorar: 'exploracion-manual.html'
  };
  window.location.replace(destinations[mode] || 'experiencias.html');
})();
