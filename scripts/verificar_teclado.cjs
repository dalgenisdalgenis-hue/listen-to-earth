'use strict';
// DOM simulado: se ejercitan los handlers reales, no un navegador ni NVDA.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const document = { activeElement: null };
class Element {
  constructor() { this.children = []; this.attributes = {}; this.dataset = {}; this.listeners = {}; this.tabIndex = -1; }
  setAttribute(key, value) { this.attributes[key] = value; }
  append(node) { node.parent = this; this.children.push(node); }
  replaceChildren() { this.children = []; }
  addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); }
  removeEventListener(type, callback) { this.listeners[type] = this.listeners[type].filter(fn => fn !== callback); }
  closest() { return this.attributes.role === 'gridcell' ? this : this.parent?.closest(); }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  dispatch(type, input = {}) {
    const event = { target: this, prevented: false, preventDefault() { this.prevented = true; }, ...input };
    for (let node = this; node; node = node.parent) {
      for (const fn of node.listeners[type] || []) fn(event);
    }
    return event;
  }
  focus() { document.activeElement = this; this.dispatch('focusin'); }
}
const ids = Object.fromEntries(['grid', 'up', 'down', 'left', 'right', 'replay'].map(id => [id, new Element()]));
document.getElementById = id => ids[id];
document.createElement = () => new Element();
const context = { window: {}, document };
vm.createContext(context);
for (const file of ['strings.es.js', 'config.js', 'grid.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/js', file), 'utf8'), context);
}
const app = context.window.ListenToEarth;
const cells = Array.from({ length: 96 }, (_, i) => ({ row: Math.floor(i / 12), col: i % 12, label: 'celda ' + i }));
const selected = [], notices = [];
const controller = app.mountGrid(cells, (...args) => selected.push(args), message => notices.push(message));
const nodes = ids.grid.children.flatMap(row => row.children);
function currentIndex() { return nodes.findIndex(node => node.tabIndex === 0); }
function oneTabStop() { assert.equal(nodes.filter(node => node.tabIndex === 0).length, 1); }
oneTabStop(); assert.equal(currentIndex(), 0);
nodes[0].focus();
nodes[0].dispatch('keydown', { key: 'ArrowRight' });
assert.equal(currentIndex(), 1); assert.equal(document.activeElement, nodes[1]); oneTabStop();
assert.equal(selected.at(-1)[1], false); assert.equal(selected.at(-1)[2], true);
nodes[1].dispatch('keydown', { key: 'Enter' });
assert.equal(selected.at(-1)[0].col, 1); assert.equal(selected.at(-1)[1], true);
assert.equal(nodes[1].dispatch('keydown', { key: 'Tab' }).prevented, false);
nodes[1].dispatch('keydown', { key: 'ArrowLeft' });
nodes[0].dispatch('keydown', { key: 'ArrowLeft' });
assert.equal(currentIndex(), 0); assert.equal(notices.length, 1);
ids.down.focus(); ids.down.dispatch('click');
assert.equal(currentIndex(), 12); assert.equal(document.activeElement, ids.down); oneTabStop();
ids.replay.dispatch('click'); assert.equal(selected.at(-1)[0].row, 1);
nodes[95].focus(); assert.equal(currentIndex(), 95); oneTabStop();
const count = selected.length;
controller.destroy(); nodes[95].dispatch('keydown', { key: 'ArrowLeft' });
assert.equal(selected.length, count);
console.log('PASS: controlador de cuadrícula simulado: foco móvil único, flechas, Enter, Tab sin capturar, bordes, botones alternativos y limpieza de listeners.');
