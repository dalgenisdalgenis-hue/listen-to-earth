#!/usr/bin/env python3
"""Comprueba sintaxis, rutas y etiquetas; no sustituye una prueba de navegador."""
from pathlib import Path
from html.parser import HTMLParser
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.references = []
        self.keys = []

    def handle_starttag(self, tag, attributes):
        a = dict(attributes)
        if 'id' in a:
            assert a['id'] not in self.ids, f"ID duplicado: {a['id']}"
            self.ids.add(a['id'])
        for attr in ['aria-labelledby', 'aria-describedby', 'aria-controls', 'for']:
            self.references.extend(a.get(attr, '').split())
        for attr in ['data-text', 'data-alt', 'data-label']:
            if attr in a:
                self.keys.append(a[attr])
        resource = a.get('src') or (a.get('href') if tag == 'link' else None)
        if resource:
            assert (ROOT / 'docs' / resource).is_file(), f'Recurso ausente: {resource}'


def main():
    for script in sorted((ROOT / 'docs/js').glob('*.js')):
        subprocess.run(['node', '--check', str(script)], check=True)
    subprocess.run(['node', '--check', str(ROOT / 'docs/vendor/tone.js')], check=True)
    result = subprocess.run(['node', '-e',
        'global.window={};require("./docs/js/strings.es.js");'
        'console.log(JSON.stringify(window.ListenToEarth.text));'],
        cwd=ROOT, check=True, capture_output=True, text=True)
    strings = json.loads(result.stdout)
    for page in sorted((ROOT / 'docs').glob('*.html')):
        doc = Document()
        doc.feed(page.read_text())
        assert all(key in strings for key in doc.keys), f'Falta un texto en strings.es.js: {page.name}'
        assert all(ref in doc.ids for ref in doc.references), f'Referencia ARIA/label sin destino: {page.name}'
    print('PASS: sintaxis JS, recursos locales, IDs, referencias ARIA y claves de texto del HTML.')


if __name__ == '__main__':
    main()
