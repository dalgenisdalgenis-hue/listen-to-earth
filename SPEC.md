# Listen to Earth — Especificación para programar

*Documento autocontenido. Quien lo lea debería poder programar la aplicación sin consultar nada más. 14-nov-2026.*

---

## 0. Qué se construye

Una página web estática que convierte en música la visualización oficial de aerosoles de la NASA. Tres pistas, una sola página, manejable por completo con el teclado y sin mirar la pantalla.

**NASA Space Apps Challenge 2026, reto *The Earth Information Jukebox*.** El reto pide emparejar imágenes del Earth Information Center con sonificación generada en tiempo real, tratar la accesibilidad como tema central, equilibrar fidelidad a los datos con un resultado agradable de oír, y **documentar el porqué de las decisiones y de los algoritmos**.

## 1. Restricciones que no se negocian

- **Sitio estático:** HTML + CSS + JavaScript sin compilación. Nada de frameworks con build.
- **Tone.js local**, en `docs/vendor/`, con versión fija. **Sin CDN.**
- **Sin backend, sin base de datos, sin claves, sin descargas en tiempo de uso.** Todo viaja dentro de la página.
- **Sin ninguna llamada a servicios de IA en tiempo de uso.** El jurado abre un enlace y todo corre en su navegador. La app no puede ser un artifact ni vivir dentro de un asistente.
- **Se publica en GitHub Pages desde `/docs`** del repo `dalgenisdalgenis-hue/listen-to-earth`.
- **Tiene que funcionar con internet lento.** Usar la imagen de 1920×1080, no una mayor.
- **El audio solo arranca tras un clic o toque del usuario** (política de los navegadores).
- **Español**, pero con todos los textos en una tabla de cadenas aparte desde el primer momento, para poder añadir inglés sin rehacer la página.

## 2. Los datos

### 2.1 La imagen

`docs/assets/aerosols_5669_1920x1080.png` — SVS 5669, GEOS Aerosols, **19 de agosto de 2025, 20:00 UTC**. Imagen global.

`docs/assets/aerosols_5669_colorbar.png` — la leyenda oficial.

**Colores de los cuatro aerosoles** (RGB medidos del centro de cada rectángulo de la leyenda):

```js
const AEROSOLES = {
  blackCarbon: [210,  94,  69],   // rojo anaranjado
  dust:        [193, 154, 220],   // lila claro
  seaSalt:     [133, 170, 169],   // verde azulado grisáceo
  sulfate:     [ 83, 220,  52],   // verde brillante
};
```

⚠️ La NASA llama **carbono negro** (*Black Carbon*) al primero: el hollín de la combustión, de incendios pero también de motores y fábricas. **No decir «humo».**

### 2.2 De píxel a coordenadas

Proyección *plate carrée* completa estirada a 16:9:

```js
const W = 1920, H = 1080;
const xDeLon = lon => (lon + 180) / 360 * W;
const yDeLat = lat => (90 - lat) / 180 * H;
const lonDeX = x => x / W * 360 - 180;
const latDeY = y => 90 - y / H * 180;
```

Verificado contra Cabo Agulhas (34,8°S 20°E): predicho (1067, 749), observado (1063, 742).

- 1 píxel ≈ 20 × 18 km a la latitud de RD.
- **República Dominicana = píxel (587, 429).**
- La Española ocupa solo **33 × 15 píxeles**. Cualquier marcador mayor la tapa entera.

### 2.3 MERRA-2 (pistas 2 y 3) — ⚠️ TODAVÍA NO ESTÁ EN EL REPO

Serie mensual 1980-01 a 2024-12 de polvo fino en superficie sobre RD.
`M2TMNXAER`, variable `DUSMASS25`, DOI 10.5067/FH9A0MLJPC7N.
Caja: -71,875 / 17,5 / -68,75 / 19,5. Conversión: µg/m³ = kg/m³ × 1e9.

**Hay que generar `docs/data/merra2_rd.json` antes de poder hacer las pistas 2 y 3.** Formato sugerido: `[{ "anio": 1980, "mes": 1, "valor": 0.42 }, ...]` (540 entradas).

