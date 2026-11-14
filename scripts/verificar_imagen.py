#!/usr/bin/env python3
"""Compara el núcleo JS con SciPy. Python y Node solo se usan para pruebas."""
from pathlib import Path
import json
import subprocess
import tempfile
import numpy as np
from PIL import Image
import medir_imagen as m

ROOT = Path(__file__).resolve().parents[1]


def main():
    im = Image.open(ROOT / 'docs/assets/aerosols_5669_1920x1080.png')
    a = np.asarray(im.convert('RGB'), dtype=float)
    fixtures = []

    def add(name, rgb, **more):
        w = m.descomponer(rgb)
        fixtures.append(dict(name=name, rgb=np.asarray(rgb).tolist(),
                             weights=w.tolist(), residual=m.residuo(rgb, w), **more))

    for name, lat, lon in [('sahara', 22, 5), ('india', 25, 78),
                           ('africa', -10, 22), ('pacific', -45, -130),
                           ('RD', 18.47, -69.90)]:
        x, y = m.px(lat, lon)
        add(name, m.leer_punto(a, x, y), point=[x, y])
    for i, lon in enumerate(np.linspace(20, -69.9, 30)):
        add(f'scan-{i+1}', m.leer_paso_barrido(a, lon, 12, 22), lon=float(lon))
    for i, name in enumerate(m.TIPOS):
        add('pure-' + name, m.M[:, i])
    add('dust-salt-half', (m.M[:, 1] + m.M[:, 2]) / 2)
    add('black', [0, 0, 0])
    for x, y in [(0, 0), (1919, 1079), (0, 1079), (1919, 0)]:
        add(f'edge-{x}-{y}', m.leer_punto(a, x, y), point=[x, y])
    rng = np.random.default_rng(2026)
    for i in range(200):
        x, y = int(rng.integers(0, 1920)), int(rng.integers(0, 1080))
        add(f'pixel-{i}', m.leer_punto(a, x, y), point=[x, y])
    for row in range(8):
        for col in range(12):
            x, y = m.px(90 - (row + .5) / 8 * 180, (col + .5) / 12 * 360 - 180)
            add(f'grid-{row}-{col}', m.leer_punto(a, x, y), point=[x, y])

    # Los únicos colores sintéticos son las bases, la mezcla y el negro de
    # esta prueba. No se insertan datos sintéticos en la aplicación.
    with tempfile.TemporaryDirectory(prefix='listen-to-earth-') as tmp:
        folder = Path(tmp)
        (folder / 'fixtures.json').write_text(json.dumps(fixtures))
        (folder / 'image.rgba').write_bytes(im.convert('RGBA').tobytes())
        subprocess.run(['node', str(ROOT / 'scripts/verificar_nucleo.cjs'), str(folder)],
                       cwd=ROOT, check=True)


if __name__ == '__main__':
    main()
