# ADR-004: Supabase como servicio de backend (Auth, PostgreSQL con RLS, Storage y Edge Functions)

**Estado:** Aceptado

**Fecha:** 2026-11-22

**Autor(es) y equipo:** Alex Suárez, Justin Paladines, Sebastian Chico

**Requisitos relacionados:**

- **R2:** Creación jerárquica de cuentas sin autorregistro y envío de confirmación de cuenta.
- **R3:** Inicio de sesión protegido, sin exponer claves administrativas en la aplicación.
- **R4:** Consulta del avance de actas y dashboard de votos por candidato y recinto o consolidado.
- **R8:** Elección justificada entre Firebase, Supabase o Appwrite, con reglas de acceso por rol y pertenencia, persistencia de datos e imágenes, y demostración de que un veedor no accede a mesas ajenas.
- **R10:** Persistencia local y sincronización de registros pendientes al recuperar conexión.

## Contexto

La aplicación necesita autenticación, almacenamiento de las fotografías de las actas y control de acceso para tres roles: coordinador provincial, coordinador de recinto y veedor de mesa (R8). El dominio es relacional: un recinto tiene varias juntas receptoras del voto (JRV), cada JRV tiene un veedor asignado y cada acta pertenece a una JRV. Además, las cuentas no pueden crearse por autorregistro (R2) y las claves administrativas no pueden incluirse en la aplicación (R3). El documento del examen exige elegir entre Firebase, Supabase o Appwrite y aplicar las reglas de acceso en el backend, no solo ocultando pantallas.

## Alternativas consideradas

**Alternativa 1:** Supabase (Auth, PostgreSQL con RLS, Storage y Edge Functions)

**Ventajas:**

- Al ser una base de datos relacional, permite modelar directamente las relaciones entre recintos, JRV, veedores y actas.
- Integra en un mismo servicio la autenticación, el almacenamiento de fotografías y las políticas de seguridad (RLS) por rol y pertenencia.
- Las políticas RLS pueden probarse directamente con consultas SQL, lo que facilita demostrar que un veedor no accede a mesas ajenas (R8).
- Las Edge Functions están incluidas en el plan gratuito y permiten crear cuentas sin autorregistro, manteniendo la clave de administrador en el servidor (R2, R3).
- Las vistas SQL con agregaciones facilitan el dashboard de votos por candidato y recinto (R4).

**Desventajas:**

- No incluye persistencia offline nativa; la cola de registros pendientes debe implementarse por separado (R10).
- Las políticas RLS deben escribirse con cuidado para cubrir correctamente los tres roles.

**Alternativa 2:** Firebase (Authentication, Cloud Firestore y Storage)

**Ventajas:**

- Firestore ofrece persistencia offline nativa que se activa con poca configuración.
- Las Security Rules se escriben por documento y colección de forma directa.
- El equipo tiene experiencia previa trabajando con Firebase.

**Desventajas:**

- Crear cuentas sin autorregistro de forma segura requiere Cloud Functions con el Admin SDK, que exige el plan Blaze de pago.
- La alternativa sin servidor (una segunda instancia de Firebase en el cliente) complica la solución y obliga a mantener habilitado el registro público.
- La caché offline de Firestore no cubre la subida de fotografías a Storage sin conexión.
- Firestore no permite agrupar resultados por candidato y recinto, lo que complica el dashboard.

**Alternativa 3:** Appwrite (Auth, Databases, Storage, Functions y Teams)

**Ventajas:**

- Los roles se pueden mapear de forma nativa a Labels y Teams, configurados desde la consola.
- Puede instalarse en un servidor propio si la organización lo requiere.

**Desventajas:**

- Tiene poca documentación en relación con Ionic, lo que dificulta resolver fallos durante el desarrollo.
- Al reasignar un veedor a otra JRV hay que actualizar directamente los permisos de los registros afectados.

## Decisión

Se escoge Supabase como servicio de backend, utilizando Supabase Auth para la autenticación, PostgreSQL con políticas RLS para el control de acceso por rol y pertenencia, Supabase Storage para las fotografías de las actas y Edge Functions para la creación de cuentas. La elección se fundamenta en que el modelo relacional se ajusta a las relaciones entre recintos, JRV, veedores y actas, en que las políticas RLS pueden verificarse con consultas directas, y en que la creación de cuentas sin autorregistro se resuelve con Edge Functions dentro del plan gratuito, mientras que en Firebase requeriría el plan Blaze de pago. Appwrite se descarta por su escasa documentación con Ionic y por la complejidad de actualizar permisos al reasignar veedores. La persistencia offline (R10), que Firebase ofrecía de forma nativa, se resolverá con una cola local independiente documentada en su propio ADR.

## Consecuencias

**Beneficios:**

- Centraliza autenticación, base de datos, almacenamiento y lógica de servidor en un solo servicio gratuito.
- Permite demostrar con consultas SQL que un veedor no puede acceder a mesas ajenas (R8).
- Mantiene las claves administrativas fuera de la aplicación móvil (R3).

**Limitaciones:**

- Requiere implementar por separado la persistencia offline y la sincronización de pendientes (R10).
- Las Edge Functions deben desarrollarse y desplegarse con la CLI de Supabase.
- El proyecto del plan gratuito se pausa tras un periodo de inactividad y debe reactivarse antes de la defensa.

**Riesgo identificado:**

- Si las políticas RLS no se escriben correctamente, un usuario podría acceder a datos o fotografías de otro recinto o de otra JRV. Se mitiga probando cada política con sesiones de distintos roles antes de implementar las pantallas.

## Verificación

Se comprobará la decisión mediante las siguientes pruebas:

1. Iniciar sesión como veedor A y consultar la JRV asignada al veedor B; la consulta debe devolver cero filas.

2. Con la sesión del veedor A, intentar descargar la fotografía de un acta de otra mesa; la operación debe ser rechazada.

3. Intentar registrar una cuenta con supabase.auth.signUp() desde la aplicación; la operación debe fallar porque el registro público está desactivado.

4. Invocar la Edge Function de creación de cuentas con la sesión de un veedor; debe responder con un error de autorización.

5. Consultar la vista del dashboard y comprobar que los totales por candidato y recinto coinciden con la suma manual de actas de prueba.

**Comandos de referencia:**

```
npm install @supabase/supabase-js
npx supabase init
npx supabase functions deploy crear-usuario
ionic build
npx cap sync android
```

## Uso de IA

**Herramienta:** Claude

**Consulta realizada:** Comparación de Firebase, Supabase y Appwrite para la creación de cuentas sin autorregistro, el control de acceso por rol y pertenencia, el dashboard consolidado y el soporte offline.

## Consenso del equipo

**Acuerdo final:** Uso de Supabase (Auth, PostgreSQL con RLS, Storage y Edge Functions) como backend común, descartando Firebase por requerir el plan Blaze para crear cuentas sin autorregistro y Appwrite por su escasa documentación con Ionic.

**Minuto del video:** 10:11 – 14:41
