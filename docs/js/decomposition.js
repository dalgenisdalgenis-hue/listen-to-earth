'use strict';

(() => {
  const app = window.ListenToEarth;
  const keys = Object.keys(app.config.aerosols);
  const columns = keys.map(key => app.config.aerosols[key]);
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  // Gram = MᵀM se calcula una vez; cada muestra solo cambia Mᵀp.
  const gram = columns.map(a => columns.map(b => dot(a, b)));

  function solvePassive(passive, target) {
    const indices = keys.map((_, i) => i).filter(i => passive[i]);
    const matrix = indices.map(i => [...indices.map(j => gram[i][j]), target[i]]);
    const n = indices.length;
    // Mínimos cuadrados sobre las columnas activas. La matriz es pequeña:
    // eliminación con pivoteo y sustitución hacia atrás, sin dependencias.
    for (let column = 0; column < n; column++) {
      let pivot = column;
      for (let row = column + 1; row < n; row++) {
        if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
      }
      [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
      if (Math.abs(matrix[column][column]) < 1e-10) throw new Error('solverError');
      for (let row = column + 1; row < n; row++) {
        const factor = matrix[row][column] / matrix[column][column];
        for (let j = column; j <= n; j++) matrix[row][j] -= factor * matrix[column][j];
      }
    }
    const result = [0, 0, 0, 0];
    for (let row = n - 1; row >= 0; row--) {
      let value = matrix[row][n];
      for (let j = row + 1; j < n; j++) value -= matrix[row][j] * result[indices[j]];
      result[indices[row]] = value / matrix[row][row];
    }
    return result;
  }

  app.canPlay = (weight, residual) =>
    weight >= app.config.minWeight && residual <= app.config.maxResidual;

  app.decompose = function (rgb) {
    if (rgb.length !== 3 || rgb.some(value => !Number.isFinite(value) || value < 0)) {
      throw new Error('sampleError');
    }
    const target = columns.map(column => dot(column, rgb));
    const passive = [false, false, false, false];
    let weights = [0, 0, 0, 0];
    let iterations = 0;

    // NNLS por conjunto activo (Lawson–Hanson). Empezamos en cero y
    // añadimos la columna que más reduce el error, sin elegir un único color.
    for (;;) {
      const dual = target.map((value, i) => value - dot(gram[i], weights));
      let candidate = -1;
      let best = 1e-9; // Tolerancia numérica; no es el umbral sonoro.
      for (let i = 0; i < keys.length; i++) {
        if (!passive[i] && dual[i] > best) {
          candidate = i;
          best = dual[i];
        }
      }
      if (candidate === -1) break;
      passive[candidate] = true;

      for (;;) {
        if (++iterations > 64) throw new Error('solverError');
        const proposed = solvePassive(passive, target);
        const blocked = keys.map((_, i) => i).filter(i => passive[i] && proposed[i] <= 0);
        if (blocked.length === 0) {
          weights = proposed;
          break;
        }
        // Avanzamos hasta el primer peso que llega a cero. No permitimos
        // pesos negativos ni normalizamos los pesos para que sumen uno.
        const alpha = Math.min(...blocked.map(i => weights[i] / (weights[i] - proposed[i])));
        weights = weights.map((value, i) => value + alpha * (proposed[i] - value));
        for (let i = 0; i < keys.length; i++) {
          if (passive[i] && weights[i] <= 1e-12) {
            weights[i] = 0;
            passive[i] = false;
          }
        }
      }
    }

    const rebuilt = [0, 1, 2].map(channel =>
      columns.reduce((sum, column, i) => sum + column[channel] * weights[i], 0));
    const difference = rgb.map((value, i) => value - rebuilt[i]);
    const residual = Math.hypot(...difference) / Math.max(Math.hypot(...rgb), 1e-9);
    const eligible = keys.filter((key, i) => app.canPlay(weights[i], residual));
    const dominant = eligible.reduce((bestKey, key) =>
      bestKey === null || weights[keys.indexOf(key)] > weights[keys.indexOf(bestKey)] ? key : bestKey, null);

    return {
      weights: Object.fromEntries(keys.map((key, i) => [key, weights[i]])),
      residual,
      eligible,
      dominant
    };
  };
})();
