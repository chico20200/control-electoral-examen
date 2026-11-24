# Control Electoral Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App Android para registrar, corregir y consolidar actas de escrutinio con tres roles, cumpliendo R1–R10.

**Architecture:** Páginas → servicios (Signals) → repositorios → Supabase. La autorización vive en PostgreSQL (RLS y la RPC `guardar_acta`) y en Edge Functions. La cola SQLite se sitúa entre `ActasService` y `ActasRepo`.

**Tech Stack:** Ionic Angular standalone, Capacitor 8, Supabase, `@capacitor-community/sqlite`, pgTAP, `ng test`.

**Spec:** `Examen_Ionic_Control_Electoral_Documento_Unificado_FINAL.pdf` (R1–R10) y ADR-001 a ADR-006.

## Global Constraints

- Entrega: 2026-11-25 14:00 (Ecuador). Orden de prioridad: R1–R9 y APK; R10 (Task 9) después. Hacer un APK de prueba al terminar la Task 7.
- `@supabase/supabase-js` solo se importa dentro de `src/app/core/data`; las páginas solo usan servicios, nunca repositorios.
- Signals para datos y UI; RxJS solo para red y resincronización.
- Reactive Forms; errores con ToastController/AlertController.
- Ninguna clave administrativa en la app ni en git. Solo URL y clave publicable en `environment.ts`.
- Contraseña inicial: `Ecuador2026`. Roles: `provincial`, `recinto`, `veedor`. Dignidades: `alcalde`, `prefecto`.
- **Los commits los hace solo el estudiante.** El agente nunca ejecuta `git commit` ni `git push`.
- **Cierre de cada tarea:** el agente actualiza `docs/superpowers/ESTADO.md` (resultados automáticos y decisiones), entrega la lista de archivos, un mensaje de commit sugerido y los pasos de prueba, y se detiene. No empieza la siguiente hasta que el estudiante pruebe, registre el resultado en `docs/superpowers/ESTADO.md`, haga el commit y avise.
- Textos de interfaz en español. Cambiar una decisión de un ADR exige un ADR nuevo.

## Decisiones que los ADR no fijan

| Tema | Decisión |
|---|---|
| Territorio | Pichincha / Quito, 6 recintos de demostración; organizaciones y candidaturas ficticias |
| Login con cédula | Edge Function `login` resuelve el correo en el servidor y devuelve la sesión |
| Recuperación | Código de 6 dígitos por correo (sin deep links) |
| Confirmación | `admin.createUser` con `email_confirm:false` y luego `auth.resend({type:'signup'})`; sin confirmar no hay login |
| Correo | SMTP propio en Supabase: el integrado solo envía a miembros del proyecto |
| Cambio obligatorio | `debe_cambiar_clave` bloquea la RLS; solo la Edge Function `cambiar-clave` lo limpia |
| Nitidez | Varianza del Laplaciano en gris a 640 px de ancho; umbral inicial 100, calibrar en el teléfono |
| Regla de totales | suma de votos + blancos + nulos = total de sufragantes |

## Review Focus

1. Reintento tras perder la respuesta del servidor: no se duplica ni se marca conflicto (Task 2).
2. Veedor reasignado con una acta pendiente en cola: el registro pasa a conflicto, no se reintenta sin fin ni se pierde (Task 9).
3. Dos usuarios editan la misma versión: el segundo recibe `CONFLICTO`, no sobrescribe (Task 2).
4. Votos vacíos, negativos o decimales: el formulario y la base los rechazan (Tasks 2 y 4).
5. GPS denegado o agotado: mensaje y reintento, sin perder los votos ya escritos (Task 7).

## File Structure

