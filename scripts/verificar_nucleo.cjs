'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
for (const file of ['strings.es.js', 'config.js', 'image-data.js', 'decomposition.js', 'audio.js', 'grid.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'docs/js', file), 'utf8'), context);
}
const app = context.window.ListenToEarth;
const folder = process.argv[2];
if (!folder) throw new Error('Ejecuta python scripts/verificar_imagen.py');
const image = { width: 1920, height: 1080, data: fs.readFileSync(path.join(folder, 'image.rgba')) };
const fixtures = JSON.parse(fs.readFileSync(path.join(folder, 'fixtures.json')));
const keys = Object.keys(app.config.aerosols);
let maxError = 0;
for (const fixture of fixtures) {
  let rgb = fixture.rgb;
  if (fixture.point) rgb = app.readPoint(image, ...fixture.point);
  else if (fixture.lon !== undefined) {
    const { x } = app.pixelFromCoordinates(0, fixture.lon);
    const north = app.pixelFromCoordinates(22, fixture.lon).y;
    const south = app.pixelFromCoordinates(12, fixture.lon).y;
    rgb = app.readRegion(image, x - 4, north, x + 5, south);
  }
  rgb.forEach((value, i) => assert.ok(Math.abs(value - fixture.rgb[i]) < 1e-12, fixture.name + ' RGB'));
  const result = app.decompose(rgb);
  keys.forEach((key, i) => {
    const difference = Math.abs(result.weights[key] - fixture.weights[i]);
    maxError = Math.max(maxError, difference);
    assert.ok(difference < 1e-7, fixture.name + ' ' + key);
    assert.ok(result.weights[key] >= 0);
  });
  assert.ok(Math.abs(result.residual - fixture.residual) < 1e-10, fixture.name + ' residuo');
  const check = app.config.checks.find(check => check.id === fixture.name);
  if (check) assert.equal(result.dominant, check.expected);
}
assert.equal(app.canPlay(.05, .1), true);
assert.equal(app.canPlay(.049999, .01), false);
assert.equal(app.canPlay(.8, .100001), false);
assert.equal(app.noteFromIntensity(.049999), null);
assert.equal(app.noteFromIntensity(.05), 0);
assert.equal(app.noteFromIntensity(1), 14);
assert.equal(app.noteFromIntensity(2), 14);
assert.equal(app.soundFor({ weights: { dust: .8 }, residual: .2 }).hz, null);
assert.equal(app.soundFor({ weights: { dust: 1 }, residual: 0 }).hz, 1318.53);
const cells = app.createGridCells(image);
assert.equal(cells.length, 96);
for (const cell of cells) {
  const fixture = fixtures.find(f => f.name === `grid-${cell.row}-${cell.col}`);
  assert.deepEqual([cell.x, cell.y], fixture.point);
  assert.ok(!cell.description.includes('undefined'));
}
for (const [row, col, dr, dc, expected] of [
  [0, 0, -1, 0, [0, 0]], [0, 0, 0, -1, [0, 0]],
  [7, 11, 1, 0, [7, 11]], [7, 11, 0, 1, [7, 11]],
  [3, 4, -1, 0, [2, 4]], [3, 4, 0, 1, [3, 5]]
]) {
  const next = app.gridPosition(row, col, dr, dc);
  assert.deepEqual([next.row, next.col], expected);
}
console.log(`PASS: ${fixtures.length} muestras JS/SciPy; diferencia máxima de peso ${maxError}.`);
console.log('PASS: 96 centros de celda, límites de movimiento, guardas y mapeo lineal a notas.');
