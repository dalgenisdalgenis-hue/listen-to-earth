#!/usr/bin/env python3
"""
Mide la imagen oficial SVS 5669 y produce TODOS los valores de referencia
que aparecen en SPEC.md. Sirve para reproducirlos y para comprobar que una
implementación en JavaScript da lo mismo.

Uso:
    pip install -r requirements.txt
    python scripts/medir_imagen.py docs/assets/aerosols_5669_1920x1080.png

Por qué existe: los números del SPEC dependen de SOBRE QUÉ VENTANA de
píxeles se promedia. Un píxel suelto y un promedio de 5x5 dan resultados
distintos y los dos son correctos. Este script fija el procedimiento.
"""
import sys
import numpy as np
from PIL import Image
from scipy.optimize import nnls

# --- Los cuatro colores de la leyenda oficial (medidos de la barra de colores) ---
LEYENDA = {
    "carbono_negro": [210,  94,  69],   # Black Carbon
    "polvo":         [193, 154, 220],   # Dust
    "sal_marina":    [133, 170, 169],   # Sea Salt
    "sulfatos":      [ 83, 220,  52],   # Sulfate
}
TIPOS = list(LEYENDA)
M = np.stack([np.array(LEYENDA[k], float) for k in TIPOS], axis=1)  # 3x4

W, H = 1920, 1080
UMBRAL = 0.05

# ============================================================================
# REGLAS DE MUESTREO. Esto es lo que faltaba por escribir en el SPEC.
# ============================================================================
VENTANA_PUNTO = 3   # consulta puntual (tecla R, cursor): promedio de 3x3
ANCHO_BARRIDO = 9   # cada paso del barrido: columna de 9 px de ancho

# Dos guardas para que suene. Hacen falta LAS DOS:
#   1. peso >= UMBRAL          -> hay suficiente aerosol
#   2. residuo <= MAX_RESIDUO  -> la descomposicion es de fiar
# La segunda es necesaria porque el sistema esta subdeterminado (4 aerosoles,
# 3 canales de color): en pixeles oscuros encuentra repartos que ajustan mal.
# El oceano limpio del Pacifico sur, por ejemplo, da sal marina 0.089 (pasaria
# la primera guarda) pero con 20% de residuo. Las zonas de aerosol real tienen
# entre 1% y 4%.
MAX_RESIDUO = 0.10
# ============================================================================


def x_de_lon(lon): return (lon + 180.0) / 360.0 * W
def y_de_lat(lat): return (90.0 - lat) / 180.0 * H
def px(lat, lon):  return int(round(x_de_lon(lon))), int(round(y_de_lat(lat)))


def descomponer(rgb):
    """Reparte un color entre los cuatro aerosoles. Devuelve pesos >= 0."""
    w, _ = nnls(M, np.asarray(rgb, float))
    return w


def residuo(rgb, w):
    v = np.asarray(rgb, float)
    return float(np.linalg.norm(v - M @ w) / max(np.linalg.norm(v), 1e-9))


def leer_punto(a, x, y, n=VENTANA_PUNTO):
    """Consulta puntual: promedio de una ventana n x n centrada en (x, y).

    n = 3 cubre unos 60 x 54 km a la latitud de RD, parecido a una celda de
    MERRA-2 (55 x 65 km), que es lo que suena en las pistas 2 y 3.
    Un solo píxel sería ruidoso; 5x5 o más se sale de La Española, que
    solo mide 33 x 15 píxeles.
    """
    h = n // 2
    y0, y1 = max(0, y - h), min(a.shape[0], y + h + 1)
    x0, x1 = max(0, x - h), min(a.shape[1], x + h + 1)
    return a[y0:y1, x0:x1].reshape(-1, 3).mean(axis=0)


def leer_paso_barrido(a, lon, lat_sur, lat_norte, ancho=ANCHO_BARRIDO):
    """Un paso del barrido: promedio de una columna de `ancho` px,
    alta desde lat_sur hasta lat_norte."""
    x = int(round(x_de_lon(lon)))
    y_n, y_s = int(round(y_de_lat(lat_norte))), int(round(y_de_lat(lat_sur)))
    h = ancho // 2
    col = a[y_n:y_s, max(0, x - h):x + h + 1]
    return col.reshape(-1, 3).mean(axis=0)


