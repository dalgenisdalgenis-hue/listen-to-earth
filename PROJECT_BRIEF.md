# Listen to Earth — Brief del proyecto

*The planet has a voice. Everyone deserves to hear it.*

NASA Space Apps Challenge 2026 · Reto: The Earth Information Jukebox
Liceo Científico Dr. Miguel Canela Lázaro · Equipo de seis estudiantes

> **Nota de versión (14-nov-2026).** Este brief se reescribió por completo. La versión anterior describía el enfoque de **luces nocturnas y océano**, que el equipo abandonó. El proyecto ahora trata de **aerosoles y del polvo del Sahara que llega a República Dominicana**.

## Qué construimos

Una plataforma web para escuchar el aire: convierte la visualización oficial de aerosoles de la NASA en música que cualquier persona puede explorar, vea o no vea. No evalúa al usuario ni le pide respuestas: invita a explorar.

Tres ideas se fusionan:
- **Ciencia:** el sonido nace de los datos de la imagen; la regla es fija y consultable.
- **Música:** debe sonar bien, no ser un pitido de laboratorio.
- **Accesibilidad:** todo se puede explorar sin ver la pantalla.

## El relato

Partimos de la visualización oficial de aerosoles del Earth Information Center y la convertimos en una orquesta. Escuchamos el polvo del Sahara cruzando el Atlántico, y descubrimos que **ese día no llegó a República Dominicana**. Para saber si eso pasa siempre, usamos MERRA-2 —producido con el mismo modelo GEOS— y escuchamos 45 años de polvo sobre RD: llega cada verano.

## Tres pistas, en una sola página con selector

1. **Escucha el aire** — la imagen global del SVS 5669 convertida en sonido. Cada tipo de aerosol es un instrumento: polvo, carbono negro, sulfatos y sal marina. Un barrido automático de unos 30 pasos recorre la imagen de este a oeste en unos 15 segundos, en dos modos: «El viaje del polvo» (franja tropical 12–22°N, termina en RD) y «El mundo entero». Con las flechas se explora libremente una cuadrícula de 8 × 12. La tecla **R** lleva a RD.
2. **Compara años** — con MERRA-2 sobre RD: elegir años con botones o con un rango; «Mes a mes» (hasta 4 años, cada uno con su timbre) y «Comparar picos» (el mes de máximo polvo de cada año).
3. **Escucha 45 años** — cada nota es un mes, de 1980 a 2024, con un golpe grave en cada enero y la opción de oír solo los veranos.

Viven en la misma página para que cambiar de pista **no corte el audio**: así se puede encadenar el barrido que se apaga sin polvo en RD con los 45 veranos en los que sí llega.

## Cómo suena

- **Un instrumento por tipo de aerosol**, para distinguirlos sin mirar. Por defecto solo suena el **polvo**; con una tecla se añaden los demás.
- **Más cantidad → nota más aguda**, siempre dentro de una **escala pentatónica mayor** de tres octavas desde Sol3 (196 Hz), para que nunca desafine. *(Mayor es provisional: se escucha con datos reales antes de darla por buena.)*
- En las pistas 2 y 3, el valor se convierte en altura con una **escala logarítmica de 0,02 a 13 µg/m³**, porque entre el mes más limpio y el más cargado hay más de 600 veces de diferencia. **La misma regla para todos los años:** al comparar solo cambia el timbre.
- **Zonas sin partículas: un clic suave**, para saber que el cursor se movió.

### El algoritmo central: de color a cantidad

La imagen pinta cada tipo de aerosol de un color distinto. Para cada punto hacemos una **descomposición no negativa** del color sobre los cuatro colores de la leyenda oficial: se calcula cuánto hay de cada tipo **a la vez**, así que donde se mezclan dos aerosoles suenan dos instrumentos.

Con el procedimiento actual de `scripts/medir_imagen.py`, la consulta puntual usa **RGB promedio de 3×3 antes de descomponer**: sobre el Sáhara da 0,874 de polvo y 1,9 % de residuo. Cada paso del barrido promedia una columna de 9 píxeles de ancho en la franja elegida. Una nota requiere peso de al menos 0,05 y residuo de hasta 0,10; un residuo bajo tampoco garantiza que el reparto entre aerosoles sea único.

En la pista 1 el mapeo de intensidad relativa a las 15 notas es **lineal**, con la fórmula del SPEC. El mapeo logarítmico corresponde a MERRA-2 en las pistas 2 y 3.

**Se descartó** el método más simple —asignar cada punto al color más parecido— porque **pierde componentes**: con una mezcla mitad polvo mitad sal marina responde «polvo» y borra la sal, lo que haría mentir al selector de contaminantes.

## Alcance