```
docs/adr/                       ADR existentes
supabase/migrations/            esquema, RLS, RPC, vistas
supabase/seed.sql               R1
supabase/tests/                 pgTAP
supabase/functions/{login,crear-usuario,cambiar-clave,recuperar-clave,confirmado}/
scripts/crear-provincial.mjs    alta local del primer usuario
src/app/core/models/index.ts
src/app/core/data/              supabase.client, auth/recintos/usuarios/actas/local .repo.ts
src/app/core/services/          auth, recintos, usuarios, actas, captura, red, sync, notificacion
src/app/core/validators/        cedula, acta
src/app/core/guards/            sesion, rol, cambio-clave
src/app/shared/components/      estado-vista, acta-form, usuario-form
src/app/pages/{auth,provincial,recinto,veedor}/
```

---

### Task 1: Proyecto base

**Files:** Create: proyecto Ionic en la raíz, `src/app/core/models/index.ts`. Modify: mover `ADR-*.md` a `docs/adr/`, `.gitignore`.

**Interfaces — Produces:**
```ts
type Rol = 'provincial'|'recinto'|'veedor'; type Dignidad = 'alcalde'|'prefecto';
interface Recinto { id:string; provincia:string; canton:string; parroquia:string; nombre:string; numJrv:number }
interface Perfil { id:string; cedula:string; nombres:string; apellidos:string; telefono:string; correo:string; rol:Rol; recintoId:string|null; debeCambiarClave:boolean }
interface Jrv { id:string; recintoId:string; numero:number; veedorId:string|null }
interface Candidatura { id:string; organizacion:string; dignidad:Dignidad; nombre:string }
interface Acta { id:string; jrvId:string; dignidad:Dignidad; votos:Record<string,number>; blancos:number; nulos:number; totalSufragantes:number; fotoPath:string; lat:number; lng:number; precisionM:number; capturadaEn:string; version:number }
interface Estado<T> { fase:'inicial'|'cargando'|'exito'|'error'; datos:T|null; error:string|null }
```

- [ ] Generar en el scratchpad con `ionic start control-electoral blank --type=angular-standalone --capacitor --no-git` y copiar a la raíz sin sobrescribir `README.md`, `.git` ni el `.gitignore` (fusionarlo).
- [ ] Instalar `@supabase/supabase-js @capacitor/{camera,geolocation,network,android} @capacitor-community/sqlite` en la misma versión mayor de Capacitor; `appId` `ec.epn.controlelectoral`.
- [ ] Mover (`mv`) los ADR a `docs/adr/`, con nombre `ADR-00N-titulo-corto.md`; crear los modelos.
- [ ] Run: `ionic build && npx cap add android && npx cap sync android`. Expected: sin errores.
- [ ] Run: `cd android && JAVA_HOME=$HOME/.jdks/jbr-21.0.11 ANDROID_HOME=$HOME/Android/Sdk ./gradlew assembleDebug`. Expected: `BUILD SUCCESSFUL` (detecta pronto el riesgo de ADR-006).
- [ ] Cerrar la tarea (ver Global Constraints); mensaje sugerido: `chore: proyecto base Ionic Angular`.

### Task 2: Base de datos, RLS y RPC (R1, R6, R8)

**Files:** Create: `supabase/migrations/0001_esquema.sql`, `0002_rls.sql`, `0003_rpc_vistas.sql`, `supabase/seed.sql`, `supabase/tests/{acceso,guardar_acta}.test.sql`

**Interfaces — Produces:**
- Tablas: `recintos`, `perfiles(id→auth.users, cedula unique, …, debe_cambiar_clave default true)`, `jrvs(unique(recinto_id,numero))`, `organizaciones`, `candidaturas`, `actas(unique(jrv_id,dignidad), version, operacion_id, rol_ultima_edicion)`, `votos(pk(acta_id,candidatura_id), cantidad int check >= 0)`.
- Índice único parcial: un `perfiles.recinto_id` por `rol='recinto'`. Trigger: al insertar un recinto crea `num_jrv` filas en `jrvs`.
- `guardar_acta(p jsonb) returns jsonb {id, version}`; `p`: campos de Acta en snake_case, `votos` `{candidaturaId:n}`, `version_base`, `operacion_id`. Errores: `NO_AUTORIZADO`, `TOTALES`, `CONFLICTO`.
- `asignar_veedor(p_jrv uuid, p_veedor uuid)`: solo coordinador del recinto; el veedor debe pertenecer a él.
- Vistas `security_invoker`: `v_resultados(recinto_id, dignidad, candidatura_id, candidato, organizacion, votos)`, `v_avance(recinto_id, actas_registradas, actas_esperadas)`; esperadas = 2 × num_jrv.
- Bucket privado `actas`; ruta `{recinto_id}/{jrv_id}/{dignidad}/{operacion_id}.jpg`.

