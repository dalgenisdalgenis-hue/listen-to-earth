# Registro de avances — Listen to Earth

Actualizado: 15 de noviembre de 2026 (República Dominicana).

Este registro acompaña al código. Se distingue lo implementado de lo ejecutado
en pruebas y de lo que requiere comprobación humana. La especificación del
equipo está en [SPEC.md](SPEC.md); no se ha modificado su contenido.

## Entregas

1. **Lectura de imagen:** canvas con tamaño interno 1920×1080, carga desde el
   mismo sitio, estados de carga/error y comprobación de dimensiones. PNG y
   leyenda originales conservados sin redimensionar.
2. **Descomposición:** NNLS mediante conjunto activo, con los cuatro colores
   exactos. Se promedia RGB antes de descomponer. Consulta puntual 3×3; la
   rutina de promediar regiones permite comprobar columnas de 9 píxeles.
   Peso mínimo 0,05 Y residuo máximo 0,10. Los pesos no se fuerzan a sumar uno.
3. **Cuadrícula y flechas:** ocho filas y doce columnas, muestras 3×3 en los
   centros de las casillas; foco móvil, Enter/espacio para repetir, Tab sin
   capturar, botones alternativos y tabla textual de las 96 posiciones.
   Tone.js local 15.1.22; activación explícita, volumen del polvo, silencio
   y detener. Solo está seleccionado el polvo. El timbre sintetizado es
   provisional y debe escucharlo el equipo antes de darlo por bueno.
4. **Barrido automático:** 30 pasos de este a oeste, nominalmente 15 segundos
   al tempo 100 %. Recorrido tropical de 20°E a 69,9°O, franja 12–22°N, y
   recorrido mundial de 180°E a 180°O, de polo a polo. Los perfiles se calculan
   desde RGB promedio de columnas de 9 píxeles al cargar la imagen; no se
   reproducen listas de pesos copiadas del SPEC. Ambos extremos se incluyen.

   Controles: P reproduce/pausa, Repetir empieza de nuevo, S/Esc detiene, V
   cambia recorrido y lo deja preparado, +/− ajusta el tempo de 50 a 150 %.
   Se muestran columna muestreada, progreso, texto del paso y tabla de datos.
   El barrido puede activar el audio por acción explícita del usuario.
5. **Selector de aerosoles:** casillas y teclas 4 polvo, 5 carbono negro,
   6 sulfatos, 7 sal marina, 8 todos/solo polvo. De entrada solo está marcado
   polvo. Cada instrumento tiene volumen propio. 8 cambia únicamente la
   selección y conserva los volúmenes. Desde una selección parcial, 8 activa
   todos; al volver a pulsarlo deja solo polvo.

   Durante el barrido se silencian las capas desactivadas y las nuevas entran
   en el próximo paso, sin reiniciar ni cambiar el reloj. Fuera del barrido,
   si el audio ya está activo, cambiar la selección vuelve a tocar la misma
   última muestra. Se muestra si esa muestra es una celda o una columna.
6. **Consulta de RD y final de la pista 1:** R y un botón consultan el píxel
   (587,429) con ventana 3×3, muestran un marcador pequeño y preparan la celda
   que lo contiene para continuar con flechas. El resultado se identifica
   siempre como punto: polvo 0,000 y sal marina aproximadamente 0,608.

   Al terminar el viaje del polvo aparece un aviso distinto para el promedio
   de la franja: polvo 0,000 y sal marina aproximadamente 0,300. La selección
   no cambia automáticamente. La persona puede pulsar 7 o un botón para añadir
   sal marina y repetir la columna por decisión propia.
7. **Portada, guía y reorganización visual:** la página comienza con una
   portada sobre la imagen NASA, llamada a comenzar y acceso a una guía en
   diálogo. Los dos recorridos dejan de depender de un menú pequeño: aparecen
   como tarjetas grandes, Viaje del polvo y Planeta completo, con estado
   `aria-pressed`. Después siguen mapa interactivo, mezclador de aerosoles y
   transparencia científica. Se conservan IDs, datos, teclas y audio.
