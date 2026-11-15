# Comprobar esta entrega

## Pruebas automatizadas de desarrollo

> **Estado del 15-nov-2026:** la revisión por 12/5 bandas está implementada.
> Pasan las comparaciones JavaScript/SciPy y las pruebas simuladas. La escucha
> en navegador real y altavoz mono continúa pendiente.

Python y Node se usan únicamente para comprobar el código. El navegador del
jurado no los necesita y la web no tiene proceso de compilación.

Con Pillow, NumPy y SciPy instalados según `requirements.txt`:

```bash
python scripts/medir_imagen.py docs/assets/aerosols_5669_1920x1080.png
python scripts/verificar_imagen.py
node scripts/verificar_teclado.cjs
node scripts/verificar_audio.cjs
node scripts/verificar_barrido.cjs
node scripts/verificar_ambientacion.cjs
python scripts/verificar_archivos.py
```

El primer comando imprime cuatro comprobaciones correctas. El segundo compara
311 muestras puntuales y **870 bandas de recorrido** con SciPy: 720 del mundo
y 150 del viaje. También comprueba intensidad, cobertura, límites de
movimiento, fondo neutro, evidencia, guardas y mapeo a notas.

Las pruebas `verificar_teclado.cjs` y `verificar_audio.cjs` usan un DOM y un
Tone **simulados**. Comprueban las decisiones
de los controladores; no comprueban el navegador, la salida de sonido, la
política de activación ni un lector de pantalla.

La prueba de audio también comprueba que las notas zonales duran 0,45 s y que
la raíz de la cobertura modifica el nivel sin cambiar la nota. Además comprueba que la textura de imagen no crea sonido
antes de activar Tone, usa los cuatro pesos independientemente del selector,
limita la intensidad a 1, respeta umbral y residuo, suaviza volumen/filtro y
responde a su interruptor y volumen. No acredita que la mezcla sea clara al oído.

El segundo comando ejecuta además el selector sobre 16 combinaciones × 317
resultados (311 muestras reales y seis casos sintéticos). Comprueba que
elegir capas no cambia pesos ni notas de las otras capas. También ejecuta
app.js con la plantilla real de las experiencias y el PNG decodificado por Pillow sobre DOM/Tone/reloj
simulados: casillas, 4–8, volúmenes, foco, recarga y cambios sin reinicio del
barrido. También comprueba R en el píxel (587,429), sus valores y nota, el
aviso final, la selección sin cambios automáticos y la repetición explícita
del último resumen zonal. Sigue sin ser una prueba de navegador o acústica.

`verificar_barrido.cjs` usa reloj y activación de audio simulados: comprueba
la máquina de 30 pasos/15 segundos ideales, pausas, repeticiones, tempo, cambios de modo,
errores, callbacks tardíos y cancelación de un arranque pendiente. No mide
la precisión temporal ni el sonido de un navegador real.

`verificar_ambientacion.cjs` comprueba con Tone simulado que la portada no
crea audio al cargar, que la primera pulsación inicia la composición y que
puede pausarse. No acredita el timbre ni el volumen percibido.

## Prueba manual pendiente en navegador

```bash
python -m http.server 8000 --bind 127.0.0.1 --directory docs
```

Abrir `http://127.0.0.1:8000`. Evitar doble clic sobre index.html: `file://`
puede impedir leer el canvas.

1. Esperar la imagen y el anuncio de cuadrícula preparada. No debe sonar nada.
2. Con Tab, llegar a Activar sonido y pulsar Enter. Confirmar que inicia audio.
3. Entrar en la cuadrícula. Las flechas cambian posición y sonido; Enter o
   espacio repiten. Tab sale y no debe dejar al usuario atrapado.
4. Comprobar los cuatro bordes: no saltar de un extremo del mapa al otro.
5. Usar los botones de dirección: el foco debe permanecer en el botón, mientras
   el texto y aria-live describen la nueva posición.
6. Pulsar M, repetir una celda y confirmar silencio; volver a pulsar M.
   Probar volumen cero y S/Esc durante una nota.
7. Abrir la tabla de 96 posiciones y las cuatro comprobaciones. Comparar
   pesos y residuo con SPEC. En Pacífico sur no debe habilitarse una nota.
8. Reintentar la carga y comprobar que no se duplican listeners ni notas.
   Renombrar temporalmente la imagen para comprobar el mensaje de error.
9. Escuchar en altavoz mono. Comparar claridad de las notas, volumen cómodo
   y escala mayor provisional con el equipo.

## Prueba manual pendiente del barrido

