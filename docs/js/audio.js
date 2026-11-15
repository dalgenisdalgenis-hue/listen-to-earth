'use strict';

(() => {
  const app = window.ListenToEarth;
  const number = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 3 });

  app.noteFromIntensity = function (intensity) {
    if (intensity < app.config.minWeight) return null;
    const t = (intensity - app.config.minWeight) / (1 - app.config.minWeight);
    return Math.round(Math.min(Math.max(t, 0), 1) * 14);
  };
  app.canPlayResult = function (result, type) {
    if (result.spatial) {
      return result.activeZones?.[type] > 0 && result.weights[type] >= app.config.minWeight;
    }
    return app.canPlay(result.weights[type], result.residual);
  };
  app.soundFor = function (result, type = 'dust') {
    const weight = result.weights[type];
    if (!app.canPlayResult(result, type)) return { index: null, hz: null };
    const index = app.noteFromIntensity(weight);
    return { index, hz: app.config.scales[app.config.scaleMode][index] };
  };
  app.soundPlan = (result, types = app.selection.types) => types.map(type => ({
    type,
    weight: result.weights[type],
    coverage: result.spatial ? result.coverage[type] : 1,
    activeZones: result.spatial ? result.activeZones[type] : null,
    zoneCount: result.spatial ? result.zoneCount : null,
    ...app.soundFor(result, type)
  }));
  app.describeResult = function (result, types = app.selection.types) {
    const plan = app.soundPlan(result, types);
    const quantities = plan.length ? plan.map(note => result.spatial ? app.format(
      'aerosolSpatialAmount', {
        type: app.text[note.type], weight: number.format(note.weight),
        active: note.activeZones, total: note.zoneCount
      }) : app.format(
        note.weight === 0 ? 'aerosolZero' : note.weight < app.config.minWeight ? 'aerosolBelow' : 'aerosolAmount',
        { type: app.text[note.type], weight: number.format(note.weight) }
      )).join('; ') : app.text.noSelection;
    const audible = plan.filter(note => note.hz !== null);
    const outcome = !plan.length ? app.text.noSelectionClick :
      !result.spatial && result.residual > app.config.maxResidual ? app.text.unreliable :
      !audible.length ? app.text.belowThreshold : audible.map(note => app.format('instrumentNote', {
        type: app.text[note.type], index: note.index + 1, hz: number.format(note.hz)
      })).join('; ');
    return { quantities, outcome };
  };

  // Capa de la imagen completa, inspirada en las sonificaciones por capas.
  // No depende del selector: resume los cuatro pesos que pasan las mismas
  // guardas científicas de las notas. La suma se limita a 1 y controla solo
  // volumen y brillo; no introduce una segunda regla de altura musical.
  app.imageLayerFor = function (result) {
    if (!result || (!result.spatial && result.residual > app.config.maxResidual)) {
      return { intensity: 0, volumeDb: -60, cutoff: 280 };
    }
    const total = app.config.instrumentOrder.reduce((sum, type) => {
      if (!app.canPlayResult(result, type)) return sum;
      // En un resumen zonal, intensidad × cobertura equivale a promediar las
      // bandas válidas y asignar cero al resto: conserva fuerza y extensión.
      return sum + result.weights[type] * (result.spatial ? result.coverage[type] : 1);
    }, 0);
    const intensity = Math.min(1, Math.max(0, total));
    return {
      intensity,
      volumeDb: intensity === 0 ? -60 : -26 + 10 * intensity,
      cutoff: 280 + 1520 * intensity
    };
  };

  // Los cuatro pesos se calculan una sola vez sobre la matriz completa.
  // Seleccionar cambia qué pesos se oyen; no se vuelve a ajustar RGB ni se
  // normalizan los pesos seleccionados para que sumen uno.
  app.createAudio = function (selection = app.selection) {
    const order = app.config.instrumentOrder;
    const volumes = Object.fromEntries(order.map(type => [type, 50]));
    const active = Object.fromEntries(order.map(type => [type, false]));
    const spatialGain = Object.fromEntries(order.map(type => [type, 1]));
    let instruments, gains, master, waveNoise, waveFilter;
    let imageBed, imageBedGain, imageBedFilter, imageBedActive = false;
    let currentImageLayer = { intensity: 0, volumeDb: -60, cutoff: 280 };
    let imageLayerEnabled = true, imageLayerVolume = 35;
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
      channel.volume.rampTo(window.Tone.gainToDb(
        volumes[type] / 100 * spatialGain[type]), 0.03);
    }
    function release(type, time) {
      instruments[type].triggerRelease(time);
      if (type === 'seaSalt') waveNoise.triggerRelease(time);
    }
    function stopImageLayer(time = window.Tone?.now?.() ?? 0) {
      if (!imageBedGain || !imageBed) return;
      imageBedGain.volume.rampTo(-60, 0.28);
      if (imageBedActive) imageBed.releaseAll(time);
      imageBedActive = false;
    }
    function updateImageLayer(result, now) {
      if (!imageLayerEnabled || imageLayerVolume === 0) {
        stopImageLayer(now);
        return;
      }
      const layer = app.imageLayerFor(result);
      currentImageLayer = layer;
      if (layer.intensity === 0) {
        // Conservamos el acorde preparado para que una zona breve en silencio
        // no produzca un nuevo ataque, pero lo ocultamos con una rampa suave.
        imageBedGain.volume.rampTo(-60, 0.28);
        return;
      }
      if (!imageBedActive) {
        imageBed.triggerAttack(['G2', 'D3', 'A3'], now, 0.42);
        imageBedActive = true;
      }
      const volumeOffset = window.Tone.gainToDb(imageLayerVolume / 50);
      imageBedGain.volume.rampTo(Math.max(-60, layer.volumeDb + volumeOffset), 0.35);
      imageBedFilter.frequency.rampTo(layer.cutoff, 0.35);
    }
    return {
      get ready() { return ready; },
      get muted() { return muted; },
      get imageLayerEnabled() { return imageLayerEnabled; },
      getVolume: type => volumes[type],
      getImageLayerVolume: () => imageLayerVolume,
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
          imageBedGain = new Tone.Volume(-60).connect(master);
          imageBedFilter = new Tone.Filter({ type: 'lowpass', frequency: 280, Q: 0.45 }).connect(imageBedGain);
          imageBed = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'fatsine', count: 2, spread: 12 },
            envelope: { attack: 0.75, decay: 0.3, sustain: 0.9, release: 0.8 },
            volume: -12
          }).connect(imageBedFilter);
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
        updateImageLayer(result, now);
        const notes = app.soundPlan(result, selection.types).filter(note => note.hz !== null);
        for (const type of order) { release(type, now); active[type] = false; }
        // Por decisión del equipo, una muestra sin notas queda en silencio.
        // No añadimos un efecto de tecla: se confundía con los aerosoles.
        for (const note of notes) {
          active[note.type] = volumes[note.type] > 0;
          // La raíz cuadrada conserva una relación monótona con la cobertura,
          // pero evita que una pluma real en 1 de 12 bandas quede inaudible.
          spatialGain[note.type] = Math.sqrt(note.coverage);
        }
        order.forEach(gain);
        const duration = result.spatial ? app.config.scan.noteDuration : 0.20;
        for (const note of notes) {
          if (!active[note.type]) continue;
          instruments[note.type].triggerAttackRelease(note.hz, duration, now, 0.65);
          if (note.type === 'seaSalt') {
            // El oleaje conserva altura: seno en la nota y ruido rosa filtrado
            // alrededor de la misma frecuencia. No es ruido sin relación al dato.
            waveFilter.frequency.setValueAtTime(note.hz, now);
            waveNoise.triggerAttackRelease(duration, now, 0.4);
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
        stopImageLayer();
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
      },
      setImageLayerEnabled(enabled) {
        imageLayerEnabled = Boolean(enabled);
        if (ready && !imageLayerEnabled) stopImageLayer();
        return imageLayerEnabled;
      },
      setImageLayerVolume(value) {
        if (!Number.isFinite(Number(value))) return;
        imageLayerVolume = Math.min(100, Math.max(0, Number(value)));
        if (ready && imageLayerVolume === 0) stopImageLayer();
        else if (ready && imageBedActive && currentImageLayer.intensity > 0) {
          const offset = window.Tone.gainToDb(imageLayerVolume / 50);
          imageBedGain.volume.rampTo(Math.max(-60, currentImageLayer.volumeDb + offset), 0.12);
        }
      }
    };
  };
})();
