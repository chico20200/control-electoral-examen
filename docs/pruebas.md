# Pruebas

Última ejecución: 2026-11-25, 11:53 (Ecuador). El detalle por tarea, con los fallos intermedios, está en [`superpowers/ESTADO.md`](superpowers/ESTADO.md).

## Automáticas

| Conjunto | Comando | Resultado | Qué cubre |
|---|---|---|---|
| Unitarias | `npx ng test --no-watch` | 174/174 (12:29) | Validadores, servicios, guards, repositorios, pantallas clave, cola |
| Base de datos (pgTAP, local) | `npx supabase test db` | 54/55 (ver nota) | RLS por rol y pertenencia, `guardar_acta`, conflictos |
| Cuentas (local) | `node --test supabase/functions/tests/` | 9/9 | Altas por rol, clave inicial, confirmación y recuperación |
| Formato y estilo | `npm run lint` | Sin errores | |

**Nota:** falla solo «seis recintos precargados», porque la base local tiene un séptimo recinto creado a mano en la prueba de la tarea 6. Al renombrarlo dentro de una transacción que se deshace, ese archivo pasa 36/36. La prueba espera una base recién reiniciada.

**Límites:** ADR-005 excluye pruebas E2E. Los dobles no reemplazan al dispositivo, que se probó a mano. La prueba de cuentas usa Mailpit, no Gmail.

### Sabotajes
Para comprobar que las pruebas detectan errores, se introdujeron fallos a propósito y se restauró el código. Ejemplos: abrir la RLS, ignorar totales, aceptar fotos borrosas, mezclar dignidades, reintentar conflictos y enviar dos veces. Dos no se detectaron al principio: uno por caché del runtime (se repitió reiniciando) y otro por una prueba débil, que se reforzó.

## Verificaciones de ADR-004 en la nube

| # | Verificación | Resultado |
|---|---|---|
| 1 | El veedor A consulta la mesa de B: cero filas | ✅ con cuentas temporales, ya borradas |
| 2 | El veedor A no descarga la foto de otra mesa | ✅ con cuentas temporales |
| 3 | `signUp` público rechazado | ✅ 422 `signup_disabled` |
| 4 | Un veedor no puede crear cuentas | ✅ error de autorización |
| 5 | Totales del dashboard = suma manual | ✅ alcalde 11, 12, 13, 14, 14 = 64 (2 mesas) |

Las 1 a 4 las ejecutó el agente de IA; la 5 la comprobó el estudiante en el teléfono.

## Verificaciones de ADR-006

| # | Verificación | Resultado |
|---|---|---|
| 1 | Plugin SQLite y Gradle sin errores | ✅ |
| 2 | Modo avión: acta, foto y GPS quedan pendientes | ✅ en el teléfono |
| 3 | Al volver la red se sincroniza sola | ✅ estado `sincronizado` en el teléfono y operación registrada en la nube |
| 4 | No pisa la corrección del coordinador | ✅ dos conflictos; la nube conservó el total 19 |

## Manuales (teléfono Honor X5d y navegador)

| Requisito | Comprobado | Evidencia | Sin evidencia |
|---|---|---|---|
| R1 | Recintos y candidaturas precargados | `tarea-06`, `tarea-08`, pgTAP | |
| R2 | Cédula inválida bloqueada; cuentas por rol; correo real de confirmación en la nube (12:18, alta y enlace abierto) | `tarea-03`, `tarea-06`, registros de Auth | Captura del correo en la nube |
| R3 | Error de credenciales, cambio obligatorio; recuperación en la nube con código (12:22–12:23: correo, código verificado y clave cambiada) | `tarea-05`, `tarea-10`, registros de Auth | |
| R4 | Recintos, coordinador, resultados, avance, GPS | `tarea-06`, `tarea-08` | |
| R5 | Asignar veedores; corregir actas | `tarea-06`, `tarea-07`, `tarea-09` | Corrección con foto nueva; reasignación en pantalla |
| R6 | Registro y corrección; totales 60/61 bloqueados | `tarea-07` | |
| R7 | Foto borrosa (36) bloqueada, nítida (267) aceptada; GPS | `tarea-07` | Permisos denegados en el teléfono (solo automáticas) |
| R8 | RLS y verificaciones de ADR-004 | `tarea-02` | |
| R9 | Capas, y estados de carga, éxito, error y validación | `tarea-05`, unitarias | |
| R10 | Cola, sincronización y conflicto | `tarea-09` | Cierre de la app con cola pendiente |

Las evidencias están en [`evidencias/`](evidencias/).
