'use strict';
// Datos sintéticos solo para casos límite. Con carpeta de fixtures también
// comprueba los datos reales del PNG; no introduce valores en la aplicación.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = { window: {} };
vm.createContext(context);
for (const file of ['strings.es.js', 'config.js', 'selection.js', 'image-data.js', 'decomposition.js', 'audio.js', 'grid.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/js', file), 'utf8'), context);
}
const app = context.window.ListenToEarth;
const order = Array.from(app.config.instrumentOrder);
const basis = Object.keys(app.config.aerosols);
const selection = app.selection;
assert.deepEqual(Array.from(selection.types), ['dust']);
assert.deepEqual(JSON.parse(JSON.stringify(app.config.aerosolShortcuts)), {
  '4': 'dust', '5': 'blackCarbon', '6': 'sulfate', '7': 'seaSalt'
});
const cases = [
  { name: 'iguales', weights: Object.fromEntries(order.map(type => [type, .5])), residual: 0 },
  { name: 'residuo alto', weights: Object.fromEntries(order.map(type => [type, .8])), residual: .100001 },
  { name: 'umbral exacto', weights: Object.fromEntries(order.map(type => [type, .05])), residual: .1 },
  { name: 'bajo umbral', weights: Object.fromEntries(order.map(type => [type, .049999])), residual: 0 },
  { name: 'negro', weights: Object.fromEntries(order.map(type => [type, 0])), residual: 0 }
];
if (process.argv[2]) {
  const fixtures = JSON.parse(fs.readFileSync(path.join(process.argv[2], 'fixtures.json')));
  for (const fixture of fixtures) cases.push({ name: fixture.name,
    weights: Object.fromEntries(basis.map((type, i) => [type, fixture.weights[i]])), residual: fixture.residual });
}
for (const result of cases) {
  const before = JSON.stringify(result);
  const complete = new Map(app.soundPlan(result, order).map(note => [note.type, note]));
  for (let mask = 0; mask < 16; mask++) {
    order.forEach((type, i) => selection.set(type, Boolean(mask & (1 << i))));
    const expected = order.filter((_, i) => mask & (1 << i));
    assert.deepEqual(Array.from(selection.types), expected);
    const plan = app.soundPlan(result);
    assert.deepEqual(Array.from(plan, note => note.type), expected);
    for (const note of plan) {
      assert.equal(note.weight, result.weights[note.type]);
      assert.equal(note.hz, complete.get(note.type).hz);
      assert.equal(note.index, complete.get(note.type).index);
      assert.equal(note.hz === null, result.weights[note.type] < .05 || result.residual > .10);
      if (result.name === 'iguales') { assert.equal(note.index, 7); assert.equal(note.hz, 493.89); }
      if (result.name === 'umbral exacto') { assert.equal(note.index, 0); assert.equal(note.hz, 196); }
    }
    const view = app.describeResult(result);
    assert.ok(!view.quantities.includes('undefined') && !view.outcome.includes('NaN'));
    if (!expected.length) assert.equal(view.outcome, app.text.noSelectionClick);
    assert.equal(JSON.stringify(result), before, 'Cambió un dato al seleccionar');
    selection.toggleAll();
    assert.deepEqual(Array.from(selection.types), mask === 15 ? ['dust'] : order);
  }
}
// La mezcla debe conservar ambos pesos incluso al oír solo uno.
const dust = app.config.aerosols.dust, salt = app.config.aerosols.seaSalt;
const mix = app.decompose(dust.map((value, i) => (value + salt[i]) / 2));
order.forEach(type => selection.set(type, type === 'seaSalt'));
assert.ok(Math.abs(app.soundPlan(mix)[0].weight - .5) < 1e-10);
selection.set('dust', true);
assert.equal(app.soundPlan(mix).filter(note => note.hz !== null).length, 2);
const copy = selection.types; copy.push('fake'); assert.equal(selection.has('fake'), false);
assert.throws(() => selection.set('fake', true), /sampleError/);

if (process.argv[2]) {
  const image = { width: 1920, height: 1080,
    data: fs.readFileSync(path.join(process.argv[2], 'image.rgba')) };
  const cells = app.createGridCells(image);
  const before = JSON.stringify(cells.map(cell => cell.result));
  for (let mask = 0; mask < 16; mask++) {
    order.forEach((type, i) => selection.set(type, Boolean(mask & (1 << i))));
    cells.forEach(cell => {
      app.refreshGridCell(cell);
      assert.ok(!cell.label.includes('undefined'));
      for (const type of selection.types) assert.ok(cell.label.includes(app.text[type]));
    });
    assert.equal(JSON.stringify(cells.map(cell => cell.result)), before);
  }
}
console.log(`PASS: selector, 16 combinaciones × ${cases.length} resultados; mapeo común, mezcla 50/50, datos inmutables, etiquetas y atajos 4–8.`);
