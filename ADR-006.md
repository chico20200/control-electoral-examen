ADR-006: Almacenamiento local con @capacitor-community/sqlite, cola de pendientes offline y resolución de conflictos
Estado: Aceptado
Fecha: 2026-11-22
Autor(es) y equipo: Alex Suárez, Justin Paladines, Sebastian Chico
Requisitos relacionados:
•	R5: Corrección de datos y fotografías de actas por parte del coordinador de recinto.
•	R6: Registro y corrección de actas por parte del veedor de mesa.
•	R7: Persistencia de fotografía del acta y coordenadas GPS asociadas al registro. 
•	R10: Persistencia local, sincronización automática de registros pendientes al recuperar conexión y estrategia documentada de conflictos.
Contexto
En los recintos electorales con conectividad móvil intermitente o nula, los veedores necesitan continuar registrando actas completas junto con sus fotografías y coordenadas GPS sin perder información cuando se pierde la conexión a internet (R10). Al restablecerse la red, la aplicación debe sincronizar automáticamente los registros pendientes hacia Supabase y resolver posibles conflictos si un coordinador de recinto ya realizó correcciones sobre esa misma acta (R5). 
Alternativas consideradas
Alternativa 1: @capacitor-community/sqlite con cola de pendientes y resolución de conflictos por jerarquía y marca de tiempo 
Ventajas:
•	Permite almacenar de forma relacional y persistente en el dispositivo tanto los datos estructurados de las actas como las fotografías capturadas sin problemas de cuota de memoria.
•	Soporta estados explícitos de sincronización (pendiente, sincronizado, conflicto) y transacciones locales seguras.
•	Mantiene una estructura tabular compatible con el modelo relacional de PostgreSQL en Supabase. 
Desventajas:
•	Es un plugin mantenido por la comunidad y no por el equipo oficial de Capacitor.
•	Requiere configuración nativa adicional en Android y manejo de sentencias SQL locales. 
Alternativa 2: @capacitor/preferences
Ventajas:
•	Plugin oficial de Capacitor, sencillo de instalar y utilizar para pares clave-valor pequeños.
Desventajas:
•	No está diseñado ni tiene capacidad adecuada para almacenar fotografías pesadas en cola ni múltiples registros transaccionales sin degradar el rendimiento o saturar el almacenamiento. 
Decisión
Se escoge utilizar @capacitor-community/sqlite para implementar una base de datos local en Android que gestione una cola persistente de actas pendientes con sus fotografías y coordenadas GPS. La elección se fundamenta en que @capacitor/preferences no soporta el almacenamiento confiable de fotografías pesadas, mientras que SQLite permite encolar registros localmente y sincronizarlos automáticamente hacia Supabase Storage y PostgreSQL cuando el monitor de red (BehaviorSubject + toSignal) detecta el retorno de conexión. Para la resolución de conflictos, se establece una estrategia basada en marca de tiempo y jerarquía de rol: si el servidor registra una actualización previa realizada por un coordinador de recinto (R5), la sincronización tardía del veedor no sobrescribe los datos corregidos y marca el registro para revisión. 
Consecuencias
Beneficios:
•	Garantiza la continuidad operativa del registro de actas en recintos sin acceso a internet.
•	Evita la pérdida de fotografías y coordenadas GPS capturadas en campo.
•	Protege la integridad de las actas ya validadas o corregidas por un coordinador de recinto. 
Limitaciones:
•	Cada registro encolado localmente debe incluir un identificador único, estado de sincronización y marca de tiempo de captura para evitar duplicados al reintentar envíos.
•	El funcionamiento completo de SQLite nativo requiere pruebas directas en dispositivo Android o emulador tras sincronizar Capacitor. 
Riesgo identificado:
•	Al ser @capacitor-community/sqlite un plugin mantenido por la comunidad, pueden presentarse incompatibilidades de compilación con versiones recientes de Android Gradle o requerir ajustes específicos en la configuración nativa de Android.
Verificación
Se comprobará la decisión mediante las siguientes pruebas: 
1. Instalar el plugin @capacitor-community/sqlite y sincronizar el proyecto con Android sin errores de Gradle. 
2. Activar el modo avión en el dispositivo Android, registrar un acta completa con fotografía y coordenadas GPS, y verificar que quede almacenada localmente como pendiente. 
3. Desactivar el modo avión y comprobar que la aplicación sincronice automáticamente la imagen en Supabase Storage y el registro en PostgreSQL. 
4. Simular una corrección previa del coordinador de recinto en Supabase y verificar que la sincronización posterior del veedor no sobrescriba dicha corrección. 
Comandos de referencia:
npm install @capacitor-community/sqlite 
ionic build 
npx cap sync android 
npx cap open Android
Uso de IA
Herramienta: Gemini
Consulta realizada: Evaluación de limitaciones de @capacitor/preferences frente a @capacitor-community/sqlite para almacenar fotografías en cola offline y definición de estrategia de resolución de conflictos entre roles.
Consenso del equipo
Acuerdo final: Uso de @capacitor-community/sqlite para cola local de actas pendientes con fotos y resolución de conflictos por marca de tiempo y jerarquía de rol.
Minuto del video: 20:27 - 23:02
