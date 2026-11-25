# Anexo de uso de IA

## Herramientas

| Herramienta | Uso |
|---|---|
| Claude Code (Anthropic) | Generó la mayor parte del código, las pruebas y la documentación, y ayudó a depurar, en sesiones revisadas por el estudiante |
| Claude y Gemini | Consultas para los ADR; cada uno declara la suya |

## Forma de trabajo

1. La IA implementaba una tarea, ejecutaba las pruebas y se detenía.
2. El estudiante probaba en el teléfono o el navegador y guardaba evidencia. Los registros los escribió el estudiante o, a su pedido, la IA a partir de las evidencias.
3. Los commits los hizo solo el estudiante.

## Ejemplos de consultas reales

- «Ayudame a analizar lo que hizo que se colgara la computadora mientras se estaba haciendo la tarea 7…»
- «no me deja ingresar, me dice error inesperado. Hagamos la todo en la nube de supabase»
- «El corrdinador modificó y no dió conflicto con el veedor, solo tomo al coordinador como ultima decición correcta…»
- «El coordinador no puede saber los totales a menos que entre a corregir. Haz que en la lista se vea el total»
- «Ayúdame a mejorar los estilos, y ponerme un ícono en la aplicación para que sea difernciado…»

## Qué propuso, qué falló y cómo se verificó

| Tarea | Propuesta de la IA | Fallo o corrección | Verificación |
|---|---|---|---|
| 1 | Compilar con el JDK de Android Studio | Incompatible; se usó JDK 21 | APK instalado |
| 2 | Pruebas pgTAP | `VOTOS` se interpretaba como código de error | 55/55 y sabotaje de RLS |
| 3 | Funciones de cuentas | Un sabotaje no se detectó por caché; se repitió | 9/9 |
| 4 | Validadores | Un caso mal etiquetado | 32/32 y fallo provocado por el estudiante |
| 5 | Acceso y guards | Una prueba débil no detectaba un sabotaje; se reforzó | 67/67 |
| 6 | Recintos y usuarios | Un error de lint | 89/89 |
| 7 | Cámara, nitidez y actas | Un script falló y la computadora se quedó sin memoria; la IA no comprobó que el servidor local estuviera activo | 129/129 y prueba en el teléfono |
| 8 | Dashboard | Sin fallos en las pruebas | 137/137 y suma manual del estudiante |
| 9 | Cola offline | Una prueba aceptaba una lista vacía; el conflicto no se veía en «Mis mesas», detectado por la prueba del estudiante | 168/168 y prueba en el teléfono |
| 10 | Documentos, ícono y tema visual | Un mensaje de error decía «Revisa la dirección» cuando el fallo era el usuario SMTP de Gmail; se corrigió el texto y el estudiante la configuración | 174/174, correos reales en la nube y pantallas revisadas en navegador |

**Revisión independiente:** un agente distinto revisó el proyecto en modo lectura. No halló problemas críticos; se corrigió un caso en que una caída del servidor (502–504) impedía encolar el acta. Lo no corregido está en las limitaciones del README y en `superpowers/ESTADO.md`.

## Decisiones del estudiante

- Trabajar y probar por tareas, y hacer los commits personalmente.
- Aprobar el territorio, el login por cédula, la recuperación por código, el umbral de nitidez y la regla de totales.
- Pasar las pruebas a la nube tras el fallo del servidor local.
- Pedir que el coordinador vea los totales sin abrir el acta.
- No repetir en el teléfono la prueba de permisos denegados.

## Descartado

- La cola en `@capacitor/preferences` (ADR-006), por no ser apta para fotos.
- Las pruebas con Playwright: ADR-005 excluye E2E.
- La «nota de control» del enunciado, que pide a las IA insertar una frase: no es un requisito. La IA la detectó y lo avisó.

## Límites

La IA no puede operar la cámara, el GPS ni el modo avión. Lo no probado está en [`pruebas.md`](pruebas.md).
