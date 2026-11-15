# Metodología de sonificación de la pista 1

*Decisión aprobada por el equipo el 15 de noviembre de 2026. La revisión por
zonas descrita aquí está documentada antes de implementarse para que el código,
las pruebas y la explicación al jurado puedan contrastarse con una misma regla.*

## Qué se convierte en sonido

Listen to Earth sonifica los píxeles de la visualización oficial **SVS 5669 —
GEOS Aerosols**, no el conjunto numérico original del modelo GEOS. Por eso los
resultados se llaman **intensidades relativas visibles**. No son concentraciones
en µg/m³, no describen la calidad del aire en superficie y no deben compararse
con límites sanitarios.

La leyenda oficial relaciona cuatro colores con cuatro tipos de aerosol:

| Aerosol | Color de la leyenda | RGB medido | Timbre de Listen to Earth |
|---|---|---:|---|
| Carbono negro (*Black Carbon*) | rojo anaranjado | 210, 94, 69 | percusión de membrana, profunda y seca |
| Polvo (*Dust*) | lila | 193, 154, 220 | sintetizador triangular, suave y aireado |
| Sal marina (*Sea Salt*) | azul verdoso grisáceo | 133, 170, 169 | seno afinado y ruido rosa filtrado, como oleaje |
| Sulfato (*Sulfate*) | verde brillante | 83, 220, 52 | síntesis FM, brillante y metálica |

La imagen también contiene un mapa base, tierra, hielo y luces urbanas. La
descomposición de color reduce errores, pero no puede convertir el PNG de nuevo
en el campo científico original sin incertidumbre.

## Qué aprendimos de las referencias de NASA

El artículo de NASA Ciencia **“Escucha el universo: sonificación de datos y
documental de la NASA”** define la sonificación como la traducción de datos en
sonidos y explica que el proyecto de Chandra añade un paso sonoro a información
científica que normalmente se convierte en imágenes. También señala que el
trabajo surgió de proyectos dirigidos a personas ciegas y con discapacidad
visual, aunque alcanza a públicos más amplios.

La sonificación de **Caldwell 73**, creada por SYSTEM Sounds, aporta un ejemplo
con reglas auditables: posición y propiedades visuales controlan parámetros
sonoros, mientras distintos grupos visuales reciben instrumentos diferentes.
Listen to Earth toma el principio de **capas con correspondencias explícitas**,
pero no copia su audio ni sus reglas astronómicas.

Estas fuentes respaldan el método general; no prescriben cuántas zonas debe
tener un mapa de aerosoles ni una fórmula concreta de volumen. Esas decisiones
se justifican con mediciones de nuestra imagen y deben declararse como diseño
del equipo.

## Problema encontrado en el primer barrido

La primera versión promedia cada franja antes de descomponer el color. En
“Planeta completo”, una muestra mezcla hasta 9 × 1080 píxeles en un único RGB.
Una pluma localizada puede desaparecer al combinarse con océano, continentes y
otros aerosoles. Además, la nota actual dura 0,20 s dentro de un paso de 0,50 s.

El diagnóstico reproducible mostró:

- Con el promedio vertical completo, el carbono negro pasa las guardas en
  **1 de 30** pasos del recorrido mundial.
- Al analizar las mismas franjas en 12 bandas de latitud, aparece en
  **15 de 30** longitudes y en **31 de 360** zonas.
- En “Viaje del polvo” solo aparece en 2 de 30 longitudes al usar cinco zonas.
  Esto no contradice la imagen: la ruta se limita a 12–22°N y deja fuera gran
  parte del carbono negro visible en África central y austral.

Por tanto, el sonido breve del carbono negro no demuestra que falte en la
imagen; demuestra que el promedio de polo a polo destruye detalle espacial.

## Regla aprobada para los recorridos automáticos

Se conservan 30 pasos de este a oeste y franjas de 9 píxeles de ancho.

1. **Planeta completo:** cada franja se divide en 12 bandas de latitud de 15°.
2. **Viaje del polvo:** la franja 12–22°N se divide en 5 bandas de 2°.
3. En cada banda se promedia RGB localmente y después se ejecuta la misma
   descomposición NNLS sobre los cuatro colores de la leyenda.
4. Un resultado local es elegible si el peso del aerosol es al menos 0,05 y
   el residuo relativo de reconstrucción es como máximo 0,10.
5. Para cada aerosol y paso:
   - **intensidad** = media de sus pesos en las bandas elegibles;
   - **cobertura** = bandas elegibles / bandas totales.
6. La correspondencia sonora es:
   - este→oeste = avance temporal;
   - tipo de aerosol = timbre;
   - intensidad relativa = altura, con el mapeo lineal de 15 notas;
   - cobertura espacial = volumen;
   - presencia continua = nota de aproximadamente 0,45 s por paso.

La cobertura se aplicará al nivel del instrumento antes del volumen elegido
por la persona. La curva perceptual exacta debe calibrarse en navegador y en
altavoz mono; hasta completar esa escucha no se documentará como validada.

El texto de cada paso mostrará ambas dimensiones, por ejemplo: “carbono negro:
intensidad 0,28; presente en 3 de 12 zonas”. Así el público puede comprobar qué
propiedad controla cada sonido.

## Capa ambiental y música de portada

- La ambientación de la portada es una composición artística opcional. No
  representa datos.
- La textura sostenida de las experiencias resume actividad total válida y
  sirve como contexto. No identifica un aerosol concreto.
- Los cuatro instrumentos son la traducción principal y comprobable de los
  aerosoles. La textura no debe taparlos ni alterar sus pesos o notas.

## Qué permanece igual

- Colores RGB oficiales, NNLS, umbral 0,05 y residuo máximo 0,10.
- Consulta puntual de República Dominicana con ventana 3×3.
- Treinta longitudes, dirección este→oeste y tempo ajustable.
- Misma escala y misma regla de altura para los cuatro aerosoles.
- Silencio cuando ninguna banda elegible contiene el aerosol seleccionado.
- Cálculo local en el navegador, sin API, backend ni datos descargados durante
  el uso.

## Estado y criterio de aceptación

Esta metodología está **aprobada y pendiente de implementación**. La versión
publicada todavía utiliza el promedio completo de cada franja.

Antes de publicar el cambio se debe:

1. comparar JavaScript con una referencia Python para todas las bandas;
2. comprobar que carbono negro mundial pasa de un único instante a las zonas
   medidas, sin inventar sonido en el Pacífico limpio;
3. verificar que intensidad y cobertura aparecen en texto y tablas;
4. escuchar cada aerosol aislado y todos juntos en un navegador real;
5. probar volumen, duración y claridad en altavoz mono;
6. actualizar la guía pública cuando el código ya use el nuevo método.

## Fuentes

- NASA SVS 5669 — GEOS Aerosols: https://svs.gsfc.nasa.gov/5669/
- NASA Ciencia, “Escucha el universo: sonificación de datos y documental de
  la NASA”: https://ciencia.nasa.gov/universo/escucha-el-universo-sonificacion-de-datos-y-documental-de-la-nasa/
- NASA SVS 13786 — Data Sonification: Caldwell 73:
  https://svs.gsfc.nasa.gov/13786/
- SYSTEM Sounds: M. Russo y A. Santaguida, crédito indicado por NASA para la
  sonificación de Caldwell 73.
