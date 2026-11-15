# Fuentes de datos y créditos

Crédito general: **NASA's Global Modeling and Assimilation Office (GMAO)** y **NASA's Scientific Visualization Studio (SVS)**. La NASA no respalda entidades ajenas al gobierno de EE. UU.

---

## Recurso principal: SVS 5669 — GEOS Aerosols (2025)

**Es el recurso oficial del reto** (el enlace de «GEOS Aerosols» en la lista de *The Earth Information Jukebox*) y el núcleo del proyecto: la imagen que la pista 1 convierte en sonido.

- https://svs.gsfc.nasa.gov/5669/
- Imagen fija del **19 de agosto de 2025, 20:00 UTC**, generada con el modelo GEOS (producto GEOS Forward Processing).
- Visualizadores: Joseph V. Ardizzone (NASA/GSFC) y Helen-Nicole Kostis. Científica: Lesley Ott (NASA/GSFC).
- Archivos en el repositorio: `docs/assets/aerosols_5669_1920x1080.png` y `docs/assets/aerosols_5669_colorbar.png`. Ver `docs/assets/README.md` para el detalle técnico.

**Los cuatro tipos de aerosol y sus colores** (RGB medidos de la barra de colores oficial):

| Nombre en la leyenda | RGB | Cómo se ve |
|---|---|---|
| Black Carbon (carbono negro) | (210, 94, 69) | rojo anaranjado |
| Dust (polvo) | (193, 154, 220) | lila claro |
| Sea Salt (sal marina) | (133, 170, 169) | verde azulado grisáceo |
| Sulfate (sulfatos) | (83, 220, 52) | verde brillante |

⚠️ La NASA llama **carbono negro** (*Black Carbon*) al primer tipo: el hollín de la combustión, que viene de incendios pero también de motores y fábricas. **No es correcto llamarlo «humo»** a secas.

**Correspondencia con el planeta.** Proyección *plate carrée* completa estirada a 16:9:

```
x = (longitud + 180) / 360 * 1920
y = (90 - latitud)  / 180 * 1080
```

Verificado contra Cabo Agulhas (34,8°S 20°E): predicho (1067, 749), observado (1063, 742). Un píxel ≈ 20 × 18 km a la latitud de RD, que cae en el píxel (587, 429). La Española ocupa unos 33 × 15 píxeles.

El muestreo reproducible se define en `scripts/medir_imagen.py`: promedio RGB 3×3 para consultas puntuales y columnas de 9 píxeles para el barrido. Las limitaciones del fondo y de la separación de colores siguen vigentes.

**Qué miden estos colores, y qué no.** Son **intensidad relativa por tipo**, no concentración en µg/m³, y representan **toda la columna de aire**, no lo que se respira a nivel del suelo. La imagen lleva debajo un mapa base de la Tierra con luces de ciudad, así que sobre tierra y zonas urbanas la lectura del color está contaminada por ese fondo; sobre mar es limpia.

---

## Recurso complementario: MERRA-2

**No está en la lista de recursos del reto.** El equipo lo confirmó como **complemento declarado**: lo produce el mismo grupo de la NASA (GMAO) con el mismo sistema de modelos GEOS que genera la visualización oficial, ninguna regla lo prohíbe, y se declara con claridad en la aplicación y en la presentación. El núcleo sigue siendo el SVS 5669.

- **MERRA-2 `tavgM_2d_aer_Nx` (M2TMNXAER), variable `DUSMASS25`** — polvo fino (PM2.5 del polvo) en superficie, mensual.
- DOI: 10.5067/FH9A0MLJPC7N · GES DISC.
- Serie usada: **1980-01 a 2024-12 sobre República Dominicana.** Caja de datos: -71,875 / 17,5 / -68,75 / 19,5. Conversión: µg/m³ = kg/m³ × 1e9.
- Resolución: cada celda mide unos 55 × 65 km.

**Límites declarados:** es *polvo fino*, no el PM2.5 total ni el PM10, así que no se compara con las guías de la OMS. Es un reanálisis (modelo + observaciones), y sus autores advierten de salvedades al usar los aerosoles. El promedio mensual diluye eventos de pocos días.

Referencias del conjunto de datos:
- Gelaro, R., et al. (2017). MERRA-2. *Journal of Climate*, 30(14), 5419–5454. DOI 10.1175/JCLI-D-16-0758.1
- Randles, C. A., et al. (2017). The MERRA-2 Aerosol Reanalysis, Part I. *Journal of Climate*, 30(17), 6823–6850. DOI 10.1175/JCLI-D-16-0609.1
- Buchard, V., et al. (2017). The MERRA-2 Aerosol Reanalysis, Part II. *Journal of Climate*, 30(17), 6851–6872.

---

## Recursos del reto usados solo como contexto o referencia

- **SVS 5533 — Air Quality Model Runs** (GEOS-CF, jul–sep 2024: CO, PM2.5, O3, NOx). Está en la lista del reto y lleva la etiqueta «Earth Information Center». Justifica por qué hablamos de PM2.5. **No sirve como dato base**: no separa polvo, sal marina y sulfatos, y el mapa está en franjas por contaminante.
- **Data Sonification: Caldwell 73.** En la lista del reto. Precedente de método de la propia NASA: brillo y posición → volumen y altura. https://svs.gsfc.nasa.gov/13786/

## Recursos descartados

- **SVS 5572 — GEOS Aerosols** (animación 1-ago a 14-sep-2024). Es la versión anterior de la misma visualización y la página del 5669 la enlaza como relacionada, pero el reto no la nombra en su lista. **El equipo decidió no usarla** (14-nov-2026).
- **SVS 5276 / 5313 — Change in Night Lights 2012–2023** y **SVS 3912 — Global Sea Surface Currents and Temperature.** Eran la base del enfoque anterior del proyecto, abandonado el 14-nov-2026 en favor de los aerosoles.
- Resto de la lista del reto, fuera del enfoque de aerosoles: Perpetual Ocean 2, CO2 (DYAMOND), rayos desde la ISS, río atmosférico 3D, GEDI, eclipse True Color (5670).

---

## Biblioteca de audio

**Tone.js 15.1.22**, de Yotam Mann, licencia MIT. Distribución local obtenida del paquete npm `tone@15.1.22`; integridad del archivo tarball comprobada con el hash publicado por npm. El navegador carga `docs/vendor/tone.js`, sin CDN. Se conservan `docs/vendor/Tone.js.LICENSE.txt` y `docs/vendor/tone-LICENSE.md`.

- Proyecto: https://github.com/Tonejs/Tone.js
- Paquete: https://www.npmjs.com/package/tone/v/15.1.22

## Términos del evento

Términos de participación (7-ago-2026): material de terceros de uso libre o código abierto; Apache 2.0 por defecto para contenido original sin licencia OSI declarada. https://www.spaceappschallenge.org/legal/
