'use strict';
// Ejecuta app.js sobre el HTML real, PNG decodificado por Pillow, DOM/Tone y
// reloj simulados. No es un navegador, lector de pantalla ni prueba acústica.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const folder = process.argv[2];
if (!folder) throw Error('Ejecuta python scripts/verificar_imagen.py');
const image = { width: 1920, height: 1080, data: fs.readFileSync(path.join(folder, 'image.rgba')) };
let now = 0, nextTimer = 0;
const timers = new Map();
function setTimer(callback, delay) {
  const id = ++nextTimer; timers.set(id, { callback, at: now + delay }); return id;
}
function advance(ms) {
  const target = now + ms;
  for (let guard = 1000; guard > 0; guard--) {
    const first = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (!first || first[1].at > target) { now = target; return; }
    now = first[1].at; timers.delete(first[0]); first[1].callback();
  }
  throw Error('Demasiados temporizadores');
}
const ids = new Map(), nodes = [];
let document;
class Element {
  constructor(tag, attributes = {}) {
    this.tag = tag; this.attributes = { ...attributes }; this.children = [];
    this.listeners = {}; this.dataset = {}; this.style = {}; this.tabIndex = -1;
    this.checked = Object.hasOwn(attributes, 'checked');
    this.hidden = Object.hasOwn(attributes, 'hidden');
    this.disabled = Object.hasOwn(attributes, 'disabled');
    this.value = attributes.value || ''; this.text = '';
    for (const [name, value] of Object.entries(attributes)) {
      if (name.startsWith('data-')) {
        const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        this.dataset[key] = value;
      }
    }
    if (attributes.id) ids.set(attributes.id, this);
    nodes.push(this);
  }
  set textContent(value) { this.text = String(value); this.replaceChildren(); }
  get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  append(node) { node.parent = this; this.children.push(node); }
  replaceChildren() { for (const child of this.children) child.parent = null; this.children = []; }
  addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); }
  removeEventListener(type, callback) { this.listeners[type] = this.listeners[type].filter(fn => fn !== callback); }
  contains(node) { return this === node || this.children.some(child => child.contains(node)); }
  matches(selector) {
    if (selector === '[role="gridcell"]') return this.attributes.role === 'gridcell';
    if (selector === '[contenteditable="true"]') return this.attributes.contenteditable === 'true';
    if (selector.startsWith('input:not(')) return this.tag === 'input' && !['checkbox', 'range'].includes(this.attributes.type);
    return this.tag === selector;
  }
  closest(selectors) {
    for (let node = this; node; node = node.parent) {
      if (selectors.split(',').some(selector => node.matches(selector.trim()))) return node;
    }
    return null;
  }
  focus() { document.activeElement = this; this.dispatch('focusin'); }
  dispatch(type, input = {}) {
    const event = { target: this, prevented: false, preventDefault() { this.prevented = true; }, ...input };
    for (let node = this; node; node = node.parent) for (const callback of node.listeners[type] || []) callback(event);
    return event;
  }
  getContext() { return { drawImage() {}, getImageData: () => image }; }
}
function build(spec) {
  const node = new Element(spec.tag, spec.attrs);
  for (const child of spec.children) node.append(build(child));
  if (node.tag === 'select') node.value = node.children[0].value;
  return node;
}
document = build(JSON.parse(fs.readFileSync(path.join(folder, 'dom.json'))));
document.getElementById = id => ids.get(id);
document.createElement = tag => new Element(tag);
document.querySelectorAll = selector => nodes.filter(node => Object.hasOwn(node.attributes, selector.slice(1, -1)));
document.hidden = false;
const byId = id => ids.get(id), body = nodes.find(node => node.tag === 'body');
document.body = body;
const audioNodes = [], plays = [], attacks = [];
class AudioNode {
  constructor(options) {
    this.options = options; this.volume = { rampTo() {} };
    this.frequency = { setValueAtTime() {}, rampTo() {} };
    audioNodes.push(this);
  }
  connect(target) { this.target = target; return this; }
  toDestination() { return this; }
  triggerRelease() {}
  releaseAll() {}
  triggerAttack(...args) { attacks.push({ node: this, args }); }
  triggerAttackRelease(...args) { plays.push({ node: this, args }); }
}
class Synth extends AudioNode {}
class PolySynth extends AudioNode { constructor(Voice, options) { super(options); this.Voice = Voice; } }
class MembraneSynth extends AudioNode {}
class FMSynth extends AudioNode {}
class NoiseSynth extends AudioNode {}
class Volume extends AudioNode {}
class Limiter extends AudioNode {}
class Filter extends AudioNode {}
const Tone = { Synth, PolySynth, MembraneSynth, FMSynth, NoiseSynth, Volume, Limiter, Filter,
  gainToDb: v => 20 * Math.log10(v), now: () => now / 1000,
  getContext: () => ({ state: 'running' }), start: async () => {} };
