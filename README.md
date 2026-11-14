# Listen to Earth

*The planet has a voice. Everyone deserves to hear it.*

Aplicación web que convierte visualizaciones científicas de la NASA en música y sonido explorable por cualquier persona, vea o no vea. Proyecto del Liceo Científico Dr. Miguel Canela Lázaro para el **NASA Space Apps Challenge 2026** — reto *The Earth Information Jukebox*.

- **Propuesta completa:** [PROJECT_BRIEF.md](PROJECT_BRIEF.md)
- **Fuentes NASA y créditos:** [SOURCES.md](SOURCES.md)
- **Uso de IA:** [AI_USAGE.md](AI_USAGE.md)

## Estructura

```
docs/            Lo que se publica en GitHub Pages
  index.html     Página principal
  css/  js/      Estilos y módulos
  data/          JSON generados por los scripts
  assets/        Imágenes optimizadas
  vendor/        Tone.js (versión fija) y su licencia
scripts/         Preparación de datos con Python (Pillow + NumPy)
work/raw/        Originales NASA descargados (excluidos de Git)
```

## Ejecutar en local

```bash
python -m http.server 8000 --bind 127.0.0.1 --directory docs
```

Abrir `http://127.0.0.1:8000`. (Según el equipo: `python3` o `py`.)

## Preparación de datos

```bash
pip install -r requirements.txt
# los scripts se añaden durante el evento; leen work/raw/ y escriben docs/data/
```

## Publicación

GitHub Pages: **Settings → Pages → Deploy from a branch → `main` → `/docs`**.

## Licencia

Código original bajo Apache-2.0 (ver `LICENSE`). Visualizaciones: cortesía de NASA's Scientific Visualization Studio — ver créditos en [SOURCES.md](SOURCES.md).
