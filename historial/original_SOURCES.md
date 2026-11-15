# Fuentes de datos y créditos

Crédito general: NASA's Scientific Visualization Studio (SVS). NASA no respalda entidades ajenas al gobierno de EE. UU.

## Luces nocturnas (P0)

- **SVS 5276 — Change in Night Lights between 2012 and 2023** (Kel Elkins, USRA; datos Black Marble / VIIRS, Suomi NPP). DOI: 10.5281/zenodo.17177652. https://svs.gsfc.nasa.gov/5276/
  - Serie anual «only lights»: 12 TIFF (2012–2023), 7680×4320, RGBA 8 bits, 8,6–10,4 MB c/u, en `frames/7680x4320_16x9_3p/nightlights_flat_2012-2023_only_lights/`.
  - **Verificado 13-nov:** incluyen el rótulo del año en el Atlántico Sur (aprox. x 3400–3650, y 2650–2760 a resolución completa); excluirlo de cualquier recorte o cálculo.
  - Mapa de cambio y leyenda (púrpura = más luz, naranja = menos luz, blanco = sin cambio): misma página.
- **SVS 5313 — versión EIC** (recurso oficial del reto; remite a 5276 como original). https://svs.gsfc.nasa.gov/5313/ — se cita como recurso del reto; para procesar se usan los fotogramas de 5276.

## Océano (P1)

- **SVS 3912 — Global Sea Surface Currents and Temperature** (Greg Shirah et al.; modelo ECCO2, MIT/JPL). https://svs.gsfc.nasa.gov/3912/
  - Imagen global 2048×1024 (`flat_global_ecco2_2028x1024.25000.jpg`) y leyenda `sst_ecco2_cbar.png` (0–32 °C, azul→rojo).
  - **Es una simulación** con rango temporal 2007-03-25 a 2008-03-03. Declararlo en la app.

## Hoja de ruta (no en esta versión)

- **SVS 5669 — GEOS Aerosols (2025):** imagen fija del 19-ago-2025, modelo GEOS; colores por tipo de partícula (sal marina azul, polvo magenta, humo naranja/rojo, sulfatos verde). https://svs.gsfc.nasa.gov/5669/
- **SVS 5011 — Lightning Events from the ISS 2017–2023:** solo videos grandes (127–580 MB), sin fotogramas sueltos; observaciones del sensor LIS, trópicos y latitudes medias. https://svs.gsfc.nasa.gov/5011/
- **Black Marble VNP46A4 v2** (datos físicos): https://doi.org/10.5067/VIIRS/VNP46A4.002

## Precedente NASA de sonificación

- **Data Sonification: Caldwell 73** (brillo y posición → volumen y altura): https://svs.gsfc.nasa.gov/13786/

## Reglas del evento

- Términos de participación (7-ago-2026): material de terceros de uso libre o código abierto; Apache 2.0 por defecto para contenido original sin licencia OSI declarada. https://www.spaceappschallenge.org/legal/
