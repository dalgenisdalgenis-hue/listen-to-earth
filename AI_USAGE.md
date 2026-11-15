# Uso de herramientas de IA

Declaración conforme a los términos del NASA Space Apps Challenge 2026.

## Herramientas

- **Claude (Anthropic)** — asistente de programación, de análisis de datos y de redacción de borradores. El equipo aporta la idea, define las reglas de sonificación, toma las decisiones y revisa cada entrega.
- **Codex (OpenAI)** — implementación por etapas de canvas, descomposición NNLS, cuadrícula, controlador de audio, barrido, selector, tecla R y aviso final; comparación JavaScript/SciPy y documentación de pruebas y pendientes. No se han realizado pruebas humanas ni de navegador durante estas entregas.
- (Completar durante el evento con cualquier otra herramienta utilizada.)

## Qué hizo la IA y qué hizo el equipo

**El equipo decidió:** el enfoque del proyecto, el público, qué aerosoles
suenan y cómo, el recorrido de la imagen, la estructura, el idioma, la escala
musical y qué hacer cuando el barrido llega a RD sin polvo. El 15-nov-2026
también aprobó sustituir el promedio vertical completo por bandas de latitud y
representar por separado intensidad y cobertura. Las decisiones están
registradas con su fecha en los documentos de trabajo.

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
4. **Perfil del primer barrido:** la versión inicial usa 30 pasos uniformes de
   20°E a 69,9°O, con columnas de 9 píxeles y franja 12–22°N. El máximo es
   0,879, el valle muestreado es 0,052 y los últimos dos pasos tienen polvo
   0,000. El punto de RD se consulta aparte con ventana 3×3: polvo 0,000 y sal
   marina 0,608. Estos valores quedan como referencia histórica mientras se
   implementa la revisión por bandas.

## Implementación y comprobaciones con Codex (14-nov-2026)

- Los estudiantes proporcionaron el SPEC, las imágenes originales y
  `medir_imagen.py`. Las versiones recibidas se conservan sin reescribir en
  `historial/`; el `SPEC.md` activo sí se actualiza cuando el equipo aprueba una
  decisión posterior.
- Se implementó NNLS por conjunto activo. La versión zonal vigente se comparó con
  SciPy en 311 muestras puntuales y 870 bandas de recorrido, incluidas las 96
  posiciones de exploración. Los perfiles se calculan desde el PNG y no son
  una melodía pregrabada.
- La discrepancia de sal marina en RD se resolvió al explicitar la ventana de muestreo. También se registró la discrepancia pendiente de las longitudes de la tabla resumida del SPEC.
- Se añadieron pruebas de navegación y audio con objetos simulados, identificadas como tales. No acreditan el sonido real ni la accesibilidad con NVDA/VoiceOver.
- No se insertaron mediciones inventadas en la aplicación. La mezcla sintética 50/50 solo se usa en las pruebas.
- El registro de avances separa funciones implementadas, comprobaciones ejecutadas y verificaciones pendientes. La aplicación no llama a herramientas de IA durante su uso.

## Reglas de trabajo durante el evento

Actualización del selector: Codex añadió las casillas 4–7, el atajo 8,
volumen independiente y cuatro timbres sintetizados sin archivos de audio
externos. El selector conserva los pesos NNLS; solo cambia qué capas se oyen.
Se probaron las 16 combinaciones, la mezcla 50/50 y los eventos de app.js con
DOM/Tone/reloj simulados. Se documenta la distinción entre último promedio
de columna y consulta puntual; la escucha real de timbres sigue pendiente.

Actualización de la primera implementación: Codex añadió el barrido automático en ambos
modos, sus controles y una máquina de estados con reloj simulado para las
pruebas. En esa etapa se compararon 371 muestras JS/SciPy, incluidas 30 columnas del
modo mundial. Los perfiles se obtienen de la imagen y no se sustituyen por
una lista de pesos escrita a mano. No se han ejecutado pruebas de navegador
ni se presenta la validación de los controladores como prueba de audio real.

Actualización del primer cierre de la pista 1: Codex añadió R sobre el píxel exacto
(587,429) y el aviso final. Las pruebas simuladas verifican que el punto usa
sal marina 0,608, que el promedio histórico de la franja usaba 0,300 y que la página nunca cambia
automáticamente el aerosol elegido. MERRA-2 y las pistas 2 y 3 no se trabajaron.

