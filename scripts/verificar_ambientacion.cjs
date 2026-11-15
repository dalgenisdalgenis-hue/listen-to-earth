'use strict';

// Comprueba la lógica de activación voluntaria con Tone simulado. No sustituye
// una prueba acústica en un navegador y no evalúa el timbre percibido.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

class Element {
  constructor() { this.listeners = {}; this.attributes = {}; this.textContent = ''; this.innerHTML = ''; }
  addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  async dispatch(type) { for (const callback of this.listeners[type] || []) await callback({ target: this }); }
}

const button = new Element(), status = new Element(), link = new Element();
const documentListeners = {};
const document = {
  hidden: false,
  getElementById: id => id === 'ambient-toggle' ? button : id === 'ambient-status' ? status : null,
  querySelectorAll: selector => selector === 'a[href="experiencias.html"]' ? [link] : [],
  addEventListener: (type, callback) => { (documentListeners[type] ??= []).push(callback); }
};
const nodes = [], plays = [];
class Node {
  constructor(options) { this.options = options; this.mute = false; this.volume = { rampTo() {} }; nodes.push(this); }
  connect(target) { this.target = target; return this; }
  toDestination() { return this; }
  triggerAttackRelease(...args) { plays.push(args); }
  triggerRelease() {}
  releaseAll() {}
}
class Volume extends Node {}
class FeedbackDelay extends Node {}
class Synth extends Node {}
class PolySynth extends Node { constructor(Voice, options) { super(options); this.Voice = Voice; } }
const timers = new Map(); let timerId = 0;
const windowListeners = {};
const Tone = { Volume, FeedbackDelay, Synth, PolySynth, now: () => 1, start: async () => {} };
const window = {
  Tone,
  setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
  clearTimeout(id) { timers.delete(id); },
  addEventListener(type, callback) { (windowListeners[type] ??= []).push(callback); }
};
const context = { window, document, Tone };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/js/ambient.js'), 'utf8'), context);

(async () => {
  assert.equal(nodes.length, 0, 'La portada creó audio antes del consentimiento');
  await button.dispatch('click');
  assert.equal(button.attributes['aria-pressed'], 'true');
  assert.ok(button.innerHTML.includes('Pausar'));
  assert.ok(status.textContent.toLowerCase().includes('no representa datos'));
  assert.equal(nodes.length, 4);
  assert.equal(plays.length, 2, 'La primera frase debe incluir acorde y melodía');
  assert.equal(timers.size, 1);
  await button.dispatch('click');
  assert.equal(button.attributes['aria-pressed'], 'false');
  assert.ok(button.innerHTML.includes('Activar'));
  assert.ok(status.textContent.includes('pausada'));
  assert.ok([...timers.values()].some(timer => timer.delay === 550));
  console.log('PASS: ambientación voluntaria: no crea audio al cargar, inicia tras pulsación, programa una frase y se puede pausar.');
})().catch(error => { console.error(error); process.exitCode = 1; });
