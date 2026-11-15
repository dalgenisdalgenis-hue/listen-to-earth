#!/usr/bin/env python3
"""Comprueba sintaxis, rutas y etiquetas; no sustituye una prueba de navegador."""
from pathlib import Path
from html.parser import HTMLParser
import json
import re
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
        resource = a.get('src') or (a.get('href') if tag in {'link', 'a'} else None)
        if resource:
            local = resource.split('#', 1)[0].split('?', 1)[0]
            if local and not local.startswith(('#', '//')) and '://' not in local and not local.startswith(('mailto:', 'tel:')):
                assert (ROOT / 'docs' / local).is_file(), f'Recurso ausente: {resource}'


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
    shell_source = (ROOT / 'docs/js/experience-shell.js').read_text()
    match = re.search(r"insertAdjacentHTML\('afterbegin', `([\s\S]*?)`\);", shell_source)
    assert match, 'No se encontró la plantilla HTML de las experiencias'
    shell = Document()
    shell.feed(match.group(1))
    assert all(key in strings for key in shell.keys), 'Falta una clave de texto en la plantilla de experiencias'
    assert all(ref in shell.ids for ref in shell.references), 'Referencia ARIA/label sin destino en la plantilla de experiencias'
    print('PASS: sintaxis JS, recursos locales, IDs, referencias ARIA y claves de texto del HTML.')


if __name__ == '__main__':
    main()
