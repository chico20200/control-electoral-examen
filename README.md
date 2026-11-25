# Control Electoral

Aplicación móvil para registrar y supervisar actas de escrutinio (Prueba 2, Desarrollo de Aplicaciones Móviles, ESFOT). Ionic Angular standalone, Capacitor y Supabase. Datos ficticios de Pichincha / Quito.

**Estudiante:** Andrés Sebastián Chico Quezada · **Equipo 7:** Alex Suárez, Justin Paladines, Sebastian Chico

| Documento | Ubicación |
|---|---|
| Decisiones de arquitectura (ADR) | [`docs/adr/`](docs/adr/) |
| Pruebas y resultados | [`docs/pruebas.md`](docs/pruebas.md) |
| Evidencias | [`docs/evidencias/`](docs/evidencias/) |
| Anexo de uso de IA | [`docs/anexo-ia.md`](docs/anexo-ia.md) |
| APK Android | _pendiente: pegar enlace_ |

## Qué hace

| Rol | Funciones |
|---|---|
| Coordinador provincial | Crear recintos y coordinadores; resultados por candidato, por recinto y consolidados; avance y GPS |
| Coordinador de recinto | Ver sus mesas y totales; crear, asignar y reasignar veedores; corregir datos y fotos de actas |
| Veedor | Ver solo sus mesas; registrar y corregir actas de alcalde y prefecto con foto nítida y GPS, también sin conexión |

## Instalación y ejecución

Requisitos: Node.js 26 (versión usada), npm, JDK 21 y Android SDK. Docker solo para el backend local.

```bash
npm ci
npx supabase start                       # backend local (Docker)
npx supabase db reset                    # SOLO local: recrea la base con el seed
node scripts/cuentas-prueba-local.mjs    # cuentas de prueba locales
npx ng serve --port 8100                 # http://localhost:8100, backend local
npx ng serve --configuration production  # http://localhost:4200, backend en la nube
```

Compilar el APK (usa el backend de la nube):

