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
python scripts/verificar_archivos.py
```

El primer comando debe imprimir cuatro comprobaciones correctas. El segundo
compara 341 muestras JS con SciPy, incluidos los centros de las 96 casillas.
También comprueba límites de movimiento, guardas y mapeo a notas.

Las pruebas `verificar_teclado.cjs` y `verificar_audio.cjs` usan un DOM y un
Tone **simulados**. Comprueban las decisiones
de los controladores; no comprueban el navegador, la salida de sonido, la
política de activación ni un lector de pantalla.

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
