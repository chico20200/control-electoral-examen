# ESTADO del proyecto

**Entrega:** miércoles 2026-11-25, 14:00 (Ecuador) · **Plan:** `docs/superpowers/plans/2026-11-23-control-electoral.md`

## Cómo trabajamos

1. El agente implementa una tarea, corre las pruebas automáticas, anota aquí el resultado y se detiene.
2. El estudiante sigue las instrucciones de prueba y llena el registro (✅ / ❌, fecha y hora, observaciones). Las capturas van en `docs/evidencias/tarea-NN/`.
3. Si falla, se corrige y se repite la prueba, conservando el intento anterior.
4. Si pasa, **el estudiante hace el commit**, anota el hash y avisa para continuar.

Estados: ⬜ sin iniciar · 🔵 en curso · 🟡 lista para probar · ✅ aprobada y con commit · ❌ con fallos

## Cómo capturar evidencia

- **Carpeta y nombre:** `docs/evidencias/tarea-NN/NN-que-muestra.png`, por ejemplo `01-pruebas-pass.png`.
- **Terminal:** que se vean el comando y el resultado final; ejecuta `date` antes para dejar la hora.
- **Navegador:** pantalla completa con la URL visible.
- **Teléfono:** captura normal, o `~/Android/Sdk/platform-tools/adb exec-out screencap -p > docs/evidencias/tarea-NN/nombre.png`.
- **Flujos (cámara, offline):** video corto con `adb shell screenrecord /sdcard/demo.mp4` (Ctrl+C para cortar) y `adb pull /sdcard/demo.mp4`. No subas videos pesados al repo: enlázalos.
- **Antes y después:** en errores, conflictos y sincronización, captura ambos estados.
- **También los fallos:** guarda el error y su corrección; sirve para el anexo de IA.
- **Privacidad:** las evidencias se suben a git. Usa datos ficticios y oculta claves, tokens y correos. No captures la salida de `supabase start` o `status`, que muestra claves.

## Avance

| # | Tarea | Estado | Commit |
|---|---|---|---|
| 1 | Proyecto base | ✅ | 034e2d8 |
| 2 | Base de datos, RLS y RPC | ✅ | 92f4225 |
| 3 | Edge Functions de cuentas | ✅ | c7c6c42 |
| 4 | Validadores | 🟡 | |
| 5 | Acceso, guards y navegación | ⬜ | |
| 6 | Coordinadores | ⬜ | |
| 7 | Captura y actas | ⬜ | |
| 8 | Dashboard provincial | ⬜ | |
| 9 | Offline y sincronización | ⬜ | |
| 10 | Despliegue y entrega | ⬜ | |

## Decisiones

