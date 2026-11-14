'use strict';

(() => {
  const app = window.ListenToEarth;
  const config = app.config;

  app.loadImageData = async function (canvas) {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('loadError'));
      image.src = config.source;
    });
    if (image.naturalWidth !== config.width || image.naturalHeight !== config.height) {
      throw new Error('sizeError');
    }
    try {
      // CSS solo cambia la presentación. La lectura conserva 1920 × 1080.
      canvas.width = config.width;
      canvas.height = config.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('canvasError');
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, config.width, config.height);
    } catch {
      throw new Error('canvasError');
    }
  };

  // Python round() resuelve los empates hacia el entero par.
  // Math.round() no lo hace: igualamos el script para no cambiar de píxel.
  function roundEven(value) {
    const lower = Math.floor(value);
    if (value - lower === 0.5) return lower % 2 === 0 ? lower : lower + 1;
    return Math.round(value);
  }

  app.pixelFromCoordinates = (lat, lon) => ({
    x: roundEven((lon + 180) / 360 * config.width),
    y: roundEven((90 - lat) / 180 * config.height)
  });

  app.readRegion = function (image, x0, y0, x1, y1) {
    // Límites superiores exclusivos, como los slices de NumPy.
    x0 = Math.max(0, x0); y0 = Math.max(0, y0);
    x1 = Math.min(image.width, x1); y1 = Math.min(image.height, y1);
    if (x1 <= x0 || y1 <= y0) throw new Error('sampleError');
    const sum = [0, 0, 0];
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const offset = (y * image.width + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          sum[channel] += image.data[offset + channel];
        }
      }
    }
    const count = (x1 - x0) * (y1 - y0);
    return sum.map(value => value / count);
  };

  app.readPoint = function (image, x, y) {
    // Promediamos RGB ANTES de descomponer, igual que medir_imagen.py.
    const half = Math.floor(config.pointWindow / 2);
    return app.readRegion(image, x - half, y - half, x + half + 1, y + half + 1);
  };
})();
