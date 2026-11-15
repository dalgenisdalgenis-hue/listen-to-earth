# Listen to Earth

*The planet has a voice. Everyone deserves to hear it.*

Proyecto del Liceo Científico Dr. Miguel Canela Lázaro (República Dominicana)
para NASA Space Apps Challenge 2026, reto *The Earth Information Jukebox*.
Convierte la visualización oficial SVS 5669 de aerosoles en sonido explorable.

Versión pública vigente: https://dalgenisdalgenis-hue.github.io/listen-to-earth/
La configuración y la decisión de conservar esta dirección se documentan en
[PUBLICACION.md](PUBLICACION.md).

## Estado de esta entrega

Implementados: lectura del PNG 1920×1080 en canvas, descomposición NNLS,
cuadrícula de 8 filas × 12 columnas, exploración con flechas, botones
alternativos y tabla textual. El barrido automático ofrece Viaje del polvo
con 30 pasos y Planeta completo con 60, además de pausa, repetición y tempo. El selector permite
escuchar polvo, carbono negro, sulfatos y sal marina, con volumen por capa.
De entrada solo suena el polvo; el audio se activa con un botón o P por acción explícita del usuario.
Una textura sostenida representa la intensidad total válida de la muestra y
suena debajo de los instrumentos. Tiene interruptor y volumen independientes;
no cambia los pesos ni las notas de cada aerosol.
La tecla R consulta el punto exacto de República Dominicana y el final del
recorrido explica por separado el promedio de la franja. Tone.js 15.1.22 está dentro del repo.
La portada presenta la idea y enlaza a una página de elección con tres
experiencias: **Viaje del polvo**, **Planeta completo** y **Exploración manual**.
Cada experiencia tiene una URL propia. Guía y créditos también son páginas
independientes. La portada ofrece una ambientación artística opcional,
sintetizada localmente y separada de los sonidos de los datos.
Toda la interfaz está disponible en español e inglés mediante el selector
**ES / EN** del encabezado. La elección se conserva al cambiar de página y
la versión inglesa también puede abrirse directamente con `?lang=en`.

Ejecutados: 311 muestras puntuales y **870 bandas de recorrido** comparadas
entre JavaScript y SciPy, además de pruebas de controladores con DOM,
Tone y reloj simulados. El equipo probó controles y sonidos en teléfono y
computadora; también se comprobó la navegación ES/EN en Chromium de escritorio
y a 390 px. **Pendientes: NVDA/VoiceOver, red lenta y pruebas estructuradas con
voluntarios.** No se afirma validación con usuarios ciegos o con baja visión.

**Revisión científica implementada:** cada paso se divide antes de descomponer
el color: 12 bandas en Planeta completo y 5 en Viaje del polvo. La intensidad
controla la altura y la cobertura espacial controla el volumen. Esta revisión
evita que el promedio de polo a polo oculte plumas localizadas. Un fondo
neutro silencioso y una prueba de evidencia evitan convertir grises del mapa
en aerosoles. La decisión,
sus mediciones y las referencias de NASA están en
[METODOLOGIA_SONIFICACION.md](METODOLOGIA_SONIFICACION.md).

La configuración del modo sin mirar la pantalla y las pruebas
con lectores de pantalla se reservan para la última etapa, según la nueva
instrucción del usuario registrada en REGISTRO_CAMBIOS.md. Se mantienen las
etiquetas y el teclado existentes. Por decisión del usuario, esta primera
versión se publica solo con la pista 1; no se trabaja todavía con MERRA-2 ni
con las pistas 2 y 3.

- [Especificación vigente del equipo](SPEC.md).
- [Metodología y fundamento NASA](METODOLOGIA_SONIFICACION.md).
- [Registro de avances, decisiones y pendientes](REGISTRO_CAMBIOS.md).
- [Cómo ejecutar las pruebas](PRUEBAS.md).
- [Brief y alcance](PROJECT_BRIEF.md).
- [Fuentes y licencias](SOURCES.md).
- [Uso de IA](AI_USAGE.md).
- [Estado de publicación y enlace](PUBLICACION.md).
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
   100 %, Viaje del polvo dura nominalmente 15 segundos y Planeta completo,
   con 60 pasos, aproximadamente 30 segundos. +/− cambia el tempo.
7. V cambia entre viaje del polvo y planeta completo, dejando el nuevo recorrido
   preparado para P. Usar las flechas pausa el barrido. Ocultar la pestaña
   también lo pausa; al volver se reanuda con P.