| N.º | Fecha | Decisión | Motivo | Estado |
|---|---|---|---|---|
| D1 | 2026-11-23 | Los commits los hace solo el estudiante | Pedido del estudiante | Acordada |
| D2 | 2026-11-23 | Usar el proyecto Supabase que ya existe | Ya lo tiene el estudiante | Acordada |
| D3 | 2026-11-23 | Revisión y registro de prueba en cada tarea | Pedido del estudiante | Acordada |
| D4 | 2026-11-23 | Pruebas en el teléfono Android del estudiante | Disponible | Acordada |
| D5 | 2026-11-23 | Pichincha / Quito con datos ficticios | R1 deja elegir | Acordada |
| D6 | 2026-11-23 | Login por cédula con Edge Function | No expone correos | Acordada |
| D7 | 2026-11-23 | Recuperación con código por correo | Evita deep links | Acordada |
| D8 | 2026-11-23 | Nitidez por varianza del Laplaciano, umbral inicial 100 | R7 | Acordada |
| D9 | 2026-11-23 | Votos + blancos + nulos = sufragantes | R6 | Acordada |
| D10 | 2026-11-23 | Correo: Gmail con contraseña de aplicación (SMTP de Supabase) | R2 y R3; sin desarrollo | Acordada |
| D11 | 2026-11-23 | Modalidad Native con revisión del estudiante por tarea | Contexto continuo y plazo corto | Acordada |
| D12 | 2026-11-23 | JDK 21 (`~/.jdks/jbr-21.0.11`) para compilar Android | Gradle 8.14.3 falla con el Java 25 de Android Studio | Acordada (técnica) |
| D13 | 2026-11-23 | Pruebas unitarias con Vitest vía `ng test`; se quitó Playwright | Es lo que genera Ionic 9; ADR-005 excluye E2E | Acordada (técnica) |
| D14 | 2026-11-23 | ADR movidos a `docs/adr/` y renombrados con título corto | Sección 5.2 y Anexo A.2; contenido intacto | Acordada (técnica) |
| D15 | 2026-11-23 | `docs/superpowers/` (plan y ESTADO) no se sube; el resto de `docs/` sí | Pedido del estudiante; los ADR deben estar en el repo | Reemplazada por D23 |
| D16 | 2026-11-23 | Tabla `operaciones` con cada envío aplicado | Un reintento no duplica ni da falso conflicto, aunque el coordinador ya haya corregido | Acordada (técnica) |
| D17 | 2026-11-23 | El acta exige foto existente de su mesa y GPS; errores nuevos `VOTOS` y `FOTO` | R7, validado en el servidor | Acordada (técnica) |
| D18 | 2026-11-23 | El id del acta lo genera el servidor; el envío se identifica con `operacion_id` | Evita ids duplicados entre dispositivos | Acordada (técnica) |
| D19 | 2026-11-23 | `.claude/` no se sube a git | Guía de trabajo local, como `docs/superpowers/` | Reemplazada por D23 |
| D20 | 2026-11-23 | Las funciones verifican la sesión por dentro (`verify_jwt = false` + `getUser`) | No depende del tipo de clave del proyecto y da errores uniformes | Acordada (técnica) |
| D21 | 2026-11-23 | Si falla el perfil o el correo, se borra la cuenta recién creada | Evita cuentas a medias | Acordada (técnica) |
| D22 | 2026-11-23 | Cambiar o recuperar la clave cierra las demás sesiones | Un acceso robado no puede renovarse | Acordada (técnica) |
| D23 | 2026-11-24 | Por ahora `.claude/`, el plan y ESTADO se suben a git; solo `DEFENSA.md` queda fuera. Se corrige al final | Pedido del estudiante; reemplaza D15 y D19 | Acordada (provisional) |
| D24 | 2026-11-24 | `enteroNoNegativo` acepta como máximo 6 cifras | Mismo rango que `guardar_acta` | Acordada (técnica) |
| D25 | 2026-11-24 | `totalesValidator` no informa error mientras falte o sea inválido un campo | Evita dos mensajes por el mismo problema; `enteroNoNegativo` ya bloquea el formulario | Acordada (técnica) |

Si una decisión contradice un ADR aceptado, se escribe un ADR de reemplazo en `docs/adr/`.

## Tareas

### Tarea 1: Proyecto base

**Archivos entregados:** proyecto Ionic en la raíz, `android/`, `src/app/core/models/index.ts`, `docs/adr/`, `.gitignore`, plan y este documento.

**Pruebas automáticas (agente), 2026-11-23:** `ionic build` sin errores · `cap sync android` con 8 plugins (incluye SQLite) · `ng test` 2/2 · lint sin errores · `assembleDebug`: 1.er intento falló con Java 25, 2.º `BUILD SUCCESSFUL` con JDK 21.

**APK:** `android/app/build/outputs/apk/debug/app-debug.apk`

**Tu prueba:**
1. Ejecutar `ionic serve` y abrir la app en el navegador.
2. Instalar el APK debug en el teléfono y abrirlo.

**Se aprueba si / evidencia:** La app abre en ambos; captura del APK instalado.

**Capturas recomendadas:** Pantalla Blank en navegador y en teléfono; `BUILD SUCCESSFUL`.

| Intento | Fecha y hora | Resultado | Observaciones | Evidencia |
|---|---|---|---|---|
| 1 | 23/11/2026|Se abrió correactamente la página blank en escritorio y celular |Ninguna |img_1.png, img_2.png|

**Commit sugerido:** `chore: proyecto base Ionic Angular` · **Hash:** 
commit hash: 034e2d8
### Tarea 2: Base de datos, RLS y RPC

**Archivos entregados:** `supabase/migrations/0001` a `0003`, `supabase/seed.sql`, `supabase/tests/` (2 archivos), `supabase/config.toml`, `supabase/.gitignore`.

