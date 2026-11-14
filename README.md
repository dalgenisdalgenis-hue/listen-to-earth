# Listen to Earth

*The planet has a voice. Everyone deserves to hear it.*

Proyecto del Liceo Científico Dr. Miguel Canela Lázaro (República Dominicana)
para NASA Space Apps Challenge 2026, reto *The Earth Information Jukebox*.
Convierte la visualización oficial SVS 5669 de aerosoles en sonido explorable.

## Estado de esta entrega

Implementados: lectura del PNG 1920×1080 en canvas, descomposición NNLS,
cuadrícula de 8 filas × 12 columnas, exploración con flechas, botones
alternativos y tabla textual. Solo suena el polvo; el audio se activa con un
botón, incluido su uso mediante teclado. Tone.js 15.1.22 está dentro del repo.

Ejecutados: 341 comparaciones JS/SciPy y pruebas de controladores con DOM y
Tone simulados. **Pendientes: navegador, audio real, NVDA/VoiceOver y pruebas
con voluntarios.** No se afirma validación con usuarios.

Siguiente: barrido automático; después selector de aerosoles y tecla R con
el aviso final. La configuración del modo sin mirar la pantalla y las pruebas
con lectores de pantalla se reservan para la última etapa, según la nueva
instrucción del usuario registrada en REGISTRO_CAMBIOS.md. Se mantienen las
etiquetas y el teclado existentes. Las pistas 2 y 3 esperan el JSON real de MERRA-2.

- [Especificación del equipo](SPEC.md), conservada íntegra.
- [Registro de avances, decisiones y pendientes](REGISTRO_CAMBIOS.md).
- [Cómo ejecutar las pruebas](PRUEBAS.md).
- [Brief y alcance](PROJECT_BRIEF.md).
- [Fuentes y licencias](SOURCES.md).
- [Uso de IA](AI_USAGE.md).
- [Detalle técnico de las imágenes](docs/assets/README.md).
- [Versiones anteriores recibidas](historial/).

## Abrir la página en local

Desde la raíz del repo:

```bash
python -m http.server 8000 --bind 127.0.0.1 --directory docs
```

Abrir `http://127.0.0.1:8000`. Según el equipo, usar `python3` o `py`.
No hay compilación ni instalación de dependencias para abrir la web. Evitar
abrir index.html con doble clic: algunos navegadores bloquean la lectura del
canvas mediante `file://`.

1. Esperar la imagen y la cuadrícula.
2. Llegar con Tab a **Activar sonido** y pulsar Enter.
3. Entrar en la cuadrícula y usar flechas; Enter repite y Tab sale.
4. Si el lector captura las flechas, usar los botones de dirección.
5. M silencia; S o Esc detiene. El rango controla el volumen del polvo.

No se captura ninguna voz ni se inicia narración automática.

## Reproducir los cálculos y las pruebas

Solo para desarrollo; Python y Node no forman parte de la aplicación web:

```bash
pip install -r requirements.txt
python scripts/medir_imagen.py docs/assets/aerosols_5669_1920x1080.png
python scripts/verificar_imagen.py
node scripts/verificar_teclado.cjs
node scripts/verificar_audio.cjs
python scripts/verificar_archivos.py
```

Ver [PRUEBAS.md](PRUEBAS.md) para la prueba manual pendiente.

## Qué representa el sonido

Se promedia RGB en una ventana de 3×3 en el centro de cada casilla. NNLS
reparte ese color entre los cuatro colores oficiales sin pesos negativos.
Solo se habilita una nota si el peso seleccionado es al menos 0,05 y el
residuo de reconstrucción es como máximo 0,10. En otro caso hay un clic suave.

La intensidad relativa se convierte linealmente en una de las 15 notas
pentatónicas del SPEC. La escala mayor y el timbre son provisionales para que
el equipo los evalúe escuchando. Los pesos de una imagen no son µg/m³ ni una
medida de lo que se respira; el mapa de fondo y las mezclas añaden error.

## Estructura y publicación prevista

- `docs/`: HTML, CSS, JavaScript, imágenes NASA y Tone.js local.
- `scripts/`: medición y pruebas de desarrollo reproducibles.
- `SPEC.md`: especificación actual proporcionada por el equipo.
- `historial/`: versiones de documentos recibidas durante el trabajo.

GitHub Pages se configurará desde **Settings → Pages → Deploy from a branch
→ main → /docs** cuando el equipo integre los cambios. Esta entrega en una
rama de desarrollo no implica que la página ya esté publicada.

Todo el cálculo y audio ocurren en el navegador. No hay backend, base de
datos, claves, CDN ni API externa. La imagen se precarga y se mantiene en la
resolución fijada de 1920×1080.

## Créditos y licencia

Visualizaciones: NASA's Scientific Visualization Studio y NASA's Global
Modeling and Assimilation Office. La NASA no respalda entidades ajenas al
gobierno de EE. UU. Tone.js: Yotam Mann, MIT, licencias en `docs/vendor/`.
Código original: Apache-2.0, ver [LICENSE](LICENSE).
