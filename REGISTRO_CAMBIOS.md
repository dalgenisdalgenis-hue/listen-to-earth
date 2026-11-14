# Registro de avances — Listen to Earth

Actualizado: 14 de noviembre de 2026 (República Dominicana).

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

## Decisiones y correcciones documentadas

- La diferencia en RD se debía a ventanas distintas: un píxel da sal marina
  0,714; 3×3 da 0,608; 5×5 da 0,478. El procedimiento vigente es 3×3.
- En el barrido, el último paso representa una franja, no el dato puntual de
  RD. El script reproduce polvo 0 y sal marina 0,300 al terminar.
- La futura tecla R usará (587,429) con ventana 3×3 y sal marina 0,608.
- Se usa el mapeo lineal exacto del SPEC para la pista 1 y las 15 frecuencias
  indicadas. La escala mayor queda en una constante, provisional.
- Las celdas no se clasifican por el color más parecido: conservan los
  cuatro pesos, aunque en esta etapa solo se sonifica el polvo.
- Para evitar anuncios duplicados, las flechas cambian el foco y dejan que
  el lector anuncie la celda. Los botones alternativos mantienen el foco en
  el botón y anuncian la nueva posición mediante aria-live.
- La página no inicia síntesis de voz. La narración opcional aún no está
  implementada. No se usa ninguna API externa en tiempo de uso.
- Los documentos actuales de la rama `assets/imagen-5669` se conservaron como
  base; los originales del ZIP y las versiones de SPEC recibidas se guardan
  en [historial/](historial/).

## Pruebas ejecutadas

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

## Siguiente paso

Barrido automático: 30 pasos de este a oeste, unos 15 segundos, modo tropical
12–22°N de 20°E a 69,9°O y modo mundial. Después: selector de aerosoles y,
por último, tecla R y aviso final, sin activar sal marina automáticamente.

Quedan también las preferencias de accesibilidad (voz opcional, pantalla
oscura, tamaño de letra, contraste y movimiento reducido), las pruebas
humanas y de navegador y la publicación en Pages. Las pistas 2 y 3 esperan
el JSON real de MERRA-2; no se han inventado datos para sustituirlo.