**Pruebas automáticas (agente):** 2026-11-23: RED sin tablas (0 pruebas ejecutadas) · GREEN 55/55 · sabotaje (RLS de `jrvs` y `actas` apagada): 8 pruebas fallan, luego restaurado y 55/55 · `db lint` sin avisos. Intermedio: 4 pruebas fallaron por la firma de `throws_ok`, corregidas. Todo en Supabase local; la nube no se ha tocado.

**Para qué sirve:** demuestra que la seguridad está en la base de datos (R8), no en las pantallas: un veedor con sesión válida no puede leer ni modificar mesas ajenas. También comprueba datos iniciales (R1), bloqueo hasta cambiar la clave (R3), totales (R6) y conflictos (R10).

**Cómo está construida:**
1. *Preparar:* `begin` abre una transacción y crea 2 recintos, 7 usuarios y 3 mesas. A es veedor de R1; B, de R2.
2. *Actuar:* `pg_temp.como(id)` pone el usuario en `request.jwt.claims` y cambia al rol `authenticated`; PostgreSQL aplica la RLS como si llegara desde la app.
3. *Comprobar:* `is(consulta, esperado)` compara valores; `throws_ok` exige que falle con un error concreto; `lives_ok` exige que no falle. `42501` es «permiso denegado» de PostgreSQL.
4. *Limpiar:* `rollback` deshace todo, así que se puede repetir.

**Por qué es fiable:** hay casos positivos (A sí ve y sube fotos a su mesa; el provincial ve el acta de B), de modo que un «0 filas» no se debe a que falten datos. Al apagar la RLS de `jrvs` y `actas` fallan 8 pruebas.

**Qué no cubre:** la app, la red ni el proyecto en la nube; eso se prueba en las tareas 7 y 10.

**Tu prueba:**
1. Ejecutar `npx supabase db reset && npx supabase test db`.
2. Localizar en la salida el caso «veedor A no accede a mesa de B».

**Se aprueba si / evidencia:** Todas las pruebas en PASS; captura de la terminal (evidencia de R8).

**Capturas recomendadas:** Final de `test db` con `Tests=55` y `PASS`; las 7 líneas de `npx supabase test db --debug 2>&1 | grep R8`; tablas `recintos` y `jrvs` en Studio.

| Intento | Fecha y hora | Resultado | Observaciones | Evidencia |
|---|---|---|---|---|
| 1 | 22:55 23/11/2026 | ✅ Las 7 pruebas R8 pasan: el veedor A solo ve su mesa; no ve mesa, actas, votos ni foto de B, y no escribe ni sube fotos en ella | La captura incluye arriba `Result: PASS` (parcialmente cortado). Revisión de tablas en Studio: sin captura | `docs/evidencias/tarea-02/img_1.png` |

**Commit sugerido:** `feat: esquema, RLS y RPC de actas` · **Hash:** 92f4225
commit hash: 92f4225
### Tarea 3: Edge Functions de cuentas

**Archivos entregados:** `supabase/functions/` (5 funciones, `_shared/` y `tests/cuentas.test.mjs`), `supabase/templates/` (2), `scripts/crear-provincial.mjs`, `supabase/config.toml`.

**Pruebas automáticas (agente):** 2026-11-23: RED 0/9 · GREEN 9/9, repetido · `test db` 55/55 · lint y formato sin errores (antes, 5 archivos por formatear) · script del provincial probado en local. Sabotajes: el primero no se detectó porque el runtime tenía la función en caché; al reiniciarlo, permitir que un veedor cree cuentas falla 1 prueba, y permitir `Ecuador2026` como clave nueva falla 6. Restaurado: 9/9. La nube no se ha tocado. · 2026-11-24 22:21: el contenedor `supabase_edge_runtime_Examen` estaba detenido (señal 15, causa no determinada); tras `docker start`, 9/9 (agente; no sustituye la prueba del estudiante).

**Para qué sirve:** demuestra que no hay autorregistro y que cada rol solo crea las cuentas que le corresponden (R2), y que login, cambio obligatorio y recuperación son seguros (R3).

**Cómo está construida** (`supabase/functions/tests/cuentas.test.mjs`):
1. *Preparar (`before`):* crea 2 recintos y un provincial; genera cédulas válidas distintas en cada corrida.
2. *Actuar:* llama a las funciones por HTTP como lo hará la app. Los correos se leen en Mailpit: de uno abre el enlace y de otro extrae el código.
3. *Comprobar:* `assert` compara estado HTTP y código de error, y consulta la base para ver el efecto real.
4. *Limpiar (`after`):* borra los usuarios y recintos creados.

