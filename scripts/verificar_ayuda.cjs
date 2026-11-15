'use strict';

// Prueba la ayuda accesible sin iniciar Tone ni volver a calcular los datos.
// El flujo completo de la aplicación sigue cubierto por verificar_imagen.py.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(read('docs/js/strings.es.js'), context);
vm.runInContext(read('docs/js/strings.en.js'), context);
vm.runInContext(read('docs/js/accessibility.js'), context);

const app = context.window.ListenToEarth;
const spanish = app.text;
const english = context.window.ListenToEarthEnglish;
const keys = [
  'audioKeyboardHelp', 'helpTitle', 'helpClose', 'helpExperience', 'helpGesture',
  'helpPlaybackKeys', 'helpExploreKeys', 'helpAerosolKeys', 'helpNavigationKeys',
  'announceCurrentStatus', 'helpImageLoading', 'helpImageNotReady',
  'helpImageReady', 'helpSelection', 'helpAudioOffStatus',
  'helpAudioMutedStatus', 'helpAudioPlayingStatus', 'helpAudioPausedStatus',
  'helpAudioEndedStatus', 'helpAudioStoppedStatus', 'helpAudioActiveStatus',
  'helpStepStatus', 'helpCellStatus', 'helpPointStatus', 'helpNoPosition',
  'helpNoSample'
];
for (const key of keys) {
  assert.equal(typeof spanish[key], 'string', `Falta ${key} en español`);
  assert.equal(typeof english[key], 'string', `Falta ${key} en inglés`);
  assert.ok(spanish[key].trim() && english[key].trim(), `${key} no puede estar vacío`);
}

let activeElement = null;
class FakeElement {
  constructor(tag, parent = null) {
    this.tag = tag;
    this.parent = parent;
    this.attributes = {};
    this.listeners = {};
    this.textContent = '';
  }
  addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); }
  dispatch(type) { for (const callback of this.listeners[type] || []) callback({ target: this }); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  focus() { activeElement = this; }
  closest(selector) {
    for (let node = this; node; node = node.parent) {
      if (selector === 'dialog[open]' && node.tag === 'dialog' && 'open' in node.attributes) return node;
    }
    return null;
  }
}
class FakeDialog extends FakeElement {
  constructor() { super('dialog'); }
  showModal() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); this.dispatch('close'); }
}

const dialog = new FakeDialog();
const openButton = new FakeElement('button');
const closeButton = new FakeElement('button', dialog);
const title = new FakeElement('h2', dialog);
const experienceNode = new FakeElement('p', dialog);
app.setupAudioKeyboardHelp({
  dialog, openButton, closeButton, title, experienceNode,
  experienceName: 'Viaje del polvo'
});

openButton.dispatch('click');
assert.ok('open' in dialog.attributes, 'El diálogo debe abrirse');
assert.equal(activeElement, title, 'El título debe recibir el foco al abrir');
assert.equal(experienceNode.textContent, 'Experiencia actual: Viaje del polvo.');
assert.equal(app.shouldIgnoreGlobalShortcut({ target: closeButton }), true);
assert.equal(app.shouldIgnoreGlobalShortcut({ target: openButton }), false);

// Si el diálogo está abierto, ninguno de los atajos globales debe llegar a
// su acción. Escape queda disponible para el comportamiento nativo de dialog.
const shortcuts = ['Escape', 'p', 's', 'm', 'r', '4', '5', '6', '7', '8'];
let shortcutActions = 0;
for (const key of shortcuts) {
  const event = { key, target: closeButton };
  if (!app.shouldIgnoreGlobalShortcut(event)) shortcutActions++;
}
assert.equal(shortcutActions, 0, 'Los atajos no deben atravesar el diálogo');

// Simula el cierre nativo mediante Escape: el navegador cierra el diálogo y
// emite close; la aplicación devuelve el foco al botón que lo abrió.
dialog.close();
assert.equal(activeElement, openButton, 'El foco debe volver al botón de ayuda');
closeButton.dispatch('click'); // Cerrar de nuevo debe ser inocuo.

function useLanguage(text) {
  app.text = text;
  app.format = (key, values = {}) => app.text[key]
    .replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}
function status(text, overrides = {}) {
  useLanguage(text);
  const state = {
    experience: text === spanish ? 'Viaje del polvo' : 'Dust journey',
    image: 'notReady', position: '', selection: text.dust,
    playback: 'off', sample: '', ...overrides
  };
  const before = JSON.stringify(state);
  const result = app.buildAccessibilityStatus(state);
  assert.equal(JSON.stringify(state), before, 'El resumen no debe modificar el estado');
  return result;
}

assert.match(status(spanish), /imagen aún no está lista/i);
assert.match(status(spanish, { image: 'loading' }), /imagen se está cargando/i);
assert.match(status(spanish, {
  image: 'ready', position: 'Paso 12 de 60.', playback: 'playing',
  sample: 'Polvo: intensidad 0,420; cobertura 60 %. Evidencia suficiente.'
}), /Paso 12 de 60.*intensidad 0,420.*cobertura 60 %/i);
assert.match(status(spanish, { playback: 'paused' }), /recorrido está en pausa/i);
assert.match(status(spanish, { playback: 'ended' }), /recorrido terminó/i);
assert.match(status(spanish, { playback: 'stopped' }), /reproducción está detenida/i);
assert.match(status(spanish, { playback: 'muted' }), /audio está silenciado/i);
assert.match(status(spanish, { position: 'Posición actual: fila 3, columna 4.' }), /fila 3, columna 4/i);
assert.match(status(spanish, { position: spanish.helpPointStatus }), /República Dominicana/i);
assert.match(status(spanish, { sample: 'Sin sonido: no hay evidencia cromática suficiente.' }), /Sin sonido/i);
assert.match(status(english, {
  image: 'ready', position: 'Step 4 of 30.', playback: 'active',
  sample: 'Dust: intensity 0.300; coverage 40%.'
}), /Step 4 of 30.*intensity 0.300.*coverage 40%/i);

const shell = read('docs/js/experience-shell.js');
const appSource = read('docs/js/app.js');
assert.equal((shell.match(/aria-live=/g) || []).length, 1, 'Debe existir una sola región aria-live');
for (const id of ['status', 'audio-keyboard-help', 'audio-keyboard-dialog',
  'audio-keyboard-title', 'audio-keyboard-close', 'announce-current-status']) {
  assert.ok(shell.includes(`id="${id}"`), `Falta #${id}`);
}
assert.ok(shell.includes('aria-haspopup="dialog"'));
const guard = appSource.indexOf('app.shouldIgnoreGlobalShortcut?.(event)');
const escape = appSource.indexOf("event.key === 'Escape'");
assert.ok(guard >= 0 && guard < escape, 'El bloqueo del diálogo debe preceder a los atajos');

for (const page of ['viaje-del-polvo.html', 'planeta-completo.html', 'exploracion-manual.html']) {
  const html = read(`docs/${page}`);
  assert.ok(html.includes('js/accessibility.js'), `${page} debe cargar accessibility.js`);
  assert.ok(html.indexOf('js/accessibility.js') < html.indexOf('js/app.js'),
    `${page} debe cargar accessibility.js antes de app.js`);
}

console.log('PASS: ayuda ES/EN, diálogo y foco, bloqueo de Escape/P/S/M/R/4–8, estado sin audio y una sola región viva.');
