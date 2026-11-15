'use strict';

(() => {
  const app = window.ListenToEarth;
  app.config = {
    width: 1920,
    height: 1080,
    source: 'assets/aerosols_5669_1920x1080.png',
    pointWindow: 3,
    scanWidth: 9,
    minWeight: 0.05,
    maxResidual: 0.10,
    rows: 8,
    cols: 12,
    // Punto fijado por el equipo para la consulta puntual de RD. No se
    // recalcula desde una ciudad ni se sustituye por el centro de una celda.
    dominicanRepublic: { x: 587, y: 429, lat: 18.47, lon: -69.94 },
    instrumentOrder: ['dust', 'blackCarbon', 'sulfate', 'seaSalt'],
    aerosolShortcuts: { '4': 'dust', '5': 'blackCarbon', '6': 'sulfate', '7': 'seaSalt' },
    scan: {
      steps: 30,
      stepMs: 500,
      minTempo: 50,
      maxTempo: 150,
      tempoStep: 10,
      modes: {
        journey: { east: 20, west: -69.9, south: 12, north: 22 },
        world: { east: 180, west: -180, south: -90, north: 90 }
      }
    },
    scaleMode: 'major', // Provisional: el equipo debe escucharla con datos reales.
    scales: {
      major: [196.00, 220.00, 246.94, 293.67, 329.63,
        392.00, 440.01, 493.89, 587.34, 659.26,
        784.00, 880.01, 987.78, 1174.67, 1318.53],
      minor: [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27, 29, 31, 34]
        .map(semitones => 196 * 2 ** (semitones / 12))
    },
    // Este orden es el mismo que el de las columnas M del script Python.
    aerosols: {
      blackCarbon: [210, 94, 69],
      dust: [193, 154, 220],
      seaSalt: [133, 170, 169],
      sulfate: [83, 220, 52]
    },
    checks: [
      { id: 'sahara', lat: 22, lon: 5, expected: 'dust' },
      { id: 'india', lat: 25, lon: 78, expected: 'sulfate' },
      { id: 'africa', lat: -10, lon: 22, expected: 'blackCarbon' },
      { id: 'pacific', lat: -45, lon: -130, expected: null }
    ]
  };
})();
