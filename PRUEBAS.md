# Comprobar esta entrega

## Pruebas automatizadas de desarrollo

Python y Node se usan únicamente para comprobar el código. El navegador del
jurado no los necesita y la web no tiene proceso de compilación.

Con Pillow, NumPy y SciPy instalados según `requirements.txt`:

```bash
python scripts/medir_imagen.py docs/assets/aerosols_5669_1920x1080.png
python scripts/verificar_imagen.py
node scripts/verificar_teclado.cjs
node scripts/verificar_audio.cjs
node scripts/verificar_barrido.cjs
python scripts/verificar_archivos.py
```

El primer comando debe imprimir cuatro comprobaciones correctas. El segundo
compara 371 muestras JS con SciPy, incluidos los centros de las 96 casillas
y las 30 columnas de cada modo de barrido.
También comprueba límites de movimiento, guardas y mapeo a notas.

Las pruebas `verificar_teclado.cjs` y `verificar_audio.cjs` usan un DOM y un
Tone **simulados**. Comprueban las decisiones
de los controladores; no comprueban el navegador, la salida de sonido, la
política de activación ni un lector de pantalla.

El segundo comando ejecuta además el selector sobre 16 combinaciones × 376
resultados (371 muestras reales y cinco casos sintéticos). Comprueba que
elegir capas no cambia pesos ni notas de las otras capas. También ejecuta
app.js con el HTML real y el PNG decodificado por Pillow sobre DOM/Tone/reloj
simulados: casillas, 4–8, volúmenes, foco, recarga y cambios sin reinicio del
barrido. También comprueba R en el píxel (587,429), sus valores y nota, el
aviso final, la selección sin cambios automáticos y la repetición explícita
de la última columna. Sigue sin ser una prueba de navegador o acústica.

`verificar_barrido.cjs` usa reloj y activación de audio simulados: comprueba
30 pasos/15 segundos ideales, pausas, repeticiones, tempo, cambios de modo,
errores, callbacks tardíos y cancelación de un arranque pendiente. No mide
la precisión temporal ni el sonido de un navegador real.

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
9. Escuchar en altavoz mono. Comparar claridad de nota y clic, volumen cómodo
   y escala mayor provisional con el equipo.

## Prueba manual pendiente del barrido

1. Recargar: no debe arrancar audio ni barrido automáticamente.
2. Pulsar P o Reproducir barrido. Al tempo 100 %, comprobar los 30 pasos de
   este a oeste y una duración aproximada de 15 segundos desde el primer paso.
3. Pausar a mitad de un intervalo y esperar. El cursor y progreso deben
   permanecer quietos y no deben sonar pasos nuevos. Continuar con P:
   conserva la fracción de intervalo y no repite la nota anterior.
4. Detener con S/Esc y esperar: no deben reaparecer notas. Repetir debe tocar
   desde el paso 1, aunque antes estuviera en marcha o hubiera terminado.
5. Probar tempo 50 %, 100 % y 150 %: duraciones nominales 30, 15 y 10 s.
   Cambiar tempo durante reproducción y pausa, sin saltos de índice.
6. Con V cambiar recorrido: queda preparado para empezar de nuevo. Comprobar
   los 30 valores en la tabla, la franja tropical y el recorrido de polo a polo.
7. En el viaje del polvo, comprobar el final en 69,9°O y los últimos dos
   pasos con clic suave. La sal marina 0,300 es promedio de franja y no cambia
   por sí sola el instrumento seleccionado. El aviso final debe aparecer sin
   encender sal marina. Pulsar 7 o su botón debe repetir esa columna.
8. Moverse por la cuadrícula durante el barrido: debe pausarse y sonar la
   celda elegida. Ocultar la pestaña debe pausar; volver no debe reanudarla.
9. Iniciar y detener rápidamente mientras se activa el audio: una promesa
   tardía no debe arrancar el barrido después de detenerlo o cambiar modo.
10. Silenciar y poner volumen cero: el progreso sigue avanzando sin notas.
    Reintentar la carga y confirmar que no quedan temporizadores duplicados.
11. Pulsar R durante y después del recorrido. Debe pausarlo si está en marcha,
    mostrar un marcador pequeño sobre RD y describir el punto 3×3: polvo 0,000,
    sal marina aproximadamente 0,608. No debe presentarlo como la franja 0,300.

## Prueba manual pendiente del selector

1. Recargar: solo debe estar marcado polvo, con volumen 50 %. Antes de
   activar audio, usar casillas y teclas 4–8: no deben crearse sonidos.
2. Activar audio y explorar una celda. Con 4–7 y las casillas, comparar la
   misma muestra con distintas capas; revisar el origen mostrado (celda o
   columna). No debe presentarse un promedio de franja como dato puntual de RD.
3. Pulsar 8 desde una selección parcial: activa todos. Pulsarlo otra vez:
   solo polvo. Comprobar que conserva los cuatro volúmenes elegidos.
4. Poner una capa a volumen cero y repetir una muestra donde su peso supere
   las guardas: no debe inventarse un clic en sustitución de esa nota.
   Si ninguna capa supera las guardas, debe haber solo un clic, no uno por capa.
5. Apagar las cuatro casillas: solo queda el clic de posición. M debe
   silenciarlo también. Encender un instrumento con residuo alto no debe
   permitir una nota que las guardas habían rechazado.
6. Iniciar el barrido. Añadir o quitar capas no debe reiniciar ni saltar el
   progreso. Una capa quitada deja de sonar; una nueva entra al próximo paso.
7. Conservar solo polvo y terminar el viaje tropical. Pulsar 7: debe oírse
   sal marina de la última columna, aproximadamente 0,300, sin iniciar de
   nuevo el barrido ni presentar el valor puntual de RD (0,608).
8. Cambiar de recorrido y recargar la imagen; comprobar selección, volumen,
   foco y ausencia de listeners o notas duplicados. La recarga de imagen
   conserva ajustes; una carga nueva de la página empieza con solo polvo.
9. Escuchar cada instrumento por separado y juntos en altavoz mono. Evaluar
   si se reconocen cuerda, tambor, campanas y oleaje y si la mezcla tapa alguno.
   Esta evaluación musical y acústica no la acreditan los objetos simulados.

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
