# Imágenes de la NASA usadas por Listen to Earth

Crédito: **NASA's Global Modeling and Assimilation Office (GMAO) y NASA's Scientific Visualization Studio (SVS).**
La NASA no respalda entidades ajenas al gobierno de EE. UU.

## `aerosols_5669_1920x1080.png`

Visualización **SVS 5669 — GEOS Aerosols (2025)**, imagen fija del **19 de agosto de 2025, 20:00 UTC**, generada con el modelo GEOS (producto GEOS Forward Processing).

- Origen: https://svs.gsfc.nasa.gov/5669/
- Visualizadores: Joseph V. Ardizzone (NASA/GSFC) y Helen-Nicole Kostis
- Científica: Lesley Ott (NASA/GSFC)
- Tamaño: 1920 × 1080. Se eligió esta resolución a propósito: la página debe funcionar con internet lento, y las versiones de hasta 7680 × 4320 pesarían demasiado.

**Cómo se corresponde con el planeta.** Es una proyección *plate carrée* completa (todo el globo) estirada a 16:9:

```
x = (longitud + 180) / 360 * 1920
y = (90 - latitud)  / 180 * 1080
```

Verificado contra la punta sur de África (Cabo Agulhas, 34,8°S 20°E): predicho (1067, 749), observado (1063, 742). Un píxel equivale a unos 20 × 18 km a la latitud de República Dominicana, que cae en el píxel (587, 429) y ocupa 33 × 15 píxeles.

## `aerosols_5669_colorbar.png`

La barra de colores oficial de la misma visualización. Define los cuatro tipos de aerosol. Valores RGB medidos del centro de cada rectángulo:

| Nombre en la leyenda | RGB | Cómo se ve |
|---|---|---|
| Black Carbon (carbono negro) | (210, 94, 69) | rojo anaranjado |
| Dust (polvo) | (193, 154, 220) | lila claro |
| Sea Salt (sal marina) | (133, 170, 169) | verde azulado grisáceo |
| Sulfate (sulfatos) | (83, 220, 52) | verde brillante |

**Importante:** la NASA llama a ese primer tipo **carbono negro** (*Black Carbon*), el hollín de la combustión, no «humo». Viene de incendios, pero también de motores y fábricas.

## Qué miden estos colores, y qué no

- Son **intensidad relativa por tipo**, no concentración en µg/m³.
- Representan **toda la columna de aire**, no lo que se respira a nivel del suelo.
- La imagen lleva debajo un mapa base de la Tierra con hielo y luces de ciudad.
  La aplicación incluye un fondo neutro silencioso y exige evidencia cromática
  para reducir confusiones, pero una imagen compuesta conserva incertidumbre.

La aplicación sonifica **esta visualización renderizada**, no los campos
numéricos originales de GEOS. Por eso una lectura correcta debe conservar tanto
la fuerza local del color como su extensión espacial. El método por zonas
implementado por el equipo está explicado en `../../METODOLOGIA_SONIFICACION.md`.