Las pruebas van en orden: el provincial activado crea al coordinador, y este al veedor. Si una falla, las siguientes suelen fallar también.

**Por qué es fiable:** usa el servicio de autenticación y correos reales del entorno local, no simulaciones; e incluye intentos de abuso (rol falso en el cuerpo, veedor que crea cuentas, código reutilizado). Dos sabotajes la hicieron fallar.

**Qué no cubre:** el envío por Gmail y los límites de intentos de la nube (Tarea 10), ni las pantallas (Tarea 5).

**Tu prueba:**
1. Ejecutar `date; node --test supabase/functions/tests/` con Supabase local activo.
2. Abrir Mailpit (http://127.0.0.1:54324) y ver el correo «Confirma tu cuenta» y el de «Recupera tu clave» con su código.

**Se aprueba si / evidencia:** PASS; captura del correo de confirmación y del código.

**Capturas recomendadas:** Resumen de `node --test`; correo de confirmación y correo con código en Mailpit.

| Intento | Fecha y hora | Resultado | Observaciones | Evidencia |
|---|---|---|---|---|
| 1 | 22:47 24/11/2026| 32 de los 32 test pasarón como se espera | | 01-pruebas-pass.img|
| 2 | 22:47 24/11/2026| 31 de los 32 test pasarón como se espera al cambiar un dígito en el caso de pichincha | | 02-fallo-provocado.img|

**Commit sugerido:** `feat: funciones de cuentas` · **Hash:** 

### Tarea 4: Validadores

**Archivos entregados:** `src/app/core/validators/{cedula,acta}.validator.ts` y sus `.spec.ts`.

**Pruebas automáticas (agente), 2026-11-24:** RED 1: no compila, faltan los módulos · RED 2 con funciones vacías: 22 fallan y 10 pasan (casos que esperan `null`, entre otros) · GREEN 32/32 · lint: 2 errores (`import type`), corregidos · build correcto. Intermedio: un caso propio estaba mal etiquetado (`2510034065` ya tiene el verificador correcto); corregido. Sabotajes, todos detectados: tercer dígito hasta 6 (1 falla), provincia 25 (1), módulo 10 sin restar 9 (5), suma sin nulos (3), sin límite de cifras (1). Un primer intento de sabotajes no mostró resultados por los colores de la salida; se repitió. Final 22:34: 32/32.

**Para qué sirve:** comprueba que la cédula se valida de verdad (R2) y que un acta cuyos números no cuadran se detecta en el formulario (R6).

**Cómo está construida:** pruebas unitarias con Vitest; cada `it.each` es una tabla de casos. Se crean controles de Reactive Forms con un valor, se llama al validador y se compara con `toEqual` o `toBeNull`. No necesita red ni base.

**Por qué es fiable:** incluye casos válidos e inválidos; las provincias 00 y 25 y el tercer dígito 6 tienen verificador correcto, así que solo los detiene la regla que nombran. Cinco sabotajes la hicieron fallar.

**Qué no cubre:** que la cédula pertenezca a alguien, los mensajes en pantalla (tareas 6 y 7) ni la protección del servidor, que es independiente (`crear-usuario` y `guardar_acta`, tareas 2 y 3).

**Tu prueba:**
1. Ejecutar `date; npx ng test --no-watch`: debe terminar con `Tests 32 passed`.
2. En `cedula.validator.spec.ts`, cambiar `1710034065` por `1710034066` en el caso «Pichincha», repetir (`1 failed`) y deshacer.

**Se aprueba si / evidencia:** PASS, y FAIL al alterarlo; captura.

**Capturas recomendadas:** `01-pruebas-pass.png` y `02-fallo-provocado.png`, en `docs/evidencias/tarea-04/`.

| Intento | Fecha y hora | Resultado | Observaciones | Evidencia |
|---|---|---|---|---|
| 1 | | | | |

**Commit sugerido:** `feat: validadores de cédula y acta` · **Hash:** 

### Tarea 5: Acceso, guards y navegación

**Archivos entregados:** _pendiente_

**Pruebas automáticas (agente):** _pendiente_

**Tu prueba:**
1. Entrar con Ecuador2026: debe exigir cambio de clave.
2. Como veedor, escribir la URL de provincial.
3. Recuperar la clave con el código.

**Se aprueba si / evidencia:** Cambio forzado, redirección y recuperación correctas.

**Capturas recomendadas:** Cambio de clave obligatorio; URL antes y después de la redirección; error de credenciales.

| Intento | Fecha y hora | Resultado | Observaciones | Evidencia |
|---|---|---|---|---|
| 1 | | | | |

**Commit sugerido:** `feat: acceso y guards` · **Hash:** 

### Tarea 6: Coordinadores

**Archivos entregados:** _pendiente_

**Pruebas automáticas (agente):** _pendiente_

**Tu prueba:**
1. Crear un recinto y ver sus JRV.
2. Crear coordinador y veedor; probar cédula inválida.
3. Asignar y reasignar un veedor.

**Se aprueba si / evidencia:** Datos visibles y cédula inválida bloqueada.

**Capturas recomendadas:** Cédula inválida bloqueada; recinto con sus JRV; mesa antes y después de reasignar.

| Intento | Fecha y hora | Resultado | Observaciones | Evidencia |
|---|---|---|---|---|
| 1 | | | | |

**Commit sugerido:** `feat: gestión de recintos y usuarios` · **Hash:** 

### Tarea 7: Captura y actas

**Archivos entregados:** _pendiente_

**Pruebas automáticas (agente):** _pendiente_

**Tu prueba:**
1. Registrar alcalde y prefecto con foto y GPS.
2. Probar foto borrosa, permisos denegados y totales que no cuadran.
3. Corregir como coordinador.
4. Instalar el APK de prueba.

**Se aprueba si / evidencia:** Errores claros sin perder datos; anotar nitidez medida y umbral final.

**Capturas recomendadas:** Foto nítida y borrosa con su valor; permiso denegado; totales incorrectos; acta con GPS; fila en la base.

| Intento | Fecha y hora | Resultado | Observaciones | Evidencia |
|---|---|---|---|---|
| 1 | | | | |

**Commit sugerido:** `feat: registro y corrección de actas` · **Hash:** 

### Tarea 8: Dashboard provincial

**Archivos entregados:** _pendiente_

**Pruebas automáticas (agente):** _pendiente_

**Tu prueba:**
1. Sumar a mano dos actas y comparar.
2. Filtrar por recinto y consolidado.

**Se aprueba si / evidencia:** Totales iguales; anotar los números comparados.

**Capturas recomendadas:** Dashboard consolidado y por recinto junto a la suma manual.

| Intento | Fecha y hora | Resultado | Observaciones | Evidencia |
|---|---|---|---|---|
| 1 | | | | |

**Commit sugerido:** `feat: dashboard provincial` · **Hash:** 

### Tarea 9: Offline y sincronización

**Archivos entregados:** _pendiente_

**Pruebas automáticas (agente):** _pendiente_

**Tu prueba:**
1. Modo avión: registrar acta y ver que queda pendiente.
2. Quitar modo avión: se envía sola.
3. Corregir antes como coordinador: debe quedar en conflicto.

**Se aprueba si / evidencia:** Los 4 pasos de ADR-006; capturas de antes y después.

**Capturas recomendadas:** Pendiente en modo avión; sincronizado; conflicto. Mejor en video.

| Intento | Fecha y hora | Resultado | Observaciones | Evidencia |
|---|---|---|---|---|
| 1 | | | | |

**Commit sugerido:** `feat: cola offline` · **Hash:** 

### Tarea 10: Despliegue y entrega

**Archivos entregados:** _pendiente_

**Pruebas automáticas (agente):** _pendiente_

**Tu prueba:**
1. Repetir en la nube las 5 verificaciones de ADR-004.
2. Instalar el APK final en un teléfono limpio y recorrer los tres roles.

**Se aprueba si / evidencia:** Todo correcto; enlace o ruta del APK.

**Capturas recomendadas:** Las 5 pruebas de ADR-004; APK instalado; un recorrido por rol.

| Intento | Fecha y hora | Resultado | Observaciones | Evidencia |
|---|---|---|---|---|
| 1 | | | | |

**Commit sugerido:** `docs: entrega` · **Hash:** 