Valores conocidos para verificar: junio promedio 7,8 µg/m³; diciembre 0,16. Máximos: junio 2010 y junio 2014 con 12,6. Junio 2020 («Godzilla») = 11,3, puesto 10 de 540.

## 3. El algoritmo central: de color a cantidad

Para cada punto de la imagen hay que sacar cuánto hay de cada aerosol. **Se usa descomposición no negativa**, no «el color más parecido».

```
Dado el color del píxel p = [R, G, B],
encontrar pesos w = [wBC, wDust, wSeaSalt, wSulfate] >= 0
que minimicen || M·w − p ||,
donde M es la matriz 3×4 con los cuatro colores en columnas.
```

En JavaScript: 4 incógnitas, 3 ecuaciones, con restricción de no negatividad. Sirve un descenso de gradiente proyectado de pocas iteraciones, o un *active set* sencillo. Precalcularlo en Python (SciPy tiene `scipy.optimize.nnls`) y guardar los valores en JSON también es válido, y hace la página más ligera.

**Por qué no el color más parecido.** Se probó con mezclas conocidas: con 50 % polvo y 50 % sal marina, el método del parecido responde «polvo» y **borra la sal marina entera**. Eso haría mentir al selector de contaminantes. La descomposición recupera las dos.

**Qué tan bien funciona** (medido sobre la imagen real, error de reconstrucción):

| Zona | Resultado | Error |
|---|---|---|
| Polvo sobre el Sáhara (22°N 5°E) | 0,885 de polvo | 1,1 % |
| Sulfato sobre India (25°N 78°E) | 0,867 de sulfato | 0,6 % |
| Polvo en el Atlántico N (25°N 35°O) | 0,738 de polvo | 3,5 % |
| Carbono negro, sur de África (10°S 22°E) | 0,674 | 3,8 % |

### Limitaciones del método (hay que declararlas en la página)

1. **Leemos una imagen de los datos, no los datos.** Devolver un color a un número tiene error.
2. **El sistema está subdeterminado:** cuatro aerosoles y solo tres canales de color. La solución no es única. Funciona bien porque los píxeles reales suelen estar dominados por uno o dos tipos, pero **en píxeles oscuros o muy mezclados el reparto es poco fiable**. De ahí el umbral del punto 4.
3. **Polvo y sal marina son el par difícil:** sus colores están a solo **10,9°** de separación. Con ruido realista, una mezcla mitad y mitad se estima en 0,55 ± 0,12 y 0,41 ± 0,18. Sirve para saber qué domina, no para una cifra fina.
4. **Usar un umbral:** por debajo de ~0,05 de intensidad no suena nada (solo el clic suave). Evita que el ruido de píxeles oscuros produzca notas falsas.
5. **El fondo contamina sobre tierra.** La imagen lleva debajo un mapa de la Tierra con luces de ciudad: 15,8 % de los píxeles son gris neutro (tierra/hielo) y 0,23 % son luces casi blancas. Sobre mar —que es donde ocurre el viaje del polvo— la lectura es limpia (océano limpio ≈ RGB 9, 27, 17).

## 4. Las tres pistas

Las tres viven en **una sola página** con un selector. Cambiar de pista **no debe cortar el audio**: eso permite encadenar el final del barrido con los 45 años, que es el mejor momento de la demostración.

Solo los controles de la pista activa deben quedar expuestos al lector de pantalla (los demás, `aria-hidden` o fuera del árbol de accesibilidad).

### Pista 1 — «Escucha el aire»

La imagen global convertida en sonido.

**Barrido automático** (es lo principal): una línea cruza la imagen de **este a oeste**, siguiendo el polvo de África hacia el Caribe, en **~30 pasos** y **unos 15 segundos**. Se puede pausar, repetir e ir más lento.

Dos modos, que se cambian con una tecla:
- **«El viaje del polvo»** (por defecto): franja tropical **12°N a 22°N**, de **20°E a 75°O**. Es la banda por donde realmente cruza el polvo y donde está RD. En cada paso se promedia la columna de píxeles de esa franja.
- **«El mundo entero»**: barre todo el planeta.

**Exploración libre:** con las flechas se mueve un cursor por una cuadrícula de **8 × 12** y suena el aerosol de donde está. La resolución es distinta a propósito: el barrido es una melodía y necesita detalle; las flechas necesitan casillas grandes para no perderse.

