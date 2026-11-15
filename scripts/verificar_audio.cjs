'use strict';
// Tone simulado: comprueba decisiones, conexiones y frecuencias programadas.
// No acredita Web Audio, timbre audible, volumen percibido ni sonido en mono.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const events = [], nodes = [];
class Node {
  constructor(options) {
    this.options = options; this.mute = false; nodes.push(this);
    this.volume = { rampTo: (...args) => events.push({ event: 'volume', node: this, args }) };
    this.frequency = {
      setValueAtTime: (...args) => events.push({ event: 'frequency', node: this, args }),
      rampTo: (...args) => events.push({ event: 'filter-ramp', node: this, args })
    };
    events.push({ event: 'new', node: this });
  }
  connect(target) { this.target = target; return this; }
  toDestination() { return this; }
  triggerRelease(...args) { events.push({ event: 'release', node: this, args }); }
  releaseAll(...args) { events.push({ event: 'release-all', node: this, args }); }
  triggerAttack(...args) { events.push({ event: 'attack', node: this, args }); }
  triggerAttackRelease(...args) { events.push({ event: 'play', node: this, args }); }
}
class Synth extends Node {}
class PolySynth extends Node { constructor(Voice, options) { super(options); this.Voice = Voice; } }
class MembraneSynth extends Node {}
class FMSynth extends Node {}
class NoiseSynth extends Node {}
class Filter extends Node {}
class Volume extends Node {}
class Limiter extends Node {}
let state = 'running';
const Tone = { Synth, PolySynth, MembraneSynth, FMSynth, NoiseSynth, Filter, Volume, Limiter,
  gainToDb: value => 20 * Math.log10(value), now: () => 42,
  getContext: () => ({ state }), start: async () => events.push({ event: 'start' }) };