8. **Experiencias separadas, créditos y escucha individual:** la portada
   enlaza a `escuchar.html?modo=viaje`, `?modo=planeta` y `?modo=explorar`.
   Los recorridos ocultan la cuadrícula manual; la exploración manual oculta
   la línea y los controles automáticos. Se añadieron créditos de NASA SVS
   5669, NASA GMAO, Tone.js y el equipo estudiantil.

   El modo principal deja un solo aerosol seleccionado. Elegir otro apaga el
   anterior; Mezclar varios habilita las combinaciones como opción avanzada.
   Por solicitud posterior del usuario, una muestra sin nota queda en silencio:
   se retiró el clic porque se confundía con los sonidos de los aerosoles.
9. **Arquitectura de plataforma y ambientación:** la portada queda dedicada
   a la frase “El planeta tiene una voz. Y todos merecemos escucharla”. El
   botón principal abre `experiencias.html`; viaje, planeta y exploración
   tienen URLs individuales. Guía y créditos son páginas independientes.
   Los créditos detallan NASA SVS 5669, GMAO, las personas acreditadas por
   NASA, Tone.js, el equipo, la competencia, las limitaciones y los enlaces.

   El selector de aerosoles aparece antes de la reproducción. En escritorio,
   controles y mapa forman un espacio de trabajo conjunto; en pantallas más
   estrechas, Reproducir desplaza y enfoca el mapa. La portada incluye una
   composición ambiental original generada con Tone.js: no se inicia al
   cargar, se identifica como artística y se detiene al ocultar o abandonar
   la página. No modifica la sonificación de los datos.

## Decisiones y correcciones documentadas

- La diferencia en RD se debía a ventanas distintas: un píxel da sal marina
  0,714; 3×3 da 0,608; 5×5 da 0,478. El procedimiento vigente es 3×3.
- En el barrido, el último paso representa una franja, no el dato puntual de
  RD. El script reproduce polvo 0 y sal marina 0,300 al terminar.
- La tecla R usa (587,429) con ventana 3×3 y sal marina 0,608.
- Se usa el mapeo lineal exacto del SPEC para la pista 1 y las 15 frecuencias
  indicadas. La escala mayor queda en una constante, provisional.
- Las celdas no se clasifican por el color más parecido: conservan los
  cuatro pesos. El selector elige qué pesos sonificar; no vuelve a ajustar
  RGB a una matriz reducida ni normaliza los pesos elegidos.
- Para evitar anuncios duplicados, las flechas cambian el foco y dejan que
  el lector anuncie la celda. Los botones alternativos mantienen el foco en
  el botón y anuncian la nueva posición mediante aria-live.
- La página no inicia síntesis de voz. La narración opcional aún no está
  implementada. No se usa ninguna API externa en tiempo de uso.
- El SPEC original indicaba un clic suave para las zonas sin partículas. El
  equipo lo retiró después de escuchar la plataforma: ahora esas muestras son
  silencio. Se conserva el SPEC sin editar y este registro documenta el cambio.
- Los documentos actuales de la rama `assets/imagen-5669` se conservaron como
  base; los originales del ZIP y las versiones de SPEC recibidas se guardan
  en [historial/](historial/).

## Cambio de orden solicitado por el usuario — 14-nov-2026

La configuración del modo de uso sin mirar la pantalla y las pruebas con
lector de pantalla se dejan para la última etapa, por instrucción posterior
del usuario. Este acuerdo cambia el orden de trabajo indicado inicialmente
en el SPEC; el archivo de especificación se conserva íntegro.

Se mantienen las etiquetas, el foco móvil y el teclado ya implementados.
NVDA y VoiceOver son lectores externos: no se encienden desde la página.
El modo de uso de la página agrupará las preferencias correspondientes; su
voz propia opcional seguirá apagada por defecto, como establece el SPEC.
Las pruebas normales de cálculo, navegador y sonido continúan durante el
desarrollo. La validación específica con lectores de pantalla queda al final.

