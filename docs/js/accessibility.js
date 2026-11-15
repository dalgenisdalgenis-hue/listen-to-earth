'use strict';

(() => {
  const app = window.ListenToEarth;

  // Los atajos globales no deben atravesar un diálogo modal. El navegador
  // conserva así su comportamiento nativo de Escape para cerrar <dialog>.
  app.shouldIgnoreGlobalShortcut = event =>
    Boolean(event.target?.closest?.('dialog[open]'));

  app.setupAudioKeyboardHelp = function ({
    dialog, openButton, closeButton, title, experienceNode, experienceName
  }) {
    if (!dialog || !openButton || !closeButton || !title || !experienceNode) return null;

    function open() {
      experienceNode.textContent = app.format('helpExperience', { experience: experienceName });
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      title.focus();
    }

    function close() {
      if (typeof dialog.close === 'function') dialog.close();
      else {
        dialog.removeAttribute('open');
        openButton.focus();
      }
    }

    openButton.addEventListener('click', open);
    closeButton.addEventListener('click', close);
    dialog.addEventListener('close', () => openButton.focus());
    return { open, close };
  };

  // Recibe solo estado ya calculado por app.js. No lee píxeles, no vuelve a
  // descomponer colores y no altera selección, audio ni recorrido.
  app.buildAccessibilityStatus = function (state) {
    const image = app.text[state.image === 'ready' ? 'helpImageReady' :
      state.image === 'loading' ? 'helpImageLoading' : 'helpImageNotReady'];
    const playback = app.text[{
      off: 'helpAudioOffStatus', muted: 'helpAudioMutedStatus',
      playing: 'helpAudioPlayingStatus', paused: 'helpAudioPausedStatus',
      ended: 'helpAudioEndedStatus', stopped: 'helpAudioStoppedStatus',
      active: 'helpAudioActiveStatus'
    }[state.playback] || 'helpAudioOffStatus'];
    return [
      state.experience,
      image,
      state.position || app.text.helpNoPosition,
      app.format('helpSelection', { types: state.selection || app.text.none }),
      playback,
      state.sample || app.text.helpNoSample
    ].filter(Boolean).join(' ');
  };
})();