1. Recargar: no debe arrancar audio ni barrido automáticamente.
2. Abrir Viaje del polvo y Planeta completo desde sus páginas propias. El
   estado visible y anunciado debe coincidir con la URL. V debe navegar a la
   otra experiencia automática.
3. Pulsar P o Reproducir barrido. Al tempo 100 %, comprobar 30 pasos y unos
   15 segundos en Viaje del polvo; 60 pasos y unos 30 segundos en Planeta completo.
4. Pausar a mitad de un intervalo y esperar. El cursor y progreso deben
   permanecer quietos y no deben sonar pasos nuevos. Continuar con P:
   conserva la fracción de intervalo y no repite la nota anterior.
5. Detener con S/Esc y esperar: no deben reaparecer notas. Repetir debe tocar
   desde el paso 1, aunque antes estuviera en marcha o hubiera terminado.
6. Probar tempo 50 %, 100 % y 150 %: en Viaje del polvo las duraciones
   nominales son 30, 15 y 10 s; en Planeta completo son 60, 30 y 20 s.
   Cambiar tempo durante reproducción y pausa, sin saltos de índice.
7. Con V cambiar recorrido: queda preparado para empezar de nuevo. Comprobar
   los 30 valores tropicales o los 60 mundiales en la tabla, la franja tropical
   y el recorrido de polo a polo.
8. En el viaje del polvo, comprobar el final en 69,9°O. El penúltimo paso
   conserva polvo 0,071 en 1/5 zonas y el último tiene polvo 0 en 0/5. La sal
   marina final es 0,291 en 2/5 zonas y no cambia por sí sola el instrumento
   seleccionado. El aviso debe incluir también sulfatos 0,073 en 1/5.
9. Moverse por la cuadrícula durante el barrido: debe pausarse y sonar la
   celda elegida. Ocultar la pestaña debe pausar; volver no debe reanudarla.
10. Iniciar y detener rápidamente mientras se activa el audio: una promesa
   tardía no debe arrancar el barrido después de detenerlo o cambiar modo.
11. Silenciar y poner volumen cero: el progreso sigue avanzando sin notas.
    Reintentar la carga y confirmar que no quedan temporizadores duplicados.
12. Pulsar R durante y después del recorrido. Debe pausarlo si está en marcha,
    mostrar un marcador pequeño sobre RD y describir el punto 3×3: polvo 0,000,
    sal marina aproximadamente 0,608. No debe presentarlo como el resumen
    zonal de sal marina 0,291 en 2/5 zonas.

## Comprobación de la revisión por bandas

1. **Aprobado:** JavaScript y SciPy coinciden para las 720 bandas mundiales y
   las 150 tropicales, además de bordes y casos sintéticos.
2. **Aprobado:** 12 bandas de 15° y 5 de 2°, sin
   huecos, solapamientos ni pérdida de píxeles por redondeo.
3. **Aprobado:** intensidad media elegible, cobertura y tres guardas. Una banda
   con residuo mayor de 0,10 o evidencia menor de 0,01 no cuenta.
4. **Aprobado:** carbono negro mundial en 21 de 60 longitudes y 44 de 720 zonas.
   Un gris sintético y la zona gris antártica usada como control se asignan al
   fondo silencioso y no activan instrumentos.
5. **Aprobado en el punto de control:** el Pacífico limpio no produce nota. En
   la escucha manual se debe vigilar que el mapa base
   o las luces urbanas no activan mezclas espurias de forma sistemática.
6. **Aprobado con Tone simulado:** altura cambia con intensidad y nivel con cobertura sin que
   el selector o el control de volumen alteren los datos calculados.
7. **Aprobado con Tone/reloj simulados:** duración de 0,45 s, liberación al pausar,
   detener u ocultar la pestaña y ausencia de notas atascadas.
8. **Aprobado:** texto y tablas muestran intensidad y cobertura, incluido “zonas activas
   de zonas totales”, sin llamarlas concentraciones.
9. **Pendiente humano:** escuchar carbono negro, polvo, sulfato y sal marina por separado y juntos
   en un navegador real y altavoz mono. Ajustar la curva de volumen solo con
   resultados anotados; las pruebas simuladas no acreditan percepción.
10. **Aprobado documentalmente:** guía, créditos y comportamiento describen la
    misma regla. La publicación no sustituye la prueba acústica pendiente.

## Prueba manual pendiente de presentación, guía y créditos

1. Confirmar que la portada muestra exactamente el título, explicación y
   botón para elegir una experiencia, sin etiquetas de pista o competencia.