const context = { window: { Tone } };
vm.createContext(context);
for (const file of ['strings.es.js', 'config.js', 'selection.js', 'decomposition.js', 'audio.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/js', file), 'utf8'), context);
}
const plays = () => events.filter(event => event.event === 'play');
(async () => {
  const app = context.window.ListenToEarth, selection = app.selection;
  const order = Array.from(app.config.instrumentOrder);
  const audio = app.createAudio(selection);
  const result = { weights: Object.fromEntries(order.map(type => [type, .8])), residual: .01 };
  audio.play(result); audio.setVolume('dust', 40); audio.selectionChanged();
  assert.equal(events.length, 0, 'Se creó audio antes de activar');
  audio.setVolume('dust', 50);
  await audio.start(); assert.equal(events[0].event, 'start');
  const dust = nodes.find(node => node instanceof Synth && node.options.oscillator.type === 'triangle');
  const sea = nodes.find(node => node instanceof Synth && node.options.oscillator.type === 'sine');
  const carbon = nodes.find(node => node instanceof MembraneSynth);
  const sulfate = nodes.find(node => node instanceof FMSynth);
  const wave = nodes.find(node => node instanceof NoiseSynth && node.options.noise.type === 'pink');
  const imageBed = nodes.find(node => node instanceof PolySynth);
  assert.equal(nodes.some(node => node instanceof NoiseSynth && node.options.noise.type === 'white'), false);
  const filter = nodes.find(node => node instanceof Filter);
  const master = nodes.find(node => node instanceof Volume && node.target instanceof Limiter);
  const voices = { dust, blackCarbon: carbon, sulfate, seaSalt: sea };
  audio.play(result); assert.equal(plays().length, 1); assert.equal(plays()[0].node, dust);
  assert.ok(events.some(event => event.event === 'attack' && event.node === imageBed));
  assert.ok(events.some(event => event.event === 'filter-ramp' && event.args[0] === 1800));
  assert.equal(audio.imageLayerEnabled, true); assert.equal(audio.getImageLayerVolume(), 35);
  assert.equal(plays()[0].args[0], 880.01);
  assert.equal(plays()[0].args[1], 0.20); // Consulta puntual/manual.
  assert.equal(dust.options.volume, -12); assert.equal(audio.getVolume('dust'), 50);
  const spatial = {
    ...result, spatial: true, zoneCount: 4,
    coverage: Object.fromEntries(order.map(type => [type, .25])),
    activeZones: Object.fromEntries(order.map(type => [type, 1]))
  };
  audio.play(spatial);
  const spatialDust = plays().at(-1);
  assert.equal(spatialDust.node, dust); assert.equal(spatialDust.args[1], .45);
  const dustVolumes = events.filter(event => event.event === 'volume' && event.node === dust.target);
  assert.ok(Math.abs(dustVolumes.at(-1).args[0] - Tone.gainToDb(.5 * Math.sqrt(.25))) < 1e-12);
  selection.toggleAll();
  const oldCount = plays().length; audio.selectionChanged();
  assert.equal(plays().length, oldCount, 'Añadir capas disparó notas antes del siguiente paso');
  audio.play(result);
  const chord = plays().slice(oldCount);
  assert.equal(chord.length, 5); // Cuatro instrumentos; sal marina = seno + ruido.
  for (const voice of Object.values(voices)) {
    const played = chord.find(event => event.node === voice);
    assert.ok(played); assert.equal(played.args[0], 880.01); assert.equal(played.args[2], 42);
  }
  assert.ok(chord.some(event => event.node === wave));
  assert.equal(filter.target, sea.target); assert.equal(wave.target, filter);
  assert.ok(events.some(event => event.event === 'frequency' && event.args[0] === 880.01 && event.args[1] === 42));
  audio.setImageLayerEnabled(false); assert.equal(audio.imageLayerEnabled, false);
  const bedAttacks = events.filter(event => event.event === 'attack' && event.node === imageBed).length;
  audio.play(result); assert.equal(events.filter(event => event.event === 'attack' && event.node === imageBed).length, bedAttacks);
  audio.setImageLayerEnabled(true); audio.setImageLayerVolume(40); audio.play(result);
  assert.equal(audio.getImageLayerVolume(), 40);
  assert.equal(events.filter(event => event.event === 'attack' && event.node === imageBed).length, bedAttacks + 1);
  selection.set('blackCarbon', false); audio.selectionChanged();
  assert.equal(carbon.target.mute, true);
  assert.ok(events.some(event => event.event === 'release' && event.node === carbon));
  // Volumen cero y ausencia de datos deben permanecer en silencio.
  order.forEach(type => selection.set(type, type === 'seaSalt'));
  audio.selectionChanged(); audio.setVolume('seaSalt', 0);
  const zero = plays().length; audio.play(result); assert.equal(plays().length, zero);
  audio.setVolume('seaSalt', 80); assert.equal(audio.getVolume('seaSalt'), 80);
  audio.play(result); assert.equal(plays().length, zero + 2);
  selection.toggleAll(); selection.toggleAll();
  assert.equal(audio.getVolume('seaSalt'), 80); // 8 no borra volúmenes elegidos.
  order.forEach(type => selection.set(type, false)); audio.selectionChanged();
  const none = plays().length; audio.play(result);
  assert.equal(plays().length, none);
  selection.toggleAll(); audio.selectionChanged();
  const bad = plays().length; audio.play({ ...result, residual: .2 });
  assert.equal(plays().length, bad);
  for (const voice of Object.values(voices)) assert.equal(voice.target.mute, true);
  const beforeMute = plays().length;
  audio.toggleMute(); assert.equal(master.mute, true);
  audio.play(result); assert.equal(plays().length, beforeMute);
  audio.setVolume('dust', 75); assert.equal(master.mute, true);
  audio.toggleMute(); assert.equal(master.mute, false);
  audio.play(result); audio.stop();
  for (const voice of Object.values(voices)) assert.equal(voice.target.mute, true);
  const clamped = audio.getVolume('dust');
  audio.setVolume('dust', NaN); assert.equal(audio.getVolume('dust'), clamped);
  audio.setVolume('dust', 999); assert.equal(audio.getVolume('dust'), 100);
  state = 'suspended'; assert.throws(() => audio.play(result), /audioError/);
  console.log('PASS: audio simulado: cuatro instrumentos, cobertura en volumen, notas zonales de 0,45 s, textura independiente, oleaje, silencio y detener.');
})().catch(error => { console.error(error); process.exitCode = 1; });
