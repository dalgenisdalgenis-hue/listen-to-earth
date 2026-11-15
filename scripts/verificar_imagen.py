#!/usr/bin/env python3
"""Compara el núcleo JS con SciPy. Python y Node solo se usan para pruebas."""
from pathlib import Path
import json
import subprocess
import tempfile
from html.parser import HTMLParser
import re
import numpy as np
from PIL import Image
import medir_imagen as m

ROOT = Path(__file__).resolve().parents[1]


class Markup(HTMLParser):
    """Árbol mínimo del HTML real para las pruebas de eventos con DOM simulado."""
    def __init__(self):
        super().__init__()
        self.root = {'tag': '#document', 'attrs': {}, 'children': []}
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = {'tag': tag, 'attrs': dict(attrs), 'children': []}
        self.stack[-1]['children'].append(node)
        if tag not in {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index]['tag'] == tag:
                del self.stack[index:]
                break


def main():
    im = Image.open(ROOT / 'docs/assets/aerosols_5669_1920x1080.png')
    a = np.asarray(im.convert('RGB'), dtype=float)
    fixtures = []
    scan_fixtures = []

    def add(name, rgb, **more):
        w = m.descomponer(rgb)
        fixtures.append(dict(name=name, rgb=np.asarray(rgb).tolist(),
                             weights=w.tolist(), residual=m.residuo(rgb, w), **more))

    for name, lat, lon in [('sahara', 22, 5), ('india', 25, 78),
                           ('africa', -10, 22), ('pacific', -45, -130),
                           ('RD', 18.47, -69.90)]:
        x, y = m.px(lat, lon)
        add(name, m.leer_punto(a, x, y), point=[x, y])
    for mode, east, west, south, north, count, steps in [
        ('journey', 20, -69.9, 12, 22, m.ZONAS_VIAJE, 30),
        ('world', 180, -180, -90, 90, m.ZONAS_MUNDO, 60),
    ]:
        for i, lon in enumerate(np.linspace(east, west, steps)):
            colors = m.leer_paso_barrido_zonas(a, lon, south, north, count)
            summary = m.resumir_zonas(colors)
            scan_fixtures.append({
                'name': f'{mode}-{i+1}', 'mode': mode, 'lon': float(lon),
                'zones': [
                    {'rgb': np.asarray(rgb).tolist(),
                     'weights': weights.tolist(), 'residual': residual}
                    for rgb, (weights, residual) in zip(colors, summary['zones'])
                ],
                'weights': summary['weights'],
                'coverage': summary['coverage'],
                'activeZones': summary['active_zones'],
                'zoneCount': summary['zone_count'],
                'residual': summary['residual'],
            })
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
        (folder / 'scan-fixtures.json').write_text(json.dumps(scan_fixtures))
        (folder / 'image.rgba').write_bytes(im.convert('RGBA').tobytes())
        # Las tres experiencias tienen URL propia y comparten este marcado.
        # Extraemos la plantilla tal como la recibe el navegador antes de app.js.
        shell = (ROOT / 'docs/js/experience-shell.js').read_text()
        match = re.search(r"insertAdjacentHTML\('afterbegin', `([\s\S]*?)`\);", shell)
        assert match, 'No se encontró la plantilla de la experiencia'
        markup = Markup()
        markup.feed('<body data-page-mode="viaje" data-experience="journey">' + match.group(1) + '</body>')
        (folder / 'dom.json').write_text(json.dumps(markup.root))
        subprocess.run(['node', str(ROOT / 'scripts/verificar_nucleo.cjs'), str(folder)],
                       cwd=ROOT, check=True)
        subprocess.run(['node', str(ROOT / 'scripts/verificar_selector.cjs'), str(folder)],
                       cwd=ROOT, check=True)
        subprocess.run(['node', str(ROOT / 'scripts/verificar_eventos.cjs'), str(folder)],
                       cwd=ROOT, check=True)


if __name__ == '__main__':
    main()