Actualización de presentación: a partir del PDF enviado por el equipo, Codex
reorganizó la interfaz con portada, guía de uso, tarjetas para los dos recorridos,
mapa, mezclador y sección científica. No se cambiaron el algoritmo ni el audio.

Actualización de navegación y créditos: por solicitud del equipo, Codex separó
la portada, los dos recorridos y la exploración manual mediante tres destinos,
añadió créditos de NASA SVS/GMAO y Tone.js, hizo exclusivo el instrumento
principal y dejó la mezcla como opción avanzada. También retiró el clic de
ausencia; esta última decisión cambia la realimentación sonora del SPEC y
queda registrada en los documentos del proyecto.

Actualización de arquitectura: Codex convirtió la portada, el selector de
experiencias, la guía y los créditos en páginas independientes; creó URLs
propias para los tres recorridos y acercó selector, reproducción y mapa.
También programó una ambientación original con Tone.js que requiere una
pulsación explícita y está rotulada como artística, no como dato NASA. Se
añadieron pruebas simuladas de consentimiento y pausa; no sustituyen una
evaluación acústica humana.

Actualización de sonificación por capas: a partir del ejemplo Caldwell 73
aportado por el equipo, Codex añadió una textura sostenida calculada con la
suma limitada de los cuatro pesos que pasan las guardas. La textura modifica
volumen y filtro, no la altura de las notas existentes. Se acredita a SYSTEM
Sounds como inspiración y no se copia su audio.

Actualización de investigación y método (15-nov-2026): el equipo aportó el PDF
de la página de NASA Ciencia “Escucha el universo: sonificación de datos y
documental de la NASA”. Codex extrajo y leyó sus seis páginas y distinguió los
principios publicados por NASA de las decisiones propias del proyecto. El
artículo respalda la traducción explícita de información a sonido y el origen
accesible del trabajo de Chandra, pero no prescribe una fórmula para aerosoles.

Codex midió la diferencia entre promediar la columna mundial completa y
dividirla en 12 zonas: el carbono negro pasa de 1 de 30 pasos a presencia en
15 longitudes y 31 de 360 zonas. A partir de esa evidencia, Codex recomendó
bandas locales; el equipo aprobó 12 para el mundo, 5 para la ruta tropical,
altura para intensidad, volumen para cobertura y notas de unos 0,45 s. En esta
primero se actualizó la documentación para fijar la decisión antes de cambiar
el código.

Implementación zonal (15-nov-2026): Codex dividió cada franja de 9 píxeles en
12 bandas mundiales o 5 tropicales, ejecutó NNLS y las guardas por banda, y
resumió intensidad media válida y cobertura. La altura usa intensidad; el
nivel usa la raíz cuadrada de la cobertura; las notas automáticas duran 0,45 s.
Se actualizaron tablas, lectura textual, aviso final, guía, fuentes y pruebas.
JavaScript coincidió con SciPy en las 510 bandas que tenía esa primera versión
(30 pasos mundiales y 30 tropicales). Tone y el reloj simulados
comprobaron la regla, pero no acreditan timbre ni volumen percibido.

Ampliación del recorrido mundial (15-nov-2026): por solicitud del equipo,
«Planeta completo» pasó de 30 a 60 pasos, manteniendo 12 zonas de latitud por
paso, franjas de 9 píxeles y el intervalo de 0,50 s. «Viaje del polvo» conserva
30 pasos. La comprobación vigente compara 870 bandas con SciPy: 720 mundiales
y 150 tropicales. Con esta resolución, el carbono negro aparece en 28 de 60
longitudes y 55 de 720 zonas. La duración mundial nominal es de unos 30 s al
tempo normal.

- Una etapa por solicitud; cada entrega incluye qué cambió, cómo comprobarlo y qué limitaciones quedan.
- **No se afirma que una prueba pasó si no se ejecutó.**
- Datos sintéticos de desarrollo siempre identificados y separados de la demo.
- Cada estudiante puede explicar su módulo ante el jurado.
- Las pruebas humanas (teclado, lector de pantalla, voluntarios) las realiza el equipo; una revisión de código no las sustituye.
- **La aplicación entregada no llama a ninguna IA.** No hay claves, ni servicios externos, ni modelos en tiempo de uso: el jurado abre un enlace y todo se ejecuta en su navegador.