**Tecla R:** lleva el cursor al píxel de RD (587, 429). **Avisar con honestidad** de que es un punto de una imagen del planeta, de pocos píxeles.

**Selector de contaminantes:** por defecto suena **solo el polvo**; con una tecla se añaden los demás, uno o todos a la vez.

#### Cómo termina el barrido (importante, y es una decisión deliberada)

Medido sobre la imagen real, el perfil del polvo en la franja tropical:

| Punto | Longitud | Polvo |
|---|---|---|
| Máximo, saliendo de África | 17°E | **0,881** |
| Valle en el Atlántico medio | 39°O | 0,047 |
| Segundo máximo, cerca del Caribe | 55°O | 0,565 |
| Desde aquí al oeste | 65°O en adelante | **0,000** |

**En el píxel de RD: polvo 0,000 y sal marina 0,478.** Ese día el polvo no llegó al país.

El barrido **llega igual hasta RD y el polvo se apaga de verdad**. No queda un bache de audio, porque una zona sin partículas suena como **clic suave** y el texto dice «polvo: nada».

**Al terminar, la página avisa:** que ese día no hubo polvo allí, que lo que hay es sal marina, y **ofrece una tecla** para oírla. **No cambiar los aerosoles automáticamente**: rompería el modelo mental de quien eligió «solo polvo» y no está mirando la pantalla.

**No acortar el barrido para que termine en un pico.** Elegir una franja de la imagen es una cosa; elegir el final para que los datos digan otra cosa es distinto, y el reto premia la fidelidad.

Perfil completo medido, 30 pasos de 20°E a 75°O (polvo):
```
0.846 0.881 0.854 0.860 0.806 0.713 0.711 0.698 0.640 0.527
0.781 0.737 0.633 0.605 0.629 0.548 0.371 0.163 0.047 0.149
0.551 0.270 0.346 0.565 0.408 0.280 0.016 0.000 0.000 0.000
```
Sal marina en los mismos pasos:
```
0.012 0.000 0.019 0.000 0.000 0.020 0.008 0.029 0.114 0.185
0.000 0.011 0.093 0.061 0.074 0.069 0.157 0.316 0.461 0.421
0.059 0.143 0.064 0.000 0.024 0.103 0.300 0.320 0.209 0.118
```

### Pista 2 — «Compara años»

Con MERRA-2 sobre RD. Elegir años con botones o con un rango desde/hasta.
- **«Mes a mes»:** hasta 4 años; en cada mes suena cada año seguido, cada uno con su timbre, pero con **la misma regla de altura**.
- **«Comparar picos»:** toca el mes de máximo polvo de cada año elegido, con opción de orden por año, de menor a mayor y de mayor a menor.
- Atajos sugeridos: «los 5 años con más polvo» y «los 5 con menos».

### Pista 3 — «Escucha 45 años»

Cada nota es un mes, de 1980 a 2024 (540 notas, unos 45 segundos). Golpe grave en cada enero. Opción de oír solo los veranos (dos botones: solo junio, y junio a agosto). Opción de elegir un tramo de años.

## 5. La regla del sonido

- **Un instrumento por tipo de aerosol**, para distinguirlos sin mirar. Polvo (cuerdas), carbono negro (tambor), sulfatos (campanas), sal marina (oleaje) — son sugerencias, lo que importa es que se distingan.
- **Más cantidad → nota más aguda.**
- **Escala pentatónica mayor**, tres octavas (15 notas) desde **Sol3 (196 Hz)**. Así nunca desafina.
  ⚠️ **Mayor es PROVISIONAL.** El equipo quiere escucharla con datos reales antes de darla por buena; puede cambiar a menor. Dejar el modo de escala en una constante fácil de cambiar.
- En las pistas 2 y 3: valor → altura con **escala logarítmica de 0,02 a 13 µg/m³**. Entre el mes más limpio y el más cargado hay más de 600 veces de diferencia; con escala lineal todos los meses bajos sonarían iguales. Además el oído percibe la altura de forma proporcional.
- **La misma regla para todos los años.** Al comparar, solo cambia el timbre. Si la regla cambiara, lo que se oye no sería una diferencia real.
- **Zona sin partículas = clic suave**, para saber que el cursor se movió. Umbral ~0,05.
- Control de volumen por instrumento y de tempo.

