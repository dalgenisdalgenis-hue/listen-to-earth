'use strict';
// Reloj y activación simulados: prueba la máquina de estados, no Web Audio.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = { window: {} };
vm.createContext(context);
for (const file of ['strings.es.js', 'config.js', 'scan.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/js', file), 'utf8'), context);
}
const app = context.window.ListenToEarth;
class Clock {
  time = 0; id = 0; jobs = new Map();
  now = () => this.time;
  setTimeout = (callback, delay) => {
    const id = ++this.id;
    this.jobs.set(id, { callback, at: this.time + delay });
    return id;
  };
  clearTimeout = id => this.jobs.delete(id);
  advance(ms) {
    const target = this.time + ms;
    let guard = 1000;
    for (;;) {
      const next = [...this.jobs.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > target) break;
      assert.ok(--guard > 0, 'Bucle de temporizadores');
      this.time = next[1].at;
      this.jobs.delete(next[0]);
      next[1].callback();
    }
    this.time = target;
  }
  late(ms) {
    this.time += ms;
    const first = [...this.jobs.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (first && first[1].at <= this.time) {
      this.jobs.delete(first[0]); first[1].callback();
    }
  }
}
const profile = mode => Array.from({ length: 30 }, (_, index) => ({ index, mode }));
function setup(startAudio = async () => {}, customStep) {
  const clock = new Clock(), notes = [], states = [], errors = [];
  let silences = 0;
  const scanner = app.createScanner(profile('journey'), {
    clock, startAudio, onStep: step => {
      if (customStep) customStep(step);
      notes.push([step.index, clock.time]);
    },
    onState: state => states.push(state), onError: error => errors.push(error),
    onSilence: () => { silences++; }
  });
  return { scanner, clock, notes, states, errors, silences: () => silences };
}
(async () => {
  let s = setup();
  assert.equal(s.notes.length, 0); assert.equal(s.clock.jobs.size, 0);
  await s.scanner.play();
  assert.deepEqual(s.notes, [[0, 0]]);
  s.clock.advance(14999);
  assert.equal(s.notes.length, 30); assert.equal(s.scanner.snapshot.state, 'playing');
  s.clock.advance(1);
  assert.equal(s.scanner.snapshot.state, 'ended');
  assert.equal(s.silences(), 1); // La textura sostenida recibe orden de apagarse al final.
  assert.deepEqual(s.notes.map(x => x[0]), Array.from({ length: 30 }, (_, i) => i));
  assert.equal(s.notes.at(-1)[1], 14500); assert.equal(s.clock.time, 15000);
  await s.scanner.play(); assert.equal(s.notes.at(-1)[0], 0);

  s = setup(); await s.scanner.play(); s.clock.advance(200); s.scanner.pause();
  s.clock.advance(5000); assert.equal(s.notes.length, 1);
  await s.scanner.play(); s.clock.advance(299); assert.equal(s.notes.length, 1);
  s.clock.advance(1); assert.equal(s.notes.at(-1)[0], 1);
  s.scanner.stop(); const length = s.notes.length;
  s.clock.advance(5000); assert.equal(s.notes.length, length);
  await s.scanner.repeat(); assert.equal(s.notes.at(-1)[0], 0);
  assert.equal(s.clock.jobs.size, 1);

  s = setup(); await s.scanner.play(); s.clock.advance(200); s.scanner.setTempo(50);
  s.clock.advance(599); assert.equal(s.notes.length, 1);
  s.clock.advance(1); assert.equal(s.notes.at(-1)[1], 800);
  s.scanner.pause(); s.scanner.setTempo(100); await s.scanner.play();
  s.clock.advance(500); assert.equal(s.notes.at(-1)[0], 2);
  s.scanner.setTempo(999); assert.equal(s.scanner.snapshot.tempo, 150);
  s.scanner.setTempo(-1); assert.equal(s.scanner.snapshot.tempo, 50);
  s.scanner.setTempo(NaN); assert.equal(s.scanner.snapshot.tempo, 50);

  s = setup(); await s.scanner.play(); s.clock.late(5000);
  assert.equal(s.notes.length, 2); assert.equal(s.notes[1][1], 5000);
  s.clock.advance(499); assert.equal(s.notes.length, 2);
  s.clock.advance(1); assert.equal(s.notes.length, 3);
  s.scanner.setProfile(profile('world'));
  assert.equal(s.scanner.snapshot.state, 'idle'); assert.equal(s.scanner.snapshot.nextIndex, 0);
  assert.equal(s.scanner.snapshot.mode, 'world'); assert.equal(s.clock.jobs.size, 0);

  let resolve;
  s = setup(() => new Promise(done => { resolve = done; }));
  const pending = s.scanner.play(); assert.equal(s.scanner.snapshot.state, 'starting');
  s.scanner.stop(); resolve(); await pending;
  assert.equal(s.notes.length, 0); assert.equal(s.scanner.snapshot.state, 'idle');
  assert.equal(s.clock.jobs.size, 0);

  s = setup(() => new Promise(done => { resolve = done; }));
  const old = s.scanner.play(); s.scanner.setProfile(profile('world')); resolve(); await old;
  assert.equal(s.notes.length, 0); assert.equal(s.scanner.snapshot.mode, 'world');

  s = setup(async () => { throw Error('Audio bloqueado'); });
  await s.scanner.play(); assert.equal(s.errors.length, 1);
  assert.equal(s.scanner.snapshot.state, 'idle'); assert.equal(s.notes.length, 0);

  let fail = true;
  s = setup(undefined, step => { if (step.index === 2 && fail) throw Error('Contexto suspendido'); });
  await s.scanner.play(); s.clock.advance(1000);
  assert.equal(s.scanner.snapshot.state, 'paused'); assert.equal(s.scanner.snapshot.nextIndex, 2);
  assert.equal(s.errors.length, 1);
  fail = false; await s.scanner.play(); s.clock.advance(0);
  assert.deepEqual(s.notes.map(x => x[0]), [0, 1, 2]);
  console.log('PASS: barrido con reloj simulado: 30 pasos/15 s, pausa/reanudación, detener/repetir, tempo, retrasos, cambio de modo, cancelación de arranque y errores.');
})().catch(error => { console.error(error); process.exitCode = 1; });