## Pruebas ejecutadas

**Actualización del selector:** pasan las 16 combinaciones sobre 376
resultados (371 muestras del PNG y cinco casos sintéticos de prueba),
incluida mezcla 50/50, umbral y residuo exactos y ausencia de selección.
Se comprueba que habilitar capas no cambia pesos, notas de las otras capas
ni resultados de la cuadrícula. Se comprueban los atajos 4–8.

El controlador de audio con Tone simulado comprueba las cuatro frecuencias
base, las dos fuentes del oleaje, la ausencia de un clic artificial, volumen
por capa, silencio y detener. No se crean nodos antes de activar el audio.

Una prueba adicional ejecuta app.js con el HTML real, el PNG decodificado por
Pillow, DOM/Tone/reloj simulados: casillas, atajos, volúmenes, conservación
de foco, selección sin reiniciar el barrido, edición de texto y recarga.
Después de acabar el recorrido tropical, seleccionar sal marina usa la
columna final de la franja (0,300), no el punto de RD. Estos resultados no
sustituyen una prueba de navegador o de audio real.

**Actualización de R y el final:** la prueba de eventos verifica el píxel
(587,429), polvo 0,000, sal marina 0,608 y la nota 587,34 Hz al seleccionar
sal marina. También verifica que el aviso conserva solo polvo, presenta la
franja final aparte y que 7 o el botón repiten la columna de sal marina 0,300.

**Actualización visual:** la prueba de eventos verifica que las dos tarjetas
de recorrido actualizan el modo real del barrido y que la guía abre y cierra.
El usuario informó que el sonido se escucha bien; se registra como observación,
no como una prueba acústica formal en varios navegadores y dispositivos.

**Actualización de experiencias:** las comprobaciones de archivos recorren
ahora la portada y la página interactiva. La prueba de eventos verifica el
modo exclusivo, la activación voluntaria de la mezcla y el silencio en RD
cuando solo está seleccionado polvo. Las tres URLs y la separación visual
requieren además la revisión manual indicada en PRUEBAS.md.

**Actualización del barrido:** se comparan ahora **371 muestras** con SciPy,
incluidas 30 columnas mundiales adicionales. Se verifican los perfiles
generados por la aplicación, el extremo 69,9°O y los dos pasos finales sin
nota de polvo. Los dos perfiles tropicales siguen coincidiendo con el SPEC.

La máquina de estados del barrido se ejecutó con reloj simulado: 30 pasos y
final a 15.000 ms en condiciones ideales; pausa con conservación de la
fracción restante, reanudación, repetir/detener, cambio de tempo, retrasos,
cambio de modo, errores y cancelación de un Tone.start pendiente. Estos
15.000 ms no son una medición de reproducción real en un navegador.

- El script original del equipo pasa sus cuatro comprobaciones sobre el PNG
  recibido. Los dos perfiles de 30 pasos coinciden con el SPEC a tres decimales.
- JavaScript y SciPy se compararon sobre **341 muestras**: las 245 de la
  entrega anterior y los 96 centros de la cuadrícula. Diferencia máxima de
  pesos observada: 3,76×10⁻¹⁴. Se verifican pesos no negativos y residuo.
- Se prueban los límites exactos del umbral y del residuo, la mezcla 50/50 de
  polvo y sal marina, negro, bordes de imagen y mapeo lineal a notas.
- Controlador de teclado probado sobre DOM simulado: foco único, flechas,
  repetir, bordes, botones alternativos y Tab sin preventDefault.
- Controlador de audio probado con Tone simulado: no crea nodos antes de
  activar, distingue nota/clic, silencia y respeta volumen cero y detener.
- Sintaxis JavaScript y referencias a archivos/textos del HTML comprobadas.