8. 4 enciende/apaga polvo; 5 carbono negro; 6 sulfatos; 7 sal marina. También
   hay casillas. 8 activa todos; desde todos, vuelve a solo polvo. Los cuatro
   controles de volumen mantienen sus ajustes al cambiar la selección.
9. R o el botón correspondiente consulta el píxel de RD con ventana 3×3.
   Al terminar el viaje del polvo, leer el aviso: el resumen final tiene
   polvo 0,000 en 0/5 zonas, sal marina 0,291 en 2/5 y sulfatos 0,073 en 1/5.
   R muestra el punto del
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
node scripts/verificar_idiomas.cjs
python scripts/verificar_archivos.py
```

Ver [PRUEBAS.md](PRUEBAS.md) para repetir la comprobación manual y consultar
las pruebas de lector de pantalla aún pendientes.

El comando de comparación también prueba las 16 combinaciones del selector
y los eventos de app.js sobre DOM/Tone/reloj simulados. No es una prueba de
navegador ni de sonido real. La identidad de los cuatro timbres, la mezcla y
los controles fueron escuchados por el equipo en teléfono y computadora; las
pruebas estructuradas con más personas siguen pendientes.

## Qué representa el sonido

Se promedia RGB en una ventana de 3×3 en el centro de cada casilla. NNLS
reparte ese color entre los cuatro colores oficiales y un fondo neutro
silencioso, sin pesos negativos. Solo se habilita una nota si el peso es al
menos 0,05, el residuo es como máximo 0,10 y retirar ese aerosol empeora el
ajuste al menos 0,01. En otro caso hay silencio.

El barrido lee franjas de 9 píxeles de ancho y las divide antes de NNLS: cinco
bandas dentro de 12–22°N para el viaje y doce bandas de polo a polo para el
mundo. Para cada aerosol conserva dos datos: intensidad media en las bandas
válidas y cobertura o fracción de bandas donde aparece. En el recorrido mundial
el carbono negro aparece en 21 de 60 longitudes y 44 de 720 zonas; con el
promedio anterior solo superaba las guardas en un paso.

La altura representa intensidad. El nivel del instrumento se multiplica por
la raíz cuadrada de la cobertura para que una pluma real en 1/12 bandas siga
siendo audible sin sonar como si cubriera todo el planeta. Las notas automáticas
duran 0,45 s dentro de cada paso de 0,50 s.

La intensidad relativa se convierte linealmente en una de las 15 notas
pentatónicas del SPEC. La escala y los timbres se conservaron para esta versión
después de la escucha del equipo. Los pesos de una imagen no son µg/m³ ni una
medida de lo que se respira; el mapa de fondo y las mezclas añaden error.

Cada aerosol usa la misma regla de nota y su propio timbre: cuerda sintetizada
para polvo, tambor para carbono negro, campanas para sulfatos y oleaje con
una componente afinada para sal marina. Los pesos se calculan sobre las cuatro
bases de aerosol más el fondo neutro; se conservan al encender o apagar capas
y el fondo nunca tiene instrumento.

La capa de imagen completa suma únicamente los pesos que cumplen las tres
guardas, limita el total al intervalo 0–1 y lo convierte
en volumen y frecuencia de corte de un acorde sostenido. No asigna otra nota
ni depende del contaminante seleccionado. Se inspira metodológicamente en la
sonificación de Caldwell 73 de SYSTEM Sounds (M. Russo y A. Santaguida), sin
reutilizar su audio.

## Estructura y publicación prevista

- `docs/`: HTML, CSS, JavaScript, imágenes NASA y Tone.js local.
- `docs/index.html`: portada sencilla y ambientación voluntaria.
- `docs/experiencias.html`: elección entre las tres experiencias.
- `docs/viaje-del-polvo.html`, `docs/planeta-completo.html` y
  `docs/exploracion-manual.html`: URLs individuales con un motor compartido.
- `docs/guia.html` y `docs/creditos.html`: instrucciones, fuentes y créditos.
- `docs/escuchar.html`: redirección compatible con los enlaces antiguos.
- `scripts/`: medición y pruebas de desarrollo reproducibles.
- `SPEC.md`: especificación vigente, actualizada con las decisiones del equipo.
- `METODOLOGIA_SONIFICACION.md`: evidencia, correspondencias sonoras y estado
  de la revisión por zonas.
- `historial/`: versiones de documentos recibidas durante el trabajo.

La primera versión de la pista 1 está publicada en:

**https://dalgenisdalgenis-hue.github.io/listen-to-earth/**

Versión inglesa directa:
**https://dalgenisdalgenis-hue.github.io/listen-to-earth/?lang=en**

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