## 6. Accesibilidad (es tema central del reto, no un extra)

- **Teclado completo.** Cuadrícula con `role="grid"` y foco móvil; flechas para moverse, Enter reproduce, Tab sale. Botones alternativos por si NVDA captura las flechas.
- **Lector de pantalla:** etiquetas, posición anunciada, descripciones a demanda, tabla textual alternativa. Anuncios con `aria-live`.
- **Dos voces.** El texto lo lee el lector de pantalla de cada persona, con su voz y a su velocidad. Además la página trae una **voz propia** (síntesis del navegador) **apagada de entrada**, que se enciende con una tecla: así quien ve pero apaga la pantalla también oye las palabras, y quien usa lector de pantalla no oye nada dos veces. **No encenderla por defecto nunca.**
- **Modo de pantalla oscura** para explorar solo con el oído.
- **Texto descriptivo de cada sonido:** «polvo: mucho, carbono negro: nada», más la zona y la coordenada.
- Letra A−/A+, alto contraste, reducir movimiento.
- Sonido distinguible en altavoz mono de teléfono.
- **Quien no oye** sigue la información por imagen y texto, siempre presentes en paralelo.

### Atajos de teclado

| Tecla | Acción |
|---|---|
| Flechas | mover el cursor por la cuadrícula |
| Enter | tocar la celda |
| P | reproducir / pausar |
| V | cambiar modo de barrido (viaje del polvo / mundo entero) |
| **R** | ir a República Dominicana |
| 1 / 2 / 3 | cambiar de pista |
| C | comparar mes a mes |
| K | comparar picos |
| S o Esc | detener |
| D | pantalla oscura |
| M | silenciar |
| + / − | tempo |
| H o ? | ayuda |

## 7. Estructura de archivos

```
docs/
  index.html
  css/
  js/
  data/        merra2_rd.json  (falta generarlo)
  assets/      aerosols_5669_1920x1080.png, aerosols_5669_colorbar.png
  vendor/      tone.min.js + su licencia
scripts/       preparación de datos con Python (Pillow + NumPy + SciPy)
work/raw/      originales NASA (excluido de Git)
```

## 8. Qué NO hacer

- No usar un CDN para Tone.js ni para nada.
- No llamar a ninguna API en tiempo de uso.
- No entregar la app como artifact de un asistente de IA.
- No decir «humo»: es **carbono negro**.
- No usar el método del color más parecido.
- No acortar el barrido para que termine en un pico de polvo.
- No encender la voz propia por defecto.
- No afirmar que la plataforma está «validada con usuarios» mientras las pruebas no se hayan hecho.
- No afirmar que esto demuestra cambio climático.
- No presentar los valores como concentraciones en µg/m³ ni compararlos con las guías de la OMS: la imagen da intensidad relativa, y la serie de MERRA-2 es solo polvo fino.

## 9. Orden sugerido de trabajo

1. **Pista 1 primero**, que es la más larga y la que cumple el núcleo del reto.
2. Dentro de ella: leer la imagen en un canvas → descomposición de color → cuadrícula y flechas → barrido automático → selector de contaminantes → tecla R y el aviso del final.
3. Accesibilidad **desde el principio**, no al final.
4. Generar `merra2_rd.json` y hacer las pistas 2 y 3.
5. Publicar en GitHub Pages y probar en Chrome, Safari y Firefox, en computadora y en celular.

---

## Apéndice: el relato, por si ayuda a entender las decisiones

Partimos de la visualización oficial de aerosoles de la NASA y la convertimos en una orquesta. Escuchamos el polvo del Sahara cruzando el Atlántico, y descubrimos que **ese día no llegó a República Dominicana**. Para saber si eso pasa siempre, usamos MERRA-2 —producido con el mismo modelo GEOS— y escuchamos 45 años: llega cada verano.

Por eso el final del barrido se deja apagarse en vez de cortarlo antes, y por eso las tres pistas viven en la misma página sin que el audio se corte al cambiar.