- **P0:** pista 1 completa (la imagen global, los cuatro aerosoles, los dos modos de barrido, exploración con flechas, tecla R).
- **P1:** pistas 2 y 3 con MERRA-2.
- **Regla de recorte:** si falta tiempo se reducen las pistas 2 y 3, nunca la pista 1 ni la accesibilidad.
- Hoja de ruta: una imagen propia acercada de RD con datos de superficie; más contaminantes; serie horaria para oír «Godzilla» con su intensidad real.

## Tecnología acordada

- HTML, CSS y JavaScript sin compilación; Tone.js con versión fija en `docs/vendor/`.
- Python + Pillow + NumPy + SciPy para preparar imágenes y datos → JSON estáticos (`scripts/`).
- GitHub Pages desde `docs/`. Sin backend, base de datos, cuentas ni API de pago.
- El audio solo inicia tras un gesto del usuario.
- **La aplicación vive fuera de cualquier IA:** el jurado abre un enlace propio, sin cuentas y sin llamadas a servicios de IA en tiempo de uso. Las maquetas hechas en un asistente son prototipo, nunca la entrega.
- **Español, con la estructura preparada desde el primer día** para añadir un botón de inglés sin rehacer la página.

## Accesibilidad desde el primer día

- Teclado completo: flechas en la cuadrícula (`role="grid"`, foco móvil), Enter reproduce, Tab sale. Botones alternativos si NVDA captura flechas.
- Lector de pantalla: etiquetas, posición anunciada, descripciones a demanda, tabla textual alternativa. Solo se exponen los controles de la pista activa.
- **Dos voces:** el texto lo lee el lector de pantalla de cada persona; además hay una **voz propia apagada de entrada**, que se enciende con una tecla, para quien ve pero apaga la pantalla. Así nadie oye nada dos veces.
- Modo pantalla oscura. Sonido distinguible en altavoz mono de teléfono.
- Primera prueba con NVDA el sábado por la tarde, no el domingo.

## Límites que la app declara

- **Leemos una imagen de los datos, no los datos.** Devolver un color a un número tiene error, sobre todo donde dos aerosoles se superponen.
- **Polvo y sal marina son el par difícil:** sus colores están a solo 10,9° de separación. Una mezcla mitad y mitad se estima en 0,55 ± 0,12 y 0,41 ± 0,18. Sirve para saber qué domina, no para dar una cifra fina.
- **Sobre tierra y ciudades la lectura está contaminada** por el mapa base: un 15,8 % de los píxeles son gris neutro y un 0,23 % son luces de ciudad. Sobre mar, donde ocurre el viaje del polvo, es limpia.
- La imagen muestra **intensidad relativa por tipo**, no µg/m³, y la **columna completa de aire**, no la superficie.
- **Un instante, no un patrón:** la imagen es del 19 de agosto de 2025, y ese día el polvo no llegó a RD. De una sola imagen no se concluye nada del patrón anual.
- **Elegimos una franja de la imagen** en el modo «viaje del polvo», y lo decimos. Pero **no cortamos el recorrido donde nos convenía:** el barrido llega hasta RD aunque allí el polvo sea cero.
- MERRA-2 es **solo polvo fino**, mensual, en celdas de 55 × 65 km; no se compara con las guías de la OMS.
- **No se afirma cambio climático.** La serie parece subir en verano, pero antes de 2000 había menos observaciones de aerosoles y los años bajos de 1982 y 1991–93 coinciden con erupciones volcánicas.
- **No es una herramienta de salud ni de alerta,** y no mide indicadores de los ODS.

## Validación

**Estado de esta entrega:** implementados canvas, descomposición y cuadrícula con sonificación del polvo. Se ejecutaron comparaciones numéricas de 341 muestras y pruebas de controladores con DOM/Tone simulados. Las pruebas en navegador, de audio real y con lectores de pantalla siguen pendientes. Ver [REGISTRO_CAMBIOS.md](REGISTRO_CAMBIOS.md) y [PRUEBAS.md](PRUEBAS.md).

Al menos 5 voluntarios exploran ~5 minutos y cuentan qué sintieron y entendieron. Con consentimiento; sin nombres, voces ni imágenes; autorización de tutores si hay menores. Si no participan personas ciegas o con baja visión, esa validación se declara pendiente. **No se afirman efectos educativos y no se presenta la plataforma como «validada con usuarios» mientras las pruebas no se hayan hecho.**

## Reglas de trabajo con IA

La IA es asistente de programación y de redacción: el equipo aporta la idea, decide las reglas y revisa el resultado. Una etapa por solicitud; cada entrega con comprobación concreta y explicación que el responsable del módulo pueda dar ante el jurado. No afirmar que una prueba pasó sin ejecutarla. Datos sintéticos siempre identificados. Ver `AI_USAGE.md`.