Reglas RLS (todas exigen `debe_cambiar_clave=false`, salvo leer el propio perfil): provincial lee todo e inserta recintos; recinto lee su recinto, sus veedores, mesas y actas; veedor solo sus JRV y actas. Storage usa la misma pertenencia. `actas` y `votos` no admiten escritura directa, solo vía RPC (`security definer`, `search_path=''`); provincial no edita actas.

Orden dentro de `guardar_acta`: autorización → misma `operacion_id` ya aplicada devuelve la versión actual → bloqueo de fila → `version_base` distinta de la actual lanza `CONFLICTO` (0 si no existe) → exactamente las 5 candidaturas de la dignidad y totales → upsert con `version+1`.

- [ ] Escribir pgTAP, con 2 recintos y 2 veedores, cambiando `request.jwt.claims`:
  - veedor A lee JRV, acta y objeto de Storage de B → 0 filas; `guardar_acta` sobre mesa de B → `NO_AUTORIZADO`
  - coordinador de otro recinto → 0 filas; con `debe_cambiar_clave=true` → 0 filas; insert directo en `actas` → denegado
  - 10+20+30+40+50, blancos 5, nulos 5, total 160 → versión 1; total 159 → `TOTALES`; cantidad −1 → error
  - misma `operacion_id` dos veces → misma versión, 1 fila
  - coordinador corrige a versión 2, veedor envía `version_base` 1 → `CONFLICTO` y datos intactos
  - `v_resultados` consolidado coincide con la suma manual de dos actas
- [ ] Run: `npx supabase init && npx supabase start && npx supabase test db`. Expected: FAIL.
- [ ] Implementar migraciones y seed (6 recintos con 3–5 JRV, 5 organizaciones, 5+5 candidaturas).
- [ ] Run: `npx supabase db reset && npx supabase test db`. Expected: PASS.
- [ ] Cerrar la tarea (ver Global Constraints); mensaje sugerido: `feat: esquema, RLS y RPC de actas`.

### Task 3: Edge Functions de cuentas (R2, R3)

**Files:** Create: las cinco funciones, `supabase/functions/_shared/{cedula,respuesta}.ts`, `scripts/crear-provincial.mjs`, `supabase/functions/tests/cuentas.test.mjs`. Modify: `supabase/config.toml` (`enable_signup=false` en `[auth]`; `enable_confirmations=true` en `[auth.email]`, plantilla de recuperación con `{{ .Token }}`).

**Interfaces — Produces (POST JSON):**
- `login {cedula,clave}` → `{access_token,refresh_token}` | 401 `CREDENCIALES` (idéntico si la cédula no existe) | 403 `SIN_CONFIRMAR`
- `crear-usuario {cedula,nombres,apellidos,telefono,correo,recintoId?}` → 201 `{id}`; el rol se deduce del llamador (provincial→recinto, recinto→veedor en su propio recinto; veedor→403). Cédula/correo repetido → 409 `DUPLICADO`; recinto ya con coordinador → 409 `RECINTO_OCUPADO`. Si falla el perfil, borra el usuario de Auth.
- `cambiar-clave {nueva}` → sesión nueva; rechaza `Ecuador2026` y menos de 8 caracteres.
- `recuperar-clave {cedula}` → siempre 200; `{cedula,codigo,nueva}` → sesión | 400 `CODIGO`.
- `confirmado` (GET) → texto plano "Cuenta confirmada. Ya puede iniciar sesión en la app."

