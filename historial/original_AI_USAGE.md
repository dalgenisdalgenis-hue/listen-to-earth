# Uso de herramientas de IA

Declaración conforme a los términos del NASA Space Apps Challenge 2026.

## Herramientas

- **Claude (Anthropic)** — asistente de programación y revisión. El equipo aporta la idea, define las reglas de sonificación y revisa cada entrega; la IA construye módulos por etapas bajo instrucción del equipo.
- (Completar durante el evento con cualquier otra herramienta utilizada.)

## Prueba de viabilidad previa (13-nov-2026, noche anterior al evento)

Para decidir si el equipo mantenía este reto, se ejecutó una prueba de viabilidad desechable con Claude sobre los recursos NASA ya descargados. **El código de esa prueba no se reutiliza en la aplicación**; sus hallazgos se documentan aquí por transparencia:

1. Los TIFF anuales de SVS 5276 son RGBA de 8 bits, 7680×4320, con rótulo del año en el Atlántico Sur (fuera de los recortes de interés).
2. Con cortes fijos (0,2/0,4/0,6/0,8) el 100 % de las celdas cae en el nivel 1; **la calibración por percentiles sobre ambos años combinados es obligatoria** (con ella: 5 niveles con 19–20 celdas cada uno).
3. India 2012→2023: 13 de 24 celdas suben de nivel, ninguna baja. Ucrania: 11 suben, 3 bajan.
4. La clasificación del océano por la leyenda (0–32 °C) produce un gradiente plausible (≈6 °C en Labrador a ≈30 °C en el Caribe) y excluye la tierra por falta de píxeles de línea.
5. Se generaron WAV de muestra para evaluar la musicalidad del enfoque.

## Reglas de trabajo durante el evento

- Una etapa por solicitud; cada entrega incluye qué cambió, cómo comprobarlo y qué limitaciones quedan.
- No se afirma que una prueba pasó si no se ejecutó.
- Datos sintéticos de desarrollo siempre identificados y separados de la demo.
- Cada estudiante puede explicar su módulo ante el jurado.
- Las pruebas humanas (teclado, lector de pantalla, voluntarios) las realiza el equipo; una revisión de código no las sustituye.
