# Listen to Earth — Brief del proyecto

*The planet has a voice. Everyone deserves to hear it.*

NASA Space Apps Challenge 2026 · Reto: The Earth Information Jukebox
Liceo Científico Dr. Miguel Canela Lázaro · Equipo de seis estudiantes

## Qué construimos

Una plataforma web para escuchar la Tierra: convierte las visualizaciones científicas de la NASA en música y sonido que cualquier persona puede explorar, vea o no vea. No evalúa al usuario ni le pide respuestas: invita a explorar, experimentar y conectar con el planeta.

Tres ideas se fusionan:
- **Ciencia:** el sonido nace de los datos de la imagen; la regla es fija y consultable.
- **Música:** debe sonar bien, no ser un pitido de laboratorio.
- **Accesibilidad:** todo se puede explorar sin ver la pantalla.

## Tres experiencias

1. **Escucha la Tierra (exploración libre):** elegir un fenómeno, ver la visualización NASA y oír una composición generada de sus características. Cada región tiene identidad sonora propia.
2. **Escucha el cambio (exploración temporal):** viajar entre 2012 y 2023 en la misma región, sin preguntas. La música se transforma porque los datos se transforman.
3. **La orquesta de la Tierra (creación):** mezclar capas (luces nocturnas y océano), cada una con su instrumento, interruptor y volumen.

## Cómo suena

- Imagen dividida en cuadrícula de 4 × 6 celdas; cada celda da un valor (brillo visual medio).
- Más valor → nota más aguda, en escala pentatónica. Misma regla y escala para todos los años.
- **Los cortes entre notas se calibran por percentiles sobre celdas de ambos años combinados y se congelan** (verificado el 13-nov: cortes fijos 0,2/0,4/0,6/0,8 colapsan el 100 % de las celdas al nivel 1).
- Barrido de izquierda a derecha y de arriba abajo: 24 notas en 12 s (0,35 s tono + 0,15 s pausa).
- Luces: timbre brillante y percusivo. Océano: pad suave y sostenido, por categoría de temperatura según la leyenda NASA (0–32 °C).
- Modo científico: tonos simples equivalentes. El cambio de modo no altera qué nota corresponde a qué celda.

## Alcance de las 48 horas

- **P0:** Experiencias 1 y 2 completas con luces nocturnas.
- **P1:** Orquesta mínima de dos capas (luces + océano).
- **Regla de recorte:** si falta tiempo se reduce la orquesta, nunca las experiencias 1 y 2.
- Hoja de ruta: aerosoles (SVS 5669), rayos (SVS 5011), 12 años con control deslizante.

## Tecnología acordada

- HTML, CSS y JavaScript sin compilación; Tone.js con versión fija en `docs/vendor/`.
- Python + Pillow + NumPy para preparar imágenes → JSON estáticos (`scripts/`).
- GitHub Pages desde `docs/`. Sin backend, base de datos, cuentas ni API de pago.
- El audio solo inicia tras un gesto del usuario.

## Accesibilidad desde el primer día

- Teclado completo: flechas en la cuadrícula (`role="grid"`, foco móvil), Enter reproduce, Tab sale. Botones alternativos si NVDA captura flechas.
- Lector de pantalla: etiquetas, posición anunciada, descripciones a demanda, tabla textual alternativa.
- Modo pantalla oscura. Sonido distinguible en altavoz mono de teléfono.
- Primera prueba con NVDA el sábado por la tarde, no el domingo.

## Límites que la app declara

- El brillo es un indicador visual relativo de la visualización, **no radiancia ni consumo eléctrico**; no se afirman causas.
- El océano es una **simulación** (ECCO2, 2007–2008); las luces son 2012–2023: la orquesta es una composición artística de dos visualizaciones, no una representación simultánea.
- La temperatura del océano se estima por el color de las líneas según la leyenda, sin precisión física adicional.

## Validación

Al menos 5 voluntarios exploran ~5 minutos y cuentan qué sintieron y entendieron. Con consentimiento; sin nombres, voces ni imágenes; autorización de tutores si hay menores. Si no participan personas ciegas o con baja visión, esa validación se declara pendiente. No se afirman efectos educativos.

## Reglas de trabajo con IA

La IA es asistente de programación: el equipo aporta la idea, decide las reglas y revisa el resultado. Una etapa por solicitud; cada entrega con comprobación concreta y explicación que el responsable del módulo pueda dar ante el jurado. No afirmar que una prueba pasó sin ejecutarla. Datos sintéticos siempre identificados. Ver `AI_USAGE.md`.