- [ ] Escribir `cuentas.test.mjs` (`node --test`, contra Supabase local; correos leídos por la API de Mailpit, puerto 54324): cada respuesta anterior, `signUp()` público falla, y tras `cambiar-clave` el perfil tiene `debe_cambiar_clave=false`.
- [ ] Run: `npx supabase functions serve` y `node --test supabase/functions/tests/`. Expected: FAIL.
- [ ] Implementar. `crear-usuario` y `cambiar-clave` verifican el JWT; las demás son públicas (`verify_jwt=false`). `crear-provincial.mjs` lee `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del entorno.
- [ ] Run los mismos comandos. Expected: PASS. Si `resend` no envía con el registro cerrado, usar `admin.generateLink({type:'signup'})` y enviar por SMTP.
- [ ] Cerrar la tarea (ver Global Constraints); mensaje sugerido: `feat: funciones de cuentas`.

### Task 4: Validadores (R2, R6)

**Files:** Create: `src/app/core/validators/{cedula,acta}.validator.ts` y `.spec.ts`

**Interfaces — Produces:** `esCedulaValida(c:string):boolean`; `cedulaValidator:ValidatorFn` → `{cedula:true}`; `enteroNoNegativo:ValidatorFn` → `{entero:true}`; `totalesValidator:ValidatorFn` (grupo con `votos`, `blancos`, `nulos`, `totalSufragantes`) → `{totales:{suma,total}}`.

- [ ] Tests:
```ts
expect(esCedulaValida('1710034065')).toBe(true);
for (const c of ['1710034066','2510034065','1770034065','171003406','17100340650','abcdefghij',''])
  expect(esCedulaValida(c)).toBe(false);
