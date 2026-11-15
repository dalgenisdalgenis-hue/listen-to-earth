'use strict';

(() => {
  const app = window.ListenToEarth;
  const keys = Object.keys(app.config.aerosols);
  // La quinta base es fondo neutro silencioso. No se expone como aerosol ni
  // tiene instrumento: evita explicar hielo, gris y brillo como contaminantes.
  const columns = [...keys.map(key => app.config.aerosols[key]), app.config.neutralColor];
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);

  function solvePassive(passive, target, gram) {
    const indices = passive.map((_, i) => i).filter(i => passive[i]);
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
    const result = Array(passive.length).fill(0);
    for (let row = n - 1; row >= 0; row--) {
      let value = matrix[row][n];
      for (let j = row + 1; j < n; j++) value -= matrix[row][j] * result[indices[j]];
      result[indices[row]] = value / matrix[row][row];
    }
    return result;
  }

  function solve(rgb, excluded = -1) {
    const bases = columns.filter((_, i) => i !== excluded);
    const gram = bases.map(a => bases.map(b => dot(a, b)));
    const target = bases.map(column => dot(column, rgb));
    const passive = Array(bases.length).fill(false);
    let weights = Array(bases.length).fill(0);
    let iterations = 0;
    for (;;) {
      const dual = target.map((value, i) => value - dot(gram[i], weights));
      let candidate = -1;
      let best = 1e-9;
      for (let i = 0; i < bases.length; i++) {
        if (!passive[i] && dual[i] > best) {
          candidate = i;
          best = dual[i];
        }
      }
      if (candidate === -1) break;
      passive[candidate] = true;

      for (;;) {
        if (++iterations > 64) throw new Error('solverError');
        const proposed = solvePassive(passive, target, gram);
        const blocked = passive.map((_, i) => i)
          .filter(i => passive[i] && proposed[i] <= 0);
        if (blocked.length === 0) {
          weights = proposed;
          break;
        }
        const alpha = Math.min(...blocked.map(i => weights[i] / (weights[i] - proposed[i])));
        weights = weights.map((value, i) => value + alpha * (proposed[i] - value));
        for (let i = 0; i < bases.length; i++) {
          if (passive[i] && weights[i] <= 1e-12) {
            weights[i] = 0;
            passive[i] = false;
          }
        }
      }
    }

    const rebuilt = [0, 1, 2].map(channel =>
      bases.reduce((sum, column, i) => sum + column[channel] * weights[i], 0));
    const difference = rgb.map((value, i) => value - rebuilt[i]);
    return {
      weights,
      residual: Math.hypot(...difference) / Math.max(Math.hypot(...rgb), 1e-9)
    };
  }

  app.canPlay = (weight, residual, evidence) =>
    weight >= app.config.minWeight && residual <= app.config.maxResidual &&
    evidence >= app.config.minEvidence;

  app.decompose = function (rgb) {
    if (rgb.length !== 3 || rgb.some(value => !Number.isFinite(value) || value < 0)) {
      throw new Error('sampleError');
    }
    // Además del ajuste completo, retiramos una base por vez. La diferencia
    // de residuo mide si ese aerosol aporta evidencia cromática propia.
    const complete = solve(rgb);
    const aerosolWeights = complete.weights.slice(0, keys.length);
    const evidenceValues = keys.map((_, i) =>
      Math.max(0, solve(rgb, i).residual - complete.residual));
    const eligible = keys.filter((key, i) =>
      app.canPlay(aerosolWeights[i], complete.residual, evidenceValues[i]));
    const dominant = eligible.reduce((bestKey, key) =>
      bestKey === null || aerosolWeights[keys.indexOf(key)] > aerosolWeights[keys.indexOf(bestKey)] ? key : bestKey, null);

    return {
      weights: Object.fromEntries(keys.map((key, i) => [key, aerosolWeights[i]])),
      evidence: Object.fromEntries(keys.map((key, i) => [key, evidenceValues[i]])),
      neutralWeight: complete.weights[keys.length],
      residual: complete.residual,
      eligible,
      dominant
    };
  };
})();
