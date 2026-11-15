# Listen to Earth

*The planet has a voice. Everyone deserves to hear it.*

Proyecto del Liceo Científico Dr. Miguel Canela Lázaro (República Dominicana)
para NASA Space Apps Challenge 2026, reto *The Earth Information Jukebox*.
Convierte la visualización oficial SVS 5669 de aerosoles en sonido explorable.

## Estado de esta entrega

Implementados: lectura del PNG 1920×1080 en canvas, descomposición NNLS,
cuadrícula de 8 filas × 12 columnas, exploración con flechas, botones
alternativos y tabla textual. El barrido automático ofrece viaje del polvo y
mundo entero, con 30 pasos, pausa, repetición y tempo. El selector permite
escuchar polvo, carbono negro, sulfatos y sal marina, con volumen por capa.
De entrada solo suena el polvo; el audio se activa con un botón o P por acción explícita del usuario.
La tecla R consulta el punto exacto de República Dominicana y el final del
recorrido explica por separado el promedio de la franja. Tone.js 15.1.22 está dentro del repo.
La portada presenta la idea y enlaza a una página de elección con tres
experiencias: **Viaje del polvo**, **Planeta completo** y **Exploración manual**.
Cada experiencia tiene una URL propia. Guía y créditos también son páginas
independientes. La portada ofrece una ambientación artística opcional,
sintetizada localmente y separada de los sonidos de los datos.

Ejecutados: 371 comparaciones JS/SciPy y pruebas de controladores con DOM,
Tone y reloj simulados. **Pendientes: navegador, audio real, NVDA/VoiceOver y pruebas
con voluntarios.** No se afirma validación con usuarios.

La configuración del modo sin mirar la pantalla y las pruebas
con lectores de pantalla se reservan para la última etapa, según la nueva
instrucción del usuario registrada en REGISTRO_CAMBIOS.md. Se mantienen las
etiquetas y el teclado existentes. Por decisión del usuario, esta primera
versión se publica solo con la pista 1; no se trabaja todavía con MERRA-2 ni
con las pistas 2 y 3.

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

1. Abrir la portada. La ambientación no empieza sola: se activa con su botón.
   Pulsar **Elegir una experiencia** para abrir la página de opciones.
2. En los recorridos, esperar la imagen y pulsar Reproducir. En Explorar por
   zonas, esperar la cuadrícula y activar sonido.
3. En Explorar por zonas, usar flechas; Enter repite y Tab sale.
4. Si el lector captura las flechas, usar los botones de dirección.
5. M silencia; S o Esc detiene. Cada instrumento tiene su rango de volumen.
6. Elegir **Viaje del polvo** o **Planeta completo**. P inicia o pausa el barrido;
   Repetir empieza desde el principio. Al tempo
   100 %, los 30 pasos duran nominalmente 15 segundos. +/− cambia el tempo.
7. V cambia entre viaje del polvo y planeta completo, dejando el nuevo recorrido
   preparado para P. Usar las flechas pausa el barrido. Ocultar la pestaña
   también lo pausa; al volver se reanuda con P.
8. 4 enciende/apaga polvo; 5 carbono negro; 6 sulfatos; 7 sal marina. También
   hay casillas. 8 activa todos; desde todos, vuelve a solo polvo. Los cuatro
   controles de volumen mantienen sus ajustes al cambiar la selección.
9. R o el botón correspondiente consulta el píxel de RD con ventana 3×3.
   Al terminar el viaje del polvo, leer el aviso: la columna final tiene
   polvo 0,000 y sal marina aproximadamente 0,300. R muestra el punto del
   país por separado, donde la sal marina es aproximadamente 0,608.

La página **Guía de uso** reúne estos pasos y los atajos. La página
**Créditos y fuentes** identifica la visualización NASA, sus créditos, las
limitaciones, Tone.js, el equipo y los enlaces oficiales.

De entrada se escucha un contaminante a la vez para distinguir los timbres.
La opción **Mezclar varios** permite compararlos simultáneamente. Durante el
barrido los cambios entran en el siguiente paso. Una muestra sin nota queda
en silencio: no hay efectos de tecla ni clic de posición.