const context = { window: { Tone, setTimeout: setTimer, clearTimeout: id => timers.delete(id),
    location: { search: '', href: '' }, addEventListener() {}, innerHeight: 800 },
  document, setTimeout: setTimer, clearTimeout: id => timers.delete(id), performance: { now: () => now },
  Image: class { naturalWidth = 1920; naturalHeight = 1080; set src(value) { queueMicrotask(() => this.onload()); } } };
vm.createContext(context);
for (const file of ['strings.es.js', 'config.js', 'image-data.js', 'decomposition.js', 'selection.js', 'audio.js', 'grid.js', 'scan.js', 'app.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/js', file), 'utf8'), context);
}
const app = context.window.ListenToEarth;
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const key = (key, target = body) => target.dispatch('keydown', { key });
(async () => {
  await flush();
  assert.equal(app.checkResults.length, 4); assert.ok(app.checkResults.every(check => check.passed));
  assert.equal(app.gridCells.length, 96); assert.equal(audioNodes.length, 0);
  const cells = byId('grid').children.flatMap(row => row.children);
  assert.equal(cells.filter(cell => cell.tabIndex === 0).length, 1);
  assert.equal(byId('aerosol-dust').checked, true); assert.equal(byId('aerosol-seaSalt').checked, false);
  assert.equal(byId('mode-journey').attributes['aria-pressed'], 'true');
  byId('mode-world').dispatch('click');
  assert.equal(byId('scan-mode').value, 'world');
  assert.equal(byId('mode-world').attributes['aria-pressed'], 'true');
  assert.equal(app.scanner.snapshot.mode, 'world');
  assert.equal(app.scanner.snapshot.steps, 60);
  assert.equal(byId('scan-progress').max, 60);
  byId('mode-journey').dispatch('click');
  assert.equal(byId('scan-mode').value, 'journey');
  assert.equal(app.scanner.snapshot.steps, 30);
  assert.equal(byId('scan-progress').max, 30);
  key('7'); assert.deepEqual(Array.from(app.selection.types), ['seaSalt']); assert.equal(audioNodes.length, 0);
  byId('aerosol-dust').focus(); key('5', byId('aerosol-dust'));
  assert.deepEqual(Array.from(app.selection.types), ['blackCarbon']);
  byId('aerosol-sulfate').checked = true; byId('aerosol-sulfate').dispatch('change');
  assert.deepEqual(Array.from(app.selection.types), ['sulfate']);
  byId('mix-mode').checked = true; byId('mix-mode').dispatch('change');
  key('4'); key('5'); key('7'); assert.equal(app.selection.types.length, 4);
  key('8'); assert.deepEqual(Array.from(app.selection.types), ['dust']); assert.equal(byId('mix-mode').checked, false);
  byId('activate').dispatch('click'); await flush(); assert.equal(app.audio.ready, true);
  assert.equal(app.audio.imageLayerEnabled, true);
  assert.equal(app.audio.getImageLayerVolume(), 35);
  byId('image-layer').checked = false; byId('image-layer').dispatch('change');
  assert.equal(app.audio.imageLayerEnabled, false);
  byId('image-layer').checked = true; byId('image-layer').dispatch('change');
  assert.equal(app.audio.imageLayerEnabled, true);
  byId('volume-image-layer').value = 42; byId('volume-image-layer').dispatch('input');
  assert.equal(app.audio.getImageLayerVolume(), 42);
  // El total visible debe pertenecer al perfil activo, no a la antigua
  // constante compartida de 30 pasos.
  byId('mode-world').dispatch('click'); key('p'); await flush();
  assert.ok(byId('scan-readout').textContent.includes('Paso 1 de 60'));
  key('s'); byId('mode-journey').dispatch('click');
  assert.equal(byId('sound-source').textContent, app.text.sourceEmpty); // Cambiar recorrido borra la preescucha.
  const created = audioNodes.length;
  const beforeRd = plays.length; key('r'); advance(30);
  assert.equal(app.rdPoint.x, 587); assert.equal(app.rdPoint.y, 429);
  assert.ok(app.rdPoint.result.weights.dust < 0.0005);
  assert.ok(Math.abs(app.rdPoint.result.weights.seaSalt - 0.608) < 0.001);
  assert.ok(byId('sound-source').textContent.includes('punto de República Dominicana'));
  assert.equal(byId('rd-marker').hidden, false);
  assert.ok(byId('readout').textContent.includes('ventana de 3 × 3'));
  assert.equal(plays.length, beforeRd); // Solo polvo: el punto de RD queda en silencio.
  const beforeSalt = plays.length; key('7');
  assert.equal(plays.length, beforeSalt + 2); // Seno afinado + ruido rosa de sal marina.
  assert.equal(plays.at(-2).args[0], 587.34);
  key('4'); // Volvemos a solo polvo para las comprobaciones siguientes.
  cells[0].focus(); key('Enter', cells[0]); key('7', cells[0]);
  assert.equal(byId('rd-marker').hidden, true);
  assert.equal(document.activeElement, cells[0]); assert.equal(cells[0].tabIndex, 0);
  assert.equal(audioNodes.length, created); assert.ok(byId('sound-source').textContent.includes('fila 1'));
  const weights = JSON.stringify(app.gridCells.map(cell => cell.result));
  key('p'); await flush(); assert.equal(app.scanner.snapshot.state, 'playing');
  assert.equal(document.activeElement, byId('image-panel'));
  assert.equal(byId('scan-progress').value, 1);
  const snapshot = JSON.stringify(app.scanner.snapshot), before = plays.length;
  const tick = [...timers.entries()].find(entry => entry[1].at === now + 500);
  assert.ok(tick);
  key('5'); key('6');
  assert.equal(plays.length, before); assert.equal(JSON.stringify(app.scanner.snapshot), snapshot);
  assert.ok(timers.has(tick[0])); assert.equal(JSON.stringify(app.gridCells.map(cell => cell.result)), weights);
  advance(500); assert.equal(app.scanner.snapshot.nextIndex, 2);
  assert.ok(byId('sound-source').textContent.includes('paso 2'));
  key('4'); assert.ok(byId('sound-source').textContent.includes('Polvo:'));
  byId('volume-seaSalt').value = 80; byId('volume-seaSalt').dispatch('input');
  key('8'); key('8'); assert.equal(app.audio.getVolume('seaSalt'), 80);
  key('s'); key('p'); await flush(); advance(13500);
  const beforeSilentEnd = plays.length;
  advance(1500);
  assert.equal(app.scanner.snapshot.state, 'ended');
  assert.equal(plays.length, beforeSilentEnd + 1); // El penúltimo paso conserva polvo en 1/5 zonas.
  assert.equal(byId('journey-ending').hidden, false);
  assert.ok(byId('journey-ending-text').textContent.toLowerCase().includes('polvo'));
  assert.ok(byId('journey-ending-text').textContent.toLowerCase().includes('sal marina'));
  assert.ok(Math.abs(app.scanner.snapshot.index - 29) < 0.001);
  assert.deepEqual(Array.from(app.selection.types), ['dust']); // El final no cambia la selección.
  const endCount = plays.length; key('7');
  const preview = plays.slice(endCount);
  assert.equal(preview.length, 2);
  assert.equal(preview[0].args[0], 329.63); // Sal marina de la franja, no del punto de RD.
  assert.ok(byId('sound-source').textContent.includes('paso 30'));
  key('r'); assert.ok(byId('sound-source').textContent.includes('punto de República Dominicana'));
  const replayCount = plays.length; byId('hear-ending-salt').dispatch('click'); advance(30);
  assert.equal(plays.length, replayCount + 2);
  assert.ok(byId('sound-source').textContent.includes('paso 30'));
  assert.ok(byId('status').textContent.includes('último resumen zonal'));
  byId('activate').dispatch('click'); await flush(); advance(30);
  assert.ok(byId('status').textContent.includes('paso 30'));
  assert.ok(!byId('status').textContent.includes('Fila 1 de'));
  key('m'); const muted = plays.length; key('5'); assert.equal(plays.length, muted); key('m');
  const text = new Element('input', { type: 'text' }); body.append(text);
  const selection = JSON.stringify(app.selection.types); key('7', text);
  assert.equal(JSON.stringify(app.selection.types), selection);
  key('v'); assert.equal(context.window.location.href, 'planeta-completo.html');
  const state = JSON.stringify(app.selection.types);
  byId('retry').dispatch('click'); await flush();
  assert.equal(JSON.stringify(app.selection.types), state); assert.equal(app.audio.getVolume('seaSalt'), 80);
  assert.equal(audioNodes.length, created); assert.equal(app.scanner.snapshot.state, 'idle');
  console.log('PASS: app con DOM/Tone/reloj simulados: casillas, 4–8, volúmenes, foco, barrido sin reinicio, muestra de franja al terminar, edición de texto y recarga.');
})().catch(error => { console.error(error); process.exitCode = 1; });
