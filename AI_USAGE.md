# Uso de herramientas de IA

Declaración conforme a los términos del NASA Space Apps Challenge 2026.

## Herramientas

- **Claude (Anthropic)** — asistente de programación, de análisis de datos y de redacción de borradores. El equipo aporta la idea, define las reglas de sonificación, toma las decisiones y revisa cada entrega.
- (Completar durante el evento con cualquier otra herramienta utilizada.)

## Qué hizo la IA y qué hizo el equipo

**El equipo decidió:** el enfoque del proyecto, el público, los ODS que se muestran, qué aerosoles suenan y cómo, el recorrido de la imagen, la estructura de la página, el idioma, quién habla, la escala musical y qué hacer cuando el barrido llega a RD sin polvo. Las decisiones están registradas una por una, con su fecha, en los documentos de trabajo del equipo.

**La IA hizo:** medir archivos, buscar y verificar fuentes, redactar borradores que el equipo corrige, y programar módulos bajo instrucción. Cuando la IA recomendó una opción, lo hizo con los datos a la vista y el equipo confirmó o cambió la decisión.

## Prueba de viabilidad previa (13-nov-2026, noche anterior al evento)

Se ejecutó una prueba desechable con Claude sobre los recursos NASA del **enfoque anterior** (luces nocturnas y océano), que el equipo abandonó al día siguiente. **Ese código no se reutiliza en la aplicación.** Se deja constancia por transparencia:

1. Los TIFF anuales de SVS 5276 son RGBA de 8 bits, 7680×4320, con rótulo del año en el Atlántico Sur.
2. Con cortes fijos (0,2/0,4/0,6/0,8) el 100 % de las celdas caía en el nivel 1; la calibración por percentiles era obligatoria.
3. India 2012→2023: 13 de 24 celdas suben de nivel. Ucrania: 11 suben, 3 bajan.
4. La clasificación del océano por la leyenda (0–32 °C) producía un gradiente plausible.
5. Se generaron WAV de muestra para evaluar la musicalidad del enfoque.

## Análisis de la imagen de aerosoles (14-nov-2026, durante el evento)

Con la imagen oficial del SVS 5669 y su barra de colores descargadas por el equipo, se midieron con Python (Pillow, NumPy, SciPy) los valores que la aplicación necesita. **Esto son mediciones sobre archivos, no estimaciones de la IA**, y cualquiera puede reproducirlas:

1. **Colores de la leyenda:** se extrajeron los cuatro rectángulos de la barra oficial. Resultado: Black Carbon (210, 94, 69), Dust (193, 154, 220), Sea Salt (133, 170, 169), Sulfate (83, 220, 52). **Esto corrigió un error que el equipo arrastraba en sus documentos**, donde tres de los cuatro colores estaban mal descritos y el carbono negro aparecía como «humo».
2. **Correspondencia con el planeta:** plate carrée completa estirada a 16:9, verificada contra Cabo Agulhas con 4 a 7 píxeles de error. La Española ocupa 33 × 15 píxeles.
3. **Método de lectura del color:** se comparó la descomposición no negativa con el método del color más parecido. La primera reconstruye las zonas de aerosol fuerte con un 1 a 5 % de error; la segunda pierde componentes de forma demostrable en mezclas. El equipo eligió la primera con estos datos delante.
4. **Perfil del barrido:** el polvo sale de África a 0,881, cae a 0,047 en mitad del Atlántico, vuelve a 0,565 cerca del Caribe y es **0,000 sobre RD**. Este hallazgo cambió el diseño del final de la pista 1.

## Reglas de trabajo durante el evento

- Una etapa por solicitud; cada entrega incluye qué cambió, cómo comprobarlo y qué limitaciones quedan.
- **No se afirma que una prueba pasó si no se ejecutó.**
- Datos sintéticos de desarrollo siempre identificados y separados de la demo.
- Cada estudiante puede explicar su módulo ante el jurado.
- Las pruebas humanas (teclado, lector de pantalla, voluntarios) las realiza el equipo; una revisión de código no las sustituye.
- **La aplicación entregada no llama a ninguna IA.** No hay claves, ni servicios externos, ni modelos en tiempo de uso: el jurado abre un enlace y todo se ejecuta en su navegador.