No se captura ninguna voz ni se inicia narración automática.

## Reproducir los cálculos y las pruebas

Solo para desarrollo; Python y Node no forman parte de la aplicación web:

```bash
pip install -r requirements.txt
python scripts/medir_imagen.py docs/assets/aerosols_5669_1920x1080.png
python scripts/verificar_imagen.py
node scripts/verificar_teclado.cjs
node scripts/verificar_audio.cjs
node scripts/verificar_barrido.cjs
node scripts/verificar_ambientacion.cjs
python scripts/verificar_archivos.py
```

Ver [PRUEBAS.md](PRUEBAS.md) para la prueba manual pendiente.

El comando de comparación también prueba las 16 combinaciones del selector
y los eventos de app.js sobre DOM/Tone/reloj simulados. No es una prueba de
navegador ni de sonido real. La identidad de los cuatro timbres y la mezcla
en altavoz mono siguen pendientes de evaluación por el equipo.

## Qué representa el sonido

Se promedia RGB en una ventana de 3×3 en el centro de cada casilla. NNLS
reparte ese color entre los cuatro colores oficiales sin pesos negativos.
Solo se habilita una nota si el peso seleccionado es al menos 0,05 y el
residuo de reconstrucción es como máximo 0,10. En otro caso hay silencio.

El barrido promedia columnas de 9 píxeles, con altura de 12–22°N en el viaje
del polvo y de polo a polo en el mundo entero. El muestreo y el recorrido se
calculan en el navegador. En los bordes del PNG se recorta la columna como
en Python. El último paso tropical llega a 69,9°O aunque el polvo sea cero;
su promedio de la franja no se presenta como el dato puntual de RD.

La intensidad relativa se convierte linealmente en una de las 15 notas
pentatónicas del SPEC. La escala mayor y el timbre son provisionales para que
el equipo los evalúe escuchando. Los pesos de una imagen no son µg/m³ ni una
medida de lo que se respira; el mapa de fondo y las mezclas añaden error.

Cada aerosol usa la misma regla de nota y su propio timbre: cuerda sintetizada
para polvo, tambor para carbono negro, campanas para sulfatos y oleaje con
una componente afinada para sal marina. Los pesos se calculan sobre la matriz
completa de cuatro colores y se conservan al encender o apagar capas.

## Estructura y publicación prevista

- `docs/`: HTML, CSS, JavaScript, imágenes NASA y Tone.js local.
- `docs/index.html`: portada sencilla y ambientación voluntaria.
- `docs/experiencias.html`: elección entre las tres experiencias.
- `docs/viaje-del-polvo.html`, `docs/planeta-completo.html` y
  `docs/exploracion-manual.html`: URLs individuales con un motor compartido.
- `docs/guia.html` y `docs/creditos.html`: instrucciones, fuentes y créditos.
- `docs/escuchar.html`: redirección compatible con los enlaces antiguos.
- `scripts/`: medición y pruebas de desarrollo reproducibles.
- `SPEC.md`: especificación actual proporcionada por el equipo.
- `historial/`: versiones de documentos recibidas durante el trabajo.

La primera versión de la pista 1 está publicada en:

**https://dalgenisdalgenis-hue.github.io/listen-to-earth/**

GitHub Pages despliega desde `main` → `/docs`. El enlace no depende de un
entorno de IA y puede compartirse directamente con el jurado.

Todo el cálculo y audio ocurren en el navegador. No hay backend, base de
datos, claves, CDN ni API externa. La imagen se precarga y se mantiene en la
resolución fijada de 1920×1080.

## Créditos y licencia

Visualizaciones: NASA's Scientific Visualization Studio y NASA's Global
Modeling and Assimilation Office. La NASA no respalda entidades ajenas al
gobierno de EE. UU. Tone.js: Yotam Mann, MIT, licencias en `docs/vendor/`.
Código original: Apache-2.0, ver [LICENSE](LICENSE).