def main():
    ruta = sys.argv[1] if len(sys.argv) > 1 else "docs/assets/aerosols_5669_1920x1080.png"
    im = Image.open(ruta).convert("RGB")
    assert im.size == (W, H), f"Se esperaba {W}x{H}, llegó {im.size}"
    a = np.array(im).astype(float)
    print(f"Imagen: {ruta}  {im.size[0]}x{im.size[1]}\n")

    # ---- 1. Por qué la ventana importa ----
    X, Y = px(18.47, -69.90)
    print(f"=== La ventana de muestreo cambia el resultado. RD = pixel ({X},{Y}) ===")
    print(f"{'ventana':>8s} {'RGB medio':>18s} | " + " ".join(f"{t[:12]:>12s}" for t in TIPOS))
    for n in (1, 3, 5, 7, 9):
        v = leer_punto(a, X, Y, n)
        w = descomponer(v)
        print(f"{n}x{n:<6d} {str(tuple(v.round(0).astype(int))):>18s} | "
              + " ".join(f"{wi:12.3f}" for wi in w))
    print(f"\n  El SPEC usa {VENTANA_PUNTO}x{VENTANA_PUNTO} para consultas puntuales.\n")

    # ---- 2. Valor de referencia de RD (tecla R) ----
    v = leer_punto(a, X, Y)
    w = descomponer(v)
    print(f"=== TECLA R: valor puntual de RD, ventana {VENTANA_PUNTO}x{VENTANA_PUNTO} ===")
    print(f"  RGB = {tuple(v.round(0).astype(int))}   residuo {residuo(v,w)*100:.1f}%")
    for t, wi in zip(TIPOS, w):
        suena = "" if wi >= UMBRAL else "   (bajo el umbral: no suena)"
        print(f"    {t:14s} {wi:.3f}{suena}")

    # ---- 3. El barrido ----
    LAT_S, LAT_N = 12.0, 22.0
    LON_E, LON_O = 20.0, -69.9
    PASOS = 30
    print(f"\n=== BARRIDO «El viaje del polvo» ===")
    print(f"  franja {LAT_S}N a {LAT_N}N, de {LON_E}E a {abs(LON_O)}O, {PASOS} pasos,"
          f" columnas de {ANCHO_BARRIDO} px")
    lons = np.linspace(LON_E, LON_O, PASOS)
    perfil = []
    for lon in lons:
        v = leer_paso_barrido(a, lon, LAT_S, LAT_N)
        perfil.append(descomponer(v))
    for nombre in ("polvo", "sal_marina"):
        i = TIPOS.index(nombre)
        vals = [p[i] for p in perfil]
        print(f"\n  {nombre}:")
        for r in range(0, PASOS, 10):
            print("    " + " ".join(f"{v:.3f}" for v in vals[r:r + 10]))
    ip = TIPOS.index("polvo")
    dust = [p[ip] for p in perfil]
    print(f"\n  maximo {max(dust):.3f} en lon {lons[int(np.argmax(dust))]:.1f}")
    print(f"  ultimo paso (lon {lons[-1]:.1f}): polvo {dust[-1]:.3f}, "
          f"sal marina {perfil[-1][TIPOS.index('sal_marina')]:.3f}")
    print("\n  OJO: el ultimo paso es un PROMEDIO DE LA FRANJA (10 grados de alto).")
    print("       La tecla R da un VALOR PUNTUAL. Son numeros distintos y no deben")
    print("       presentarse como si fueran el mismo.")

    # ---- 4. Comprobaciones que una implementacion en JS debe reproducir ----
    print("\n=== COMPROBACIONES (una implementacion correcta debe dar esto) ===")
    pruebas = [
        ("polvo sobre el Sahara",        22.0,   5.0, "polvo"),
        ("sulfato sobre India",          25.0,  78.0, "sulfatos"),
        ("carbono negro, sur de Africa", -10.0, 22.0, "carbono_negro"),
        ("oceano limpio, Pacifico sur",  -45.0,-130.0, None),
    ]
    fallos = 0
    for nombre, lat, lon, esperado in pruebas:
        x, y = px(lat, lon)
        v = leer_punto(a, x, y)
        w = descomponer(v)
        r = residuo(v, w)
        # Las dos guardas: peso suficiente Y descomposicion de fiar
        gana = TIPOS[int(np.argmax(w))] if (w.max() >= UMBRAL and r <= MAX_RESIDUO) else None
        bien = gana == esperado
        fallos += 0 if bien else 1
        print(f"  {'OK ' if bien else '!! '}{nombre:30s} domina: {str(gana):14s} "
              f"({w.max():.3f})  residuo {r*100:4.1f}%")
    print(f"\n  {'Todas las comprobaciones pasan.' if fallos == 0 else f'{fallos} FALLO(S).'}")

    print("\n=== GEOMETRIA ===")
    x1, y1 = px(20.0, -74.5); x2, y2 = px(17.5, -68.3)
    print(f"  La Espanola ocupa {x2-x1} x {y2-y1} px")
    print(f"  1 px = {360/W:.4f} lon x {180/H:.4f} lat "
          f"(~{360/W*111*np.cos(np.radians(18.5)):.0f} x {180/H*111:.0f} km a la latitud de RD)")
    xa, ya = px(-34.8, 20.0)
    print(f"  Cabo Agulhas predicho en ({xa},{ya}); observado en la imagen ~(1063,742)")


if __name__ == "__main__":
    main()
