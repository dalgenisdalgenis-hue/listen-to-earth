'use strict';
// Prueba de las decisiones del controlador con Tone simulado. No comprueba
// Web Audio, el timbre, la política de activación ni el volumen percibido.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const events = [];
class Node {
  constructor(options) { this.options = options; this.volume = { rampTo: (...a) => events.push(['volume', ...a]) }; events.push(['new', this.constructor.name]); }
  connect() { return this; }
  toDestination() { return this; }
  triggerRelease() { events.push(['release', this.constructor.name]); }
  triggerAttackRelease(...args) { events.push(['play', this.constructor.name, ...args]); }
}
class Synth extends Node {}
class NoiseSynth extends Node {}
class Volume extends Node {}
class Limiter extends Node {}
const Tone = { Synth, NoiseSynth, Volume, Limiter, gainToDb: v => 20 * Math.log10(v),
  now: () => 1, getContext: () => ({ state: 'running' }), start: async () => events.push(['start']) };
const context = { window: { Tone } };
vm.createContext(context);
for (const name of ['strings.es.js', 'config.js', 'decomposition.js', 'audio.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/js', name), 'utf8'), context);
}
(async () => {
  const app = context.window.ListenToEarth;
  const audio = app.createAudio();
  const good = { weights: { dust: .8 }, residual: .01 };
  audio.play(good);
  assert.equal(events.length, 0);
  await audio.start();
  assert.equal(events[0][0], 'start');
  audio.play(good);
  assert.equal(events.filter(e => e[0] === 'play').at(-1)[1], 'Synth');
  audio.play({ weights: { dust: .8 }, residual: .2 });
  assert.equal(events.filter(e => e[0] === 'play').at(-1)[1], 'NoiseSynth');
  audio.play({ weights: { dust: .01 }, residual: .01 });
  assert.equal(events.filter(e => e[0] === 'play').at(-1)[1], 'NoiseSynth');
  const ramps = events.filter(e => e[0] === 'volume').length;
  audio.toggleMute();
  assert.equal(events.filter(e => e[0] === 'volume').length, ramps);
  const count = events.filter(e => e[0] === 'play').length;
  audio.play(good);
  assert.equal(events.filter(e => e[0] === 'play').length, count);
  audio.toggleMute();
  audio.setVolume(0);
  audio.play(good);
  assert.equal(events.filter(e => e[0] === 'play').length, count);
  audio.stop();
  assert.equal(events.at(-1)[0], 'release');
  console.log('PASS: controlador de audio simulado: activación explícita, nota/clic, silencio, volumen cero y detener.');
})().catch(error => { console.error(error); process.exitCode = 1; });
