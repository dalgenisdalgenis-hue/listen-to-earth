'use strict';

(() => {
  const app = window.ListenToEarth;

  app.createScanProfile = function (image, mode) {
    const region = app.config.scan.modes[mode];
    if (!region) throw new Error('sampleError');
    return Array.from({ length: app.config.scan.steps }, (_, index) => {
      // Incluye ambos extremos: el último paso tropical llega a 69,9°O.
      const lon = index === app.config.scan.steps - 1 ? region.west :
        region.east + (region.west - region.east) * index / (app.config.scan.steps - 1);
      const { rgb, bounds } = app.readScanStep(image, lon, region.south, region.north);
      const result = app.decompose(rgb);
      return { index, mode, lon, rgb, bounds, result };
    });
  };

  app.createScanner = function (initialProfile, hooks) {
    const clock = hooks.clock || {
      now: () => performance.now(),
      setTimeout: (callback, delay) => window.setTimeout(callback, delay),
      clearTimeout: id => window.clearTimeout(id)
    };
    let profile = initialProfile;
    let state = 'idle', index = -1, nextIndex = 0, tempo = 100;
    let timer = null, deadline = 0, remaining = app.config.scan.stepMs, request = 0;
    const interval = () => app.config.scan.stepMs * 100 / tempo;
    const snapshot = () => ({ state, index, nextIndex, tempo,
      steps: profile.length, mode: profile[0].mode, intervalMs: interval() });
    function notify(nextState) {
      state = nextState;
      hooks.onState(snapshot());
    }
    function clearTimer() {
      if (timer !== null) clock.clearTimeout(timer);
      timer = null;
    }
    function schedule(delay) {
      remaining = delay;
      deadline = clock.now() + delay;
      timer = clock.setTimeout(tick, delay);
    }
    function tick() {
      timer = null;
      if (state !== 'playing') return;
      if (nextIndex === profile.length) { notify('ended'); return; }
      try {
        hooks.onStep(profile[nextIndex]);
        index = nextIndex++;
      } catch (error) {
        remaining = 0;
        hooks.onSilence();
        notify('paused');
        hooks.onError(error);
        return;
      }
      // Un paso por callback y una espera completa después: si el navegador
      // se retrasa, no soltamos varias notas juntas para "recuperar" el tiempo.
      // El final llega después de mantener también el último paso: 30 × 500 ms.
      schedule(interval());
    }
    async function play(restart = false) {
      if ((state === 'playing' || state === 'starting') && !restart) return;
      const resume = state === 'paused' && !restart;
      const token = ++request;
      clearTimer();
      if (restart || state === 'ended') {
        index = -1; nextIndex = 0; remaining = interval();
        hooks.onSilence();
      }
      notify('starting');
      try { await hooks.startAudio(); }
      catch (error) {
        if (token !== request) return;
        notify(resume ? 'paused' : 'idle');
        hooks.onError(error);
        return;
      }
      // Detener, cambiar modo o pausar durante Tone.start() invalida la
      // petición; su promesa no puede arrancar el barrido más tarde.
      if (token !== request) return;
      notify('playing');
      if (resume && nextIndex > 0) schedule(remaining);
      else tick();
    }
    function pause() {
      if (state !== 'playing' && state !== 'starting') return false;
      ++request;
      if (state === 'playing') remaining = Math.max(0, deadline - clock.now());
      clearTimer();
      hooks.onSilence();
      notify('paused');
      return true;
    }
    function stop() {
      ++request;
      clearTimer();
      hooks.onSilence();
      index = -1; nextIndex = 0; remaining = interval();
      notify('idle');
    }
    return {
      get snapshot() { return snapshot(); },
      play,
      pause,
      stop,
      toggle: () => state === 'playing' || state === 'starting' ? pause() : play(),
      repeat: () => play(true),
      setProfile(nextProfile) { stop(); profile = nextProfile; notify('idle'); },
      setTempo(value) {
        if (!Number.isFinite(Number(value))) return;
        const oldInterval = interval();
        if (state === 'playing') remaining = Math.max(0, deadline - clock.now());
        tempo = Math.max(app.config.scan.minTempo, Math.min(app.config.scan.maxTempo, Number(value)));
        remaining *= interval() / oldInterval;
        if (state === 'playing') { clearTimer(); schedule(remaining); }
        hooks.onState(snapshot());
      }
    };
  };
})();
