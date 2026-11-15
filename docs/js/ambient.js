'use strict';

(() => {
  const button = document.getElementById('ambient-toggle');
  const status = document.getElementById('ambient-status');
  if (!button || !status || !window.Tone) return;

  const chords = [
    ['D3', 'A3', 'E4'],
    ['Bb2', 'F3', 'C4'],
    ['F3', 'C4', 'G4'],
    ['C3', 'G3', 'D4']
  ];
  const melody = ['A4', 'D5', 'F5', 'E5', 'C5', 'A4', 'G4', 'E4'];
  let output, pad, voice, delay, timer;
  let step = 0;
  let playing = false;

  function buildInstruments() {
    if (output) return;
    output = new Tone.Volume(-60).toDestination();
    delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.22, wet: 0.25 }).connect(output);
    pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 1.8, decay: 0.5, sustain: 0.35, release: 3.2 }
    }).connect(output);
    voice = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.35, decay: 0.8, sustain: 0.12, release: 2.2 }
    }).connect(delay);
  }

  function playPhrase() {
    if (!playing) return;
    const now = Tone.now();
    const chord = chords[Math.floor(step / 2) % chords.length];
    pad.triggerAttackRelease(chord, 4.8, now, 0.12);
    voice.triggerAttackRelease(melody[step % melody.length], 1.7, now + 0.55, 0.16);
    step += 1;
    timer = window.setTimeout(playPhrase, 3200);
  }

  async function start() {
    try {
      await Tone.start();
      buildInstruments();
      playing = true;
      output.mute = false;
      output.volume.rampTo(-18, 0.7);
      playPhrase();
      button.setAttribute('aria-pressed', 'true');
      button.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pausar ambientación';
      status.textContent = 'Ambientación artística activada. No representa datos de aerosoles.';
    } catch {
      status.textContent = 'El navegador no permitió iniciar la ambientación. Puedes intentarlo otra vez.';
    }
  }

  function stop(announce = true) {
    if (!playing) return;
    playing = false;
    window.clearTimeout(timer);
    output.volume.rampTo(-60, 0.5);
    window.setTimeout(() => {
      if (!playing) {
        pad.releaseAll();
        voice.triggerRelease();
        output.mute = true;
      }
    }, 550);
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<span aria-hidden="true">♪</span> Activar ambientación';
    if (announce) status.textContent = 'Ambientación pausada. No representa datos de aerosoles.';
  }

  button.addEventListener('click', () => playing ? stop() : start());
  document.querySelectorAll('a[href="experiencias.html"]').forEach(link => {
    link.addEventListener('click', () => stop(false));
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(false);
  });
  window.addEventListener('pagehide', () => stop(false));
})();
