# ADR-002: Arquitectura por capas para páginas, componentes, servicios, modelos y acceso a datos

**Estado:** Aceptado

**Fecha:** 2026-11-22

**Autor(es) y equipo:** Alex Suárez, Justin Paladines, Sebastian Chico

**Requisitos relacionados:**

- **R9:** Separación de presentación, lógica de negocio y acceso a datos, con estados explícitos de carga, éxito, error y validación.
- **R4, R5 y R6:** Pantallas y navegación distintas para coordinador provincial, coordinador de recinto y veedor, protegidas con guards por rol.
- **R8:** Las reglas de acceso se aplican en el backend; la arquitectura solo organiza cómo la aplicación se comunica con él.
- **R10:** La cola de registros pendientes debe poder insertarse entre la lógica y el acceso a datos sin modificar las páginas.

## Contexto

El examen exige separar la presentación, la lógica de negocio y el acceso a datos (R9), y justificar la organización de páginas, componentes, servicios, modelos, validaciones y acceso a datos según el framework elegido. Aunque cada integrante desarrolla su propia aplicación, los tres deben utilizar la misma estructura como línea base. La aplicación tiene tres roles con pantallas diferentes que comparten el mismo dominio (recintos, JRV, actas y usuarios), y la estructura debe permitir incorporar el acceso a Supabase y la cola offline sin mezclar responsabilidades.

## Alternativas consideradas

**Alternativa 1:** Separación por capas técnicas con repositorios como único acceso a datos

**Ventajas:**

- Cada capa se identifica en su propia carpeta: páginas, componentes visuales, servicios inyectables, modelos e interfaces, guards por rol y repositorios.
- Solo los repositorios conocen directamente a Supabase, por lo que la lógica de negocio no depende del backend.
- La misma separación funcionaría con otro backend, como Firebase, cambiando únicamente la capa de acceso a datos.
- La cola offline puede ubicarse entre los servicios y los repositorios sin modificar las páginas (R10).

**Desventajas:**

- Genera más archivos y código de paso entre capas.
- Los servicios pueden crecer demasiado si no se dividen por dominio.

**Alternativa 2:** Organización por funcionalidad (features)

**Ventajas:**

- Agrupa en una misma carpeta todo lo relacionado con un tema, por ejemplo actas o recintos.
- Escala bien en proyectos grandes con muchos módulos.

**Desventajas:**

- Las capas quedan mezcladas dentro de cada carpeta, lo que dificulta mostrar la separación que pide R9 durante la defensa.
- Cada integrante podría organizar sus funcionalidades de forma distinta, rompiendo la línea base común.

**Alternativa 3:** Servicios que acceden directamente a Supabase, sin capa de repositorios

**Ventajas:**

- Requiere menos archivos y es más rápido de implementar al inicio.

**Desventajas:**

- La lógica de negocio y el acceso a datos quedan mezclados en los mismos servicios, lo que incumple R9.
- Complica la incorporación del modo offline, porque cada servicio tendría que manejar por su cuenta la conexión y los pendientes.

## Decisión

Se escoge la separación por capas técnicas, utilizada por los tres integrantes. Las páginas y los componentes visuales solo muestran información y capturan acciones del usuario; los servicios inyectables contienen la lógica de negocio y exponen el estado a las páginas; los repositorios son la única capa que se comunica con Supabase; los modelos e interfaces definen las entidades del dominio; y los guards controlan la navegación según el rol. La dependencia va en un solo sentido: páginas, servicios, repositorios y Supabase. Los servicios se dividen por dominio (actas, recintos y usuarios) para evitar que crezcan demasiado. Se descarta la organización por funcionalidad porque mezcla las capas dentro de cada carpeta, y el acceso directo desde los servicios porque mezcla lógica y datos y complica el modo offline.

**Estructura de carpetas:**

```
src/app/core/models: interfaces Recinto, Jrv, Acta, Perfil y Rol
src/app/core/data: repositorios, única capa que importa Supabase
src/app/core/services: lógica de negocio y estado
src/app/core/validators: validación de cédula y totales del acta
src/app/core/guards: sesión, rol y cambio obligatorio de contraseña
src/app/shared/components: componentes visuales reutilizables
src/app/pages: auth, provincial, recinto y veedor
```

## Consecuencias

**Beneficios:**

- Los tres integrantes comparten la misma estructura y pueden apoyarse entre sí.
- Cada responsabilidad se puede señalar en una carpeta concreta durante la defensa.
- Un cambio en el backend o la incorporación del modo offline afecta solo a la capa de acceso a datos.

**Limitaciones:**

- Ninguna página ni componente puede importar directamente el cliente de Supabase.
- Se requiere más código de paso entre capas que en una estructura sin repositorios.

**Riesgo identificado:**

- Si algún servicio accede directamente a Supabase, el acceso a datos queda mezclado con la lógica de negocio y se complica la implementación del modo offline. Se mitiga revisando en cada commit que el cliente de Supabase solo se importe dentro de la capa de repositorios.

## Verificación

Se comprobará la decisión mediante las siguientes pruebas:

1. Buscar las importaciones de @supabase/supabase-js en el proyecto y verificar que solo aparezcan dentro de src/app/core/data.

2. Revisar las páginas y comprobar que solo utilizan servicios, sin importar repositorios.

3. Ingresar con un veedor a la ruta de una pantalla de coordinador y verificar que el guard lo redirige.

4. Compilar el proyecto y sincronizarlo con Android sin errores.

**Comandos de referencia:**

```
ionic generate page pages/veedor/mis-mesas
ionic generate service core/services/actas
ionic generate guard core/guards/rol
grep -r "@supabase/supabase-js" src/app
ionic build
npx cap sync android
```

## Uso de IA

**Herramienta:** Claude

**Consulta realizada:** Comparación de la organización por capas técnicas, por funcionalidad y con servicios que acceden directamente al backend, y propuesta de estructura de carpetas para Ionic Angular Standalone.

## Consenso del equipo

**Acuerdo final:** Uso de una arquitectura separada por capas (páginas, componentes visuales, servicios inyectables, modelos e interfaces, guards por rol y repositorios de acceso a datos), común para los tres integrantes e independiente del backend elegido.

**Minuto del video:** 02:34 – 05:34