2. Pulsar **Activar ambientación**: no debe sonar antes de la pulsación; debe
   pausarse con el mismo botón y detenerse al ocultar o abandonar la portada.
3. Abrir **Guía de uso** y **Créditos y fuentes** como páginas independientes.
   Revisar todos los enlaces oficiales y el aviso de no respaldo de NASA.
4. Revisar que las secciones del reproductor tengan un orden comprensible y que las
   tablas científicas permanezcan plegadas hasta pedirlas.
5. Probar a 320 px, teléfono, tableta y escritorio; zoom 200 % y 400 %.
6. Confirmar contraste, foco visible y que los controles no se superponen.
7. Desde `experiencias.html` abrir las tres URLs distintas:
   `viaje-del-polvo.html`, `planeta-completo.html` y `exploracion-manual.html`.
8. En los recorridos no debe aparecer la cuadrícula amarilla. En Explorar por
   zonas no debe aparecer la línea automática ni controles de barrido.
9. Confirmar que inicialmente elegir un aerosol apaga el anterior. Activar
   Mezclar varios y comprobar que entonces sí permite combinaciones.
10. En teléfono, pulsar Reproducir y comprobar que el mapa entra en vista y
    recibe el foco. En escritorio, selector, controles y mapa deben quedar
    próximos sin obligar a recorrer una página larga.

## Prueba manual pendiente del selector

1. Recargar: solo debe estar marcado polvo, con volumen 50 %. Antes de
   activar audio, usar casillas y teclas 4–8: no deben crearse sonidos.
2. Activar audio y explorar una celda. Con 4–7 y las casillas, comparar la
   misma muestra con distintas capas; revisar el origen mostrado (celda o
   resumen zonal). No debe presentarse una franja como dato puntual de RD.
3. Pulsar 8 desde una selección parcial: activa todos. Pulsarlo otra vez:
   solo polvo. Comprobar que conserva los cuatro volúmenes elegidos.
4. Poner una capa a volumen cero y repetir una muestra donde su peso supere
   las guardas: debe quedar en silencio, sin efecto de tecla sustituto.
   Si ninguna capa supera las guardas, también debe haber silencio.
5. En mezcla avanzada, apagar las cuatro casillas: debe quedar silencio.
   Encender un instrumento con residuo alto no debe
   permitir una nota que las guardas habían rechazado.
6. Iniciar el barrido. Añadir o quitar capas no debe reiniciar ni saltar el
   progreso. Una capa quitada deja de sonar; una nueva entra al próximo paso.
7. Conservar solo polvo y terminar el viaje tropical. Pulsar 7: debe oírse
   sal marina del último resumen, aproximadamente 0,291 en 2/5 zonas, sin iniciar de
   nuevo el barrido ni presentar el valor puntual de RD (0,608).
8. Cambiar de recorrido y recargar la imagen; comprobar selección, volumen,
   foco y ausencia de listeners o notas duplicados. La recarga de imagen
   conserva ajustes; una carga nueva de la página empieza con solo polvo.
9. Escuchar cada instrumento por separado y juntos en altavoz mono. Evaluar
   si se reconocen cuerda, tambor, campanas y oleaje y si la mezcla tapa alguno.
   Esta evaluación musical y acústica no la acreditan los objetos simulados.
10. Con una muestra fija, activar y desactivar **Capa sonora de la imagen
    completa**: las notas y cantidades no deben cambiar. Ajustar su volumen y
    comprobar que no tapa los cuatro instrumentos. Pausar, detener y ocultar
    la pestaña debe apagar la textura sin dejar un acorde sostenido.

## Etapa final: modo de uso sin mirar y lectores de pantalla

Por instrucción del usuario del 14-nov-2026, esta configuración y su validación
se realizan al final. Se conservan durante el desarrollo las etiquetas HTML,
el foco y los controles de teclado ya implementados.

Repetir las acciones anteriores con NVDA/Firefox, NVDA/Chrome y
VoiceOver/Safari según los equipos disponibles. Verificar anuncios de
posición, ausencia de duplicados, foco visible, zoom de 200–400 %, tamaño
móvil y contraste forzado. Comprobar también las preferencias del modo sin
mirar la pantalla cuando se implementen.

NVDA/VoiceOver son programas externos. La voz propia de la página es otra
opción y debe seguir apagada por defecto para evitar dos narraciones.

Anotar navegador, dispositivo, lector de pantalla, fecha, resultado e incidencias.
No marcar estas pruebas como aprobadas hasta realizarlas. La lentitud de red
y las pruebas con voluntarios también están pendientes.
