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
