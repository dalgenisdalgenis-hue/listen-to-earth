'use strict';

(() => {
  const app = window.ListenToEarth;

  // El mapeo es el LINEAL del SPEC. La guarda de residuo se aplica aparte.
  app.noteFromIntensity = function (intensity) {
    if (intensity < app.config.minWeight) return null;
    const t = (intensity - app.config.minWeight) / (1 - app.config.minWeight);
    return Math.round(Math.min(Math.max(t, 0), 1) * 14);
  };

  app.soundFor = function (result) {
    const weight = result.weights.dust;
    if (!app.canPlay(weight, result.residual)) return { index: null, hz: null };
    const index = app.noteFromIntensity(weight);
    return { index, hz: app.config.scales[app.config.scaleMode][index] };
  };

  // Ningún nodo de audio se crea al cargar la página. start() solo se llama
  // desde Activar sonido o Reproducir barrido/P, por acción del usuario.
  app.createAudio = function () {
    let synth, click, master, limiter;
    let ready = false;
    let muted = false;
    let volume = 50;
    function setGain() {
      if (!master) return;
      if (muted || volume === 0) {
        master.mute = true;
        return;
      }
      // Tone.Volume silencia poniendo el volumen en -Infinity. No se debe
      // programar una rampa positiva después de silenciarlo.
      master.mute = false;
      master.volume.rampTo(window.Tone.gainToDb(volume / 100), 0.03);
    }
    return {
      get ready() { return ready; },
      get muted() { return muted; },
      async start() {
        if (!window.Tone) throw new Error('audioError');
        const Tone = window.Tone;
        await Tone.start();
        if (Tone.getContext().state !== 'running') throw new Error('audioError');
        if (!synth) {
          limiter = new Tone.Limiter(-1).toDestination();
          master = new Tone.Volume(-6).connect(limiter);
          // Timbre provisional de cuerda sintetizada, con ataque y caída cortos.
          synth = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.008, decay: 0.14, sustain: 0.08, release: 0.18 },
            volume: -12
          }).connect(master);
          click = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.018, sustain: 0, release: 0.012 },
            volume: -24
          }).connect(master);
        }
        ready = true;
        setGain();
      },
      play(result) {
        if (!ready || muted || volume === 0) return;
        const Tone = window.Tone;
        if (Tone.getContext().state !== 'running') throw new Error('audioError');
        const sound = app.soundFor(result);
        const now = Tone.now();
        // Una sola voz: al avanzar rápido no se acumula una orquesta de celdas.
        synth.triggerRelease(now);
        click.triggerRelease(now);
        if (sound.hz === null) click.triggerAttackRelease(0.025, now, 0.5);
        else synth.triggerAttackRelease(sound.hz, 0.20, now, 0.65);
      },
      stop() {
        if (!ready) return;
        synth.triggerRelease(window.Tone.now());
        click.triggerRelease(window.Tone.now());
      },
      toggleMute() {
        muted = !muted;
        setGain();
        return muted;
      },
      setVolume(value) {
        volume = Math.min(100, Math.max(0, Number(value)));
        setGain();
      }
    };
  };
})();
