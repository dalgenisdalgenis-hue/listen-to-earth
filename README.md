# Listen to Earth

*The planet has a voice. Everyone deserves to hear it.*

Aplicación web que convierte la visualización oficial de aerosoles de la NASA en música explorable por cualquier persona, vea o no vea. Se escucha el polvo del Sahara cruzando el Atlántico hacia el Caribe, y 45 años de polvo sobre República Dominicana.

Proyecto del Liceo Científico Dr. Miguel Canela Lázaro para el **NASA Space Apps Challenge 2026** — reto *The Earth Information Jukebox*.

- **Brief del proyecto:** [PROJECT_BRIEF.md](PROJECT_BRIEF.md)
- **Fuentes NASA y créditos:** [SOURCES.md](SOURCES.md)
- **Uso de IA:** [AI_USAGE.md](AI_USAGE.md)
- **Detalle técnico de la imagen:** [docs/assets/README.md](docs/assets/README.md)

## Qué se escucha

| Pista | Qué hace |
|---|---|
| **Escucha el aire** | La imagen global de aerosoles convertida en sonido. Un instrumento por tipo (polvo, carbono negro, sulfatos, sal marina); más cantidad, nota más aguda. Barrido automático o exploración con flechas. |
| **Compara años** | Elegir años y oír sus meses o sus picos de polvo, con datos de MERRA-2 sobre RD. |
| **Escucha 45 años** | Un mes por nota, de 1980 a 2024. |

Todo funciona con el teclado y sin mirar la pantalla.

## Estructura

```
docs/            Lo que se publica en GitHub Pages
  index.html     Página principal
  css/  js/      Estilos y módulos
  data/          JSON generados por los scripts
  assets/        Imágenes NASA (ver su README)
  vendor/        Tone.js (versión fija) y su licencia
scripts/         Preparación de datos con Python (Pillow + NumPy + SciPy)
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

La aplicación es estática y autocontenida: sin backend, sin base de datos, sin claves y **sin ninguna llamada a servicios de IA en tiempo de uso**. Funciona con internet lento.

## Licencia

Código original bajo Apache-2.0 (ver `LICENSE`). Visualizaciones: cortesía de NASA's Scientific Visualization Studio y NASA's Global Modeling and Assimilation Office — ver créditos en [SOURCES.md](SOURCES.md). La NASA no respalda entidades ajenas al gobierno de EE. UU.