**Estas pruebas no son una prueba de navegador ni de sonido real.** No se ha
verificado aún Web Audio, Chrome/Safari/Firefox, NVDA/VoiceOver, altavoz mono,
red lenta, contraste forzado ni voluntarios. La aplicación no se presenta
como validada con usuarios.

## Pendiente documental del SPEC

La tabla resumida de longitudes no coincide con los pasos uniformes del
script: polvo 0,052 corresponde a 38,9°O; 0,556 a 45,1°O; 0,570 a 54,4°O.
El script fija el muestreo reproducible y los perfiles completos coinciden.
La tabla del SPEC se conserva sin corregirla por cuenta del equipo.

## Sonido del selector

La misma intensidad produce la misma nota base en todos los aerosoles,
siempre con las dos guardas y el mapeo lineal del SPEC. Cambia el timbre:
polvo con onda triangular y envolvente corta; carbono negro con tambor de
membrana; sulfatos con síntesis FM de campana; sal marina con seno y ruido
rosa filtrado alrededor de la misma nota. Todo se sintetiza localmente con
Tone.js; no se descargan muestras de instrumentos.

Los cuatro instrumentos pueden sonar a la vez con el mismo instante de
ataque. Se mantiene una voz por instrumento, con un limitador compartido.
Son timbres provisionales; todavía no se ha comprobado su identidad auditiva
en navegador, en altavoz mono ni con personas usuarias.

Si ninguna capa seleccionada supera las guardas, la muestra queda en silencio.
Con todas las casillas apagadas también hay silencio. Un instrumento con
volumen cero no se sustituye por ningún efecto de tecla.

La selección actualiza etiquetas y tablas sin reconstruir la cuadrícula ni
volver a leer píxeles. Los cuatro pesos siguen visibles en las tablas,
independientemente de qué capas estén activas. Al cambiar de recorrido se
descarta la muestra de preescucha anterior para no mezclar contextos.

## Siguiente paso

La primera versión de la pista 1 quedó publicada mediante GitHub Pages desde
`main` → `/docs` en `https://dalgenisdalgenis-hue.github.io/listen-to-earth/`.
El despliegue y los recursos públicos esenciales respondieron correctamente.

El siguiente paso es ejecutar la lista manual en navegadores y altavoz reales.
Quedan también las preferencias de accesibilidad (voz opcional, pantalla
oscura, tamaño de letra, contraste y movimiento reducido), las pruebas
humanas y de navegador. Por instrucción del usuario, no se inicia MERRA-2 ni
las pistas 2 y 3 hasta nuevo aviso; no se han inventado datos para sustituirlo.

## Comportamiento y límites del temporizador

- Hay un solo temporizador pendiente. Cada callback emite un paso y espera
  el intervalo completo siguiente; una demora no provoca una ráfaga de notas
  para recuperar tiempo. En un dispositivo ocupado el recorrido puede durar
  más de los 15 segundos nominales. No se omiten muestras.
- Ocultar la pestaña pausa el barrido y cancela un arranque pendiente. No se
  reanuda automáticamente al volver: el usuario pulsa P.
- La exploración manual pausa el barrido antes de tocar la celda, para que
  dos fuentes no compitan por la misma voz de polvo.
- Pausar conserva el próximo paso y la fracción de intervalo pendiente;
  reanudar no repite la última nota. Repetir reinicia en el primer paso.
- En los extremos del modo mundial, la columna se recorta a los píxeles
  disponibles del PNG, igual que en el script del equipo: 4 píxeles en el
  borde este y 5 en el oeste. No se añaden píxeles del extremo opuesto.
- El resultado final tropical sigue siendo un promedio de la franja, no una
  lectura puntual de RD. No se cambia automáticamente el aerosol seleccionado.
- El entorno declara escritorio disponible pero no ofrece herramienta de
  control del navegador en esta sesión. No se han ejecutado pruebas reales
  de navegador ni de audio; siguen pendientes y se describen en PRUEBAS.md.