for (const v of [null,'',-1,1.5]) expect(enteroNoNegativo(new FormControl(v))).toEqual({entero:true});
expect(enteroNoNegativo(new FormControl(0))).toBeNull();
// votos 10,20,30,40,50 + 5 + 5: total 160 → null; 159 → {totales:{suma:160,total:159}}
```
- [ ] Run: `npx ng test --no-watch`. Expected: FAIL.
- [ ] Implementar: provincia 01–24 (o 30), tercer dígito < 6, módulo 10.
- [ ] Run. Expected: PASS. Cerrar la tarea; mensaje sugerido: `feat: validadores de cédula y acta`.

### Task 5: Acceso, guards y navegación (R3, R9)

**Files:** Create: `core/data/{supabase.client,auth.repo}.ts`, `core/services/{auth,notificacion}.service.ts`, `core/guards/*.ts` con specs, `shared/components/estado-vista`, `pages/auth/{login,cambiar-clave,recuperar}`. Modify: `app.routes.ts`.

**Interfaces — Produces:**
- `AuthService`: `perfil:Signal<Perfil|null>`, `estado:Signal<Estado<Perfil>>`, `restaurar()`, `login(cedula,clave)`, `cambiarClave(nueva)`, `solicitarCodigo(cedula)`, `recuperar(cedula,codigo,nueva)`, `salir()`; todos `Promise<void>`.
- `NotificacionService`: `exito(msg)`, `error(e:unknown)`, `confirmar(msg):Promise<boolean>`; traduce los códigos de las Tasks 2 y 3.
- `sesionGuard`, `cambioClaveGuard`, `rolGuard(rol:Rol):CanActivateFn`; `<app-estado-vista [estado]>` con carga, error con reintento y vacío.

- [ ] Specs: sin sesión → `/login`; `debeCambiarClave` → `/cambiar-clave`; veedor en `/provincial` → `/veedor`; rol correcto → `true`; login fallido → `fase:'error'`.
- [ ] Run `ng test`. Expected: FAIL. Implementar (`restaurar` en `provideAppInitializer`; el perfil se guarda localmente para abrir sin red). Run. Expected: PASS.
- [ ] Verificar a mano con `ionic serve`: primer acceso fuerza el cambio; recuperación por código. Cerrar la tarea; mensaje sugerido: `feat: acceso y guards`.

### Task 6: Coordinadores: recintos, usuarios y mesas (R2, R4, R5)

**Files:** Create: `core/data/{recintos,usuarios}.repo.ts`, `core/services/{recintos,usuarios}.service.ts` con specs, `shared/components/usuario-form`, `pages/provincial/{recintos,recinto-nuevo,coordinador-nuevo}`, `pages/recinto/{mesas,veedores}`

**Interfaces — Produces:**
- `RecintosService`: `recintos:Signal<Estado<Recinto[]>>`, `mesas:Signal<Estado<MesaEstado[]>>` con `MesaEstado = Jrv & {veedor:string|null; alcalde:boolean; prefecto:boolean}`; `cargar()`, `crear(Omit<Recinto,'id'>)`, `cargarMesas()`, `asignarVeedor(jrvId,veedorId)`.
- `UsuariosService`: `veedores:Signal<Estado<Perfil[]>>`, `cargarVeedores()`, `crear(datos, recintoId?)`.
- `<app-usuario-form (guardar)>`: cédula, nombres, apellidos, teléfono (`^0\d{9}$`), correo.

- [ ] Specs con repos falsos: carga `cargando→exito`, fallo → `error`, cédula inválida impide emitir `guardar`, tras `asignarVeedor` se recargan mesas.
- [ ] Run `ng test`: FAIL → implementar → PASS.
- [ ] Verificar a mano: crear recinto (aparecen sus JRV), coordinador, veedor; asignar y reasignar. Cerrar la tarea; mensaje sugerido: `feat: gestión de recintos y usuarios`.

### Task 7: Captura y actas (R6, R7, R5)

**Files:** Create: `core/services/captura.service.ts`, `core/services/nitidez.ts`, `core/data/actas.repo.ts`, `core/services/actas.service.ts` con specs, `shared/components/acta-form`, `pages/veedor/{mis-mesas,acta}`, `pages/recinto/acta`. Modify: `AndroidManifest.xml` (CAMERA, ACCESS_COARSE_LOCATION, ACCESS_FINE_LOCATION).

**Interfaces — Produces:**
- `varianzaLaplaciano(gris:Uint8ClampedArray, ancho:number, alto:number):number`; `UMBRAL_NITIDEZ=100`
- `CapturaService`: `foto():Promise<{blob:Blob; vistaPrevia:string; nitidez:number; aceptable:boolean}>`, `ubicacion():Promise<{lat,lng,precisionM}>`; errores `CAMARA_DENEGADA`, `CAMARA_CANCELADA`, `GPS_DENEGADO`, `GPS_NO_DISPONIBLE`.
- `BorradorActa = Omit<Acta,'fotoPath'|'version'> & {operacionId:string; versionBase:number; foto:Blob|null; fotoPath:string|null}`
- `ActasRepo.guardar(b:BorradorActa):Promise<{id,version}>` sube la foto (objeto ya existente = éxito) y llama a la RPC; `obtener(jrvId,dignidad):Promise<Acta|null>`; `urlFoto(path)` firmada, 5 min.
- `ActasService`: `misMesas`, `estadoGuardado` (Signals), `guardar(b):Promise<'enviada'|'pendiente'>`.

- [ ] Specs: imagen uniforme → 0; tablero de ajedrez > umbral; foto no aceptable bloquea el guardado; GPS denegado conserva los valores del formulario y ofrece reintento; totales que no cuadran deshabilitan Guardar; corregir sin foto nueva conserva `fotoPath` y GPS.
- [ ] Run `ng test`: FAIL → implementar (fotos JPEG de 1600 px, calidad 80; cámara sin galería; GPS con `timeout` 15 s) → PASS.
- [ ] En teléfono: registrar ambas actas, denegar permisos, foto borrosa, calibrar el umbral; corregir como coordinador. Cerrar la tarea; mensaje sugerido: `feat: registro y corrección de actas`.

### Task 8: Dashboard provincial (R4)

**Files:** Create: `core/data/resultados.repo.ts`, `core/services/resultados.service.ts` con spec, `pages/provincial/{dashboard,avance}`

**Interfaces — Produces:** `ResultadosService`: `filtro:WritableSignal<{dignidad:Dignidad; recintoId:string|null}>`, `resultados:Signal<Estado<{candidato,organizacion,votos,porcentaje}[]>>`, `avance:Signal<Estado<{recinto,registradas,esperadas}[]>>`, `actasGps:Signal<Estado<{jrv,dignidad,lat,lng,precisionM}[]>>`, `cargar()`.

- [ ] Specs: consolidado suma dos recintos; filtro por recinto; cero votos → porcentaje 0, no `NaN`.
- [ ] Run `ng test`: FAIL → implementar (barras con `ion-progress-bar`, sin biblioteca de gráficos; GPS con enlace a mapa) → PASS. Cerrar la tarea; mensaje sugerido: `feat: dashboard provincial`.

### Task 9: Offline y sincronización (R10, ADR-006)

**Files:** Create: `core/data/local.repo.ts`, `core/services/{red,sync}.service.ts` con specs, `pages/veedor/pendientes`. Modify: `ActasService.guardar`, `misMesas`.

**Interfaces — Produces:** `LocalRepo`: `encolar(b)`, `pendientes()`, `marcar(operacionId, 'sincronizado'|'conflicto', motivo?)`, `guardarCache(clave,json)`, `leerCache(clave)`; tabla `cola(operacion_id pk, payload, foto_base64, estado, motivo, capturada_en)`. `RedService.enLinea$:BehaviorSubject<boolean>` y `enLinea` (`toSignal`). `SyncService`: `sincronizar():Promise<void>`, `pendientes:Signal<BorradorActa[]>`.

- [ ] Specs con repos falsos: sin red → `'pendiente'`; al volver sincroniza una sola vez aunque haya dos eventos; error de red deja pendiente; `CONFLICTO` y `NO_AUTORIZADO` → `conflicto` sin reintento y visible al usuario; un conflicto no detiene el resto; salir con pendientes pide confirmación y la cola solo se envía con el usuario que la creó (guardar `usuario_id`).
- [ ] Run `ng test`: FAIL → implementar (`guardar` encola ante fallo de red; mesas y candidaturas en caché) → PASS.
- [ ] En teléfono: los cuatro pasos de verificación de ADR-006. Cerrar la tarea; mensaje sugerido: `feat: cola offline`.

### Task 10: Despliegue y entrega

**Files:** Modify: `README.md`. Create: `docs/pruebas.md`, `docs/anexo-ia.md`

- [ ] Con permiso del usuario: enlazar el proyecto Supabase existente del estudiante, `npx supabase db push`, cargar el seed, `functions deploy`, cerrar registro, SMTP, plantillas, Site URL → función `confirmado`; crear cuentas de demostración de los tres roles.
- [ ] Ejecutar contra la nube las cinco verificaciones de ADR-004 y anotar resultados en `docs/pruebas.md`.
- [ ] README: instalación, configuración sin secretos, arquitectura, modelo de datos, pruebas, credenciales de demostración, uso de IA. El anexo lo completa el estudiante con sus consultas reales.
- [ ] Run: `grep -rl "@supabase/supabase-js" src/app` → solo `core/data`; `grep -rE "service_role|sb_secret" src android/app/src` → vacío; `ng test` y `supabase test db` → PASS.
- [ ] Run: `ionic build && npx cap sync android && cd android && JAVA_HOME=$HOME/.jdks/jbr-21.0.11 ANDROID_HOME=$HOME/Android/Sdk ./gradlew assembleDebug`. Expected: `app/build/outputs/apk/debug/app-debug.apk`; instalar en un teléfono limpio y recorrer los tres roles.
- [ ] Cerrar la tarea (ver Global Constraints); mensaje sugerido: `docs: entrega`.
