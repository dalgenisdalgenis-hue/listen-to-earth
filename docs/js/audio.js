'use strict';

(() => {
  const app = window.ListenToEarth;
  const number = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 3 });

  app.noteFromIntensity = function (intensity) {
    if (intensity < app.config.minWeight) return null;
    const t = (intensity - app.config.minWeight) / (1 - app.config.minWeight);
    return Math.round(Math.min(Math.max(t, 0), 1) * 14);
  };
  app.soundFor = function (result, type = 'dust') {
    const weight = result.weights[type];
    if (!app.canPlay(weight, result.residual)) return { index: null, hz: null };
    const index = app.noteFromIntensity(weight);
    return { index, hz: app.config.scales[app.config.scaleMode][index] };
  };
  app.soundPlan = (result, types = app.selection.types) => types.map(type => ({
    type, weight: result.weights[type], ...app.soundFor(result, type)
  }));
  app.describeResult = function (result, types = app.selection.types) {
    const plan = app.soundPlan(result, types);
    const quantities = plan.length ? plan.map(note => app.format(
      note.weight === 0 ? 'aerosolZero' : note.weight < app.config.minWeight ? 'aerosolBelow' : 'aerosolAmount',
      { type: app.text[note.type], weight: number.format(note.weight) }
    )).join('; ') : app.text.noSelection;
    const audible = plan.filter(note => note.hz !== null);
    const outcome = !plan.length ? app.text.noSelectionClick :
      result.residual > app.config.maxResidual ? app.text.unreliable :
      !audible.length ? app.text.belowThreshold : audible.map(note => app.format('instrumentNote', {
        type: app.text[note.type], index: note.index + 1, hz: number.format(note.hz)
      })).join('; ');
    return { quantities, outcome };
  };

  // Los cuatro pesos se calculan una sola vez sobre la matriz completa.
  // Seleccionar cambia qué pesos se oyen; no se vuelve a ajustar RGB ni se
  // normalizan los pesos seleccionados para que sumen uno.
  app.createAudio = function (selection = app.selection) {
    const order = app.config.instrumentOrder;
    const volumes = Object.fromEntries(order.map(type => [type, 50]));
    const active = Object.fromEntries(order.map(type => [type, false]));
    let instruments, gains, click, master, waveNoise, waveFilter;
    let ready = false, muted = false;
    function gain(type) {
      if (!gains) return;
      const channel = gains[type];
      // Marcar una capa no revive una voz antigua: active se habilita en play().
      if (!selection.has(type) || !active[type] || volumes[type] === 0) {
        channel.mute = true;
        return;
      }
      // No programar una rampa positiva después de silenciar el canal.
      channel.mute = false;
      channel.volume.rampTo(window.Tone.gainToDb(volumes[type] / 100), 0.03);
    }
    function release(type, time) {
      instruments[type].triggerRelease(time);
      if (type === 'seaSalt') waveNoise.triggerRelease(time);
    }
    return {
      get ready() { return ready; },
      get muted() { return muted; },
      getVolume: type => volumes[type],
      async start() {
        if (!window.Tone) throw new Error('audioError');
        const Tone = window.Tone;
        await Tone.start();
        if (Tone.getContext().state !== 'running') throw new Error('audioError');
        if (!instruments) {
          const limiter = new Tone.Limiter(-1).toDestination();
          master = new Tone.Volume(0).connect(limiter);
          gains = Object.fromEntries(order.map(type => [type, new Tone.Volume(-6).connect(master)]));
          // Timbres provisionales: el equipo debe comprobar su identidad en mono.
          instruments = {
            dust: new Tone.Synth({
              oscillator: { type: 'triangle' },
              envelope: { attack: 0.008, decay: 0.14, sustain: 0.08, release: 0.18 }, volume: -12
            }).connect(gains.dust),
            blackCarbon: new Tone.MembraneSynth({
              pitchDecay: 0.035, octaves: 1.5, oscillator: { type: 'sine' },
              envelope: { attack: 0.001, decay: 0.16, sustain: 0, release: 0.06 }, volume: -18
            }).connect(gains.blackCarbon),
            sulfate: new Tone.FMSynth({
              harmonicity: 3, modulationIndex: 4,
              oscillator: { type: 'sine' }, modulation: { type: 'sine' },
              envelope: { attack: 0.003, decay: 0.25, sustain: 0, release: 0.10 },
              modulationEnvelope: { attack: 0.003, decay: 0.20, sustain: 0, release: 0.08 }, volume: -18
            }).connect(gains.sulfate),
            seaSalt: new Tone.Synth({
              oscillator: { type: 'sine' },
              envelope: { attack: 0.06, decay: 0.10, sustain: 0.12, release: 0.18 }, volume: -20
            }).connect(gains.seaSalt)
          };
          waveFilter = new Tone.Filter({ type: 'bandpass', frequency: 196, Q: 0.7 }).connect(gains.seaSalt);
          waveNoise = new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: { attack: 0.05, decay: 0.10, sustain: 0.05, release: 0.12 }, volume: -30
          }).connect(waveFilter);
          click = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.018, sustain: 0, release: 0.012 }, volume: -30
          }).connect(master);
        }
        ready = true;
        master.mute = muted;
        order.forEach(gain);
      },
      play(result) {
        if (!ready || muted) return;
        const Tone = window.Tone;
        if (Tone.getContext().state !== 'running') throw new Error('audioError');
        const now = Tone.now();
        const notes = app.soundPlan(result, selection.types).filter(note => note.hz !== null);
        for (const type of order) { release(type, now); active[type] = false; }
        click.triggerRelease(now);
        // Un solo clic si ninguna capa seleccionada supera ambas guardas.
        // Volumen cero es una elección del usuario, no ausencia de partículas:
        // no sustituimos por un clic una nota que el usuario dejó sin volumen.
        for (const note of notes) active[note.type] = volumes[note.type] > 0;
        order.forEach(gain);
        if (!notes.length) click.triggerAttackRelease(0.025, now, 0.5);
        for (const note of notes) {
          if (!active[note.type]) continue;
          instruments[note.type].triggerAttackRelease(note.hz, 0.20, now, 0.65);
          if (note.type === 'seaSalt') {
            // El oleaje conserva altura: seno en la nota y ruido rosa filtrado
            // alrededor de la misma frecuencia. No es ruido sin relación al dato.
            waveFilter.frequency.setValueAtTime(note.hz, now);
            waveNoise.triggerAttackRelease(0.20, now, 0.4);
          }
        }
      },
      selectionChanged() {
        if (!ready) return;
        for (const type of order) {
          if (!selection.has(type)) {
            active[type] = false;
            release(type, window.Tone.now());
          }
          gain(type);
        }
      },
      stop() {
        if (!ready) return;
        for (const type of order) {
          release(type, window.Tone.now()); active[type] = false; gain(type);
        }
        click.triggerRelease(window.Tone.now());
      },
      toggleMute() {
        muted = !muted;
        if (master) master.mute = muted;
        return muted;
      },
      setVolume(type, value) {
        if (!order.includes(type) || !Number.isFinite(Number(value))) return;
        volumes[type] = Math.min(100, Math.max(0, Number(value)));
        if (ready && volumes[type] === 0) { active[type] = false; release(type, window.Tone.now()); }
        gain(type);
      }
    };
  };
})();