```bash
export JAVA_HOME=<ruta del JDK 21> ANDROID_HOME=<ruta del SDK>
npx ng build && npx cap sync android
(cd android && ./gradlew assembleDebug)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Configuración sin secretos

- `src/environments/` contiene solo la URL del proyecto y la clave **publicable**, que es pública por diseño: los datos los protege la RLS.
- Las claves administrativas existen solo en las Edge Functions, donde Supabase las inyecta. No están en la app ni en git.
- Para usar otro proyecto: cambiar `environment.prod.ts`, y ejecutar `npx supabase link`, `npx supabase db push --include-seed` y `npx supabase functions deploy`.
- En el panel de Supabase: registro público cerrado, SMTP propio, plantillas de `supabase/templates/`, código de 6 dígitos y Site URL hacia la función `confirmado`.
- El primer provincial se crea con `scripts/crear-provincial.mjs`, con la clave administrativa en variables de entorno.

## Arquitectura

Páginas → servicios → repositorios → Supabase (ADR-002).

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Presentación | `src/app/pages`, `src/app/shared` | Pantallas y formularios; solo usan servicios |
| Negocio | `src/app/core/services`, `validators`, `guards` | Reglas, estado, captura, sincronización |
| Datos | `src/app/core/data` | Único lugar que importa `@supabase/supabase-js` y SQLite |
| Modelos | `src/app/core/models` | Tipos y errores de la aplicación |
| Backend | `supabase/` | Esquema, RLS, RPC, vistas y Edge Functions |

- **Estado (ADR-005):** Signals para datos y pantalla; RxJS solo para red y sincronización. Cada vista muestra carga, éxito, error y validación.
- **Seguridad (ADR-004):** RLS por rol y pertenencia, RPC `guardar_acta` y Edge Functions autorizan en el servidor. Los guards solo orientan la navegación.
- **Sin conexión (ADR-006):** la cola en SQLite guarda acta, foto y GPS, y se envía al volver la red. `operacion_id` evita duplicados y `version_base` detecta conflictos: si alguien cambió antes el acta en el servidor, no se sobrescribe y queda para revisión.

### Trazabilidad de las decisiones

Los ADR entraron al repositorio (`1a13a07`) antes de implementar (`034e2d8`).

| ADR | Implementación (commit) | Código principal | Comprobación |
|---|---|---|---|
| 001 Ionic Angular | `034e2d8` | `src/main.ts`, `app.routes.ts` | APK instalado |
| 002 Capas | `baa44a6`, `3ebd5d8` | `src/app/core`, `src/app/pages` | Ninguna página importa repositorios |
| 003 Cámara y GPS | `2d1caa3` | `captura.service.ts`, `dispositivo.ts`, `nitidez.ts` | `captura.service.spec.ts`, teléfono |
| 004 Supabase | `92f4225`, `c7c6c42` | `supabase/` | pgTAP, pruebas de cuentas, [`docs/pruebas.md`](docs/pruebas.md) |
| 005 Estado y formularios | `81d48a7`, `baa44a6` | `core/validators`, `recurso.ts`, `notificacion.service.ts` | Pruebas unitarias |
| 006 Sin conexión | `08eebf4` | `sync.service.ts`, `local.repo.ts` | `sync.service.spec.ts`, teléfono |

## Modelo de datos

| Tabla | Contenido | Relación principal |
|---|---|---|
| `recintos` | Provincia, cantón, parroquia, nombre y número de JRV | Un trigger crea sus mesas |
| `jrvs` | Mesas | Un recinto; un veedor opcional |
| `perfiles` | Cédula, datos, rol | Usuario de Auth; un coordinador por recinto |
| `organizaciones`, `candidaturas` | 5 organizaciones; 5 candidaturas por dignidad | Candidatura → organización |
| `actas` | Blancos, nulos, total, foto, GPS y versión | Una por mesa y dignidad |
| `votos` | Votos por candidatura | Acta y candidatura |
| `operaciones` | Envíos ya aplicados | Evita duplicados |

La vista `v_resultados` suma los votos por recinto y candidatura respetando la RLS. Las fotos están en el bucket privado `actas`.

## Pruebas

```bash
npx ng test --no-watch                   # unitarias
npm run lint
npx supabase test db                     # RLS y RPC; requiere la base local recién reiniciada
node --test supabase/functions/tests/    # cuentas; Supabase local activo
```

Resultados y limitaciones en [`docs/pruebas.md`](docs/pruebas.md).

## Credenciales de demostración

Cuentas ficticias en la nube, recinto «Colegio Demo Calderón». La contraseña inicial de toda cuenta nueva es `Ecuador2026` y debe cambiarse al entrar.

| Rol | Cédula | Contraseña |
|---|---|---|
| Coordinador provincial | `1710034065` | "12345678" |
| Coordinador de recinto | `2410034066` | "12345678" |
| Veedor | `3010034068` | "12345678" |

## Limitaciones conocidas

- La cola sin conexión funciona en Android, no en el navegador; no envía con la app cerrada y la base local no está cifrada.
- Se necesita conexión para iniciar sesión y haber consultado antes las mesas.
- El dashboard se actualiza manualmente y la API entrega hasta 1000 filas (unos 100 recintos).
- La nitidez es una heurística (varianza del Laplaciano): no reconoce si la foto es de un acta. El GPS lo informa el teléfono.
- El envío no tiene tiempo límite propio: con una red muy débil puede quedar «Guardando» varios segundos.
- Tras un envío automático conviene abrir «Mis mesas» con red, para actualizar la copia local.
- Si una cuenta se crea con un correo equivocado, solo se corrige desde el panel de Supabase.
- El APK es de depuración (debug).

## Uso de IA

Declarado en [`docs/anexo-ia.md`](docs/anexo-ia.md).
