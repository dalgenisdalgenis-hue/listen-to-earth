'use strict';

// Comprueba que español e inglés describen exactamente la misma interfaz.
// Usa solo módulos incluidos con Node; no forma parte de la web publicada.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const docs = path.join(root, 'docs');

function loadDictionary(file, property) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(docs, 'js', file), 'utf8'), context);
  return property.split('.').reduce((value, key) => value[key], context.window);
}

function placeholders(value) {
  return [...String(value).matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
}

const spanish = loadDictionary('strings.es.js', 'ListenToEarth.text');
const english = loadDictionary('strings.en.js', 'ListenToEarthEnglish');
const spanishKeys = Object.keys(spanish).sort();
const englishKeys = Object.keys(english).sort();

assert.deepEqual(englishKeys, spanishKeys, 'Los diccionarios ES y EN no tienen las mismas claves');
for (const key of spanishKeys) {
  assert.ok(String(spanish[key]).trim(), `Texto español vacío: ${key}`);
  assert.ok(String(english[key]).trim(), `Texto inglés vacío: ${key}`);
  assert.deepEqual(
    placeholders(english[key]),
    placeholders(spanish[key]),
    `Marcadores distintos en la clave ${key}`
  );
}

const pages = fs.readdirSync(docs).filter(file => file.endsWith('.html')).sort();
for (const file of pages) {
  const source = fs.readFileSync(path.join(docs, file), 'utf8');
  const referencedKeys = [...source.matchAll(/data-(?:text|alt|label|page-title|meta-description)="([^"]+)"/g)]
    .map(match => match[1]);
  for (const key of referencedKeys) {
    assert.ok(key in spanish, `${file} usa una clave ES inexistente: ${key}`);
    assert.ok(key in english, `${file} usa una clave EN inexistente: ${key}`);
  }

  // escuchar.html solo conserva y redirige enlaces antiguos; las páginas
  // visibles cargan ambos diccionarios antes del traductor.
  if (file === 'escuchar.html') continue;
  const esPosition = source.indexOf('js/strings.es.js');
  const enPosition = source.indexOf('js/strings.en.js');
  const i18nPosition = source.indexOf('js/i18n.js');
  assert.ok(esPosition >= 0, `${file} no carga strings.es.js`);
  assert.ok(enPosition > esPosition, `${file} no carga inglés después de español`);
  assert.ok(i18nPosition > enPosition, `${file} no carga i18n.js después de los diccionarios`);
}

const shell = fs.readFileSync(path.join(docs, 'js', 'experience-shell.js'), 'utf8');
for (const match of shell.matchAll(/data-(?:text|alt|label)="([^"]+)"/g)) {
  assert.ok(match[1] in spanish, `La plantilla usa una clave ES inexistente: ${match[1]}`);
  assert.ok(match[1] in english, `La plantilla usa una clave EN inexistente: ${match[1]}`);
}

console.log(`PASS: ${spanishKeys.length} textos equivalentes en ES/EN y ${pages.length - 1} páginas bilingües verificadas.`);
