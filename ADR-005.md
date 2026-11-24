ADR-005: Manejo de estado híbrido (Signals y RxJS), formularios reactivos, validaciones y gestión global de errores
Estado: Aceptado
Fecha: 2026-11-22
Autor(es) y equipo: Alex Suárez, Justin Paladines, Sebastian Chico
Requisitos relacionados:
•	R2: Validación estricta del algoritmo de dígito verificador de la cédula ecuatoriana de 10 dígitos al crear usuarios.
•	R3: Validación de credenciales y obligatoriedad de cambio de contraseña inicial en el primer acceso.
•	R6: Validación aritmética cruzada entre votos por organización, blancos, nulos y total de sufragantes en las actas.
•	R9: Separación de presentación, lógica de negocio y acceso a datos; estados explícitos de carga, éxito, error y validación.
Contexto
Se requiere establecer una estrategia uniforme en Ionic Angular Standalone para gestionar el estado reactivo de la aplicación, controlar los estados explícitos de carga, éxito, error y validación en cada vista (R9), validar reglas de negocio críticas en formularios (R2, R3, R6) y reaccionar en tiempo real a los cambios de conectividad de red del dispositivo sin acoplar la lógica de estado dentro de los componentes visuales.
Alternativas consideradas
Alternativa 1: Modelo híbrido (Angular Signals de solo lectura + RxJS BehaviorSubject con toSignal + Reactive Forms + ToastController/AlertController)
Ventajas:
•	Los servicios exponen Signals de solo lectura para los estados de carga, éxito, error y colecciones de datos de forma síncrona y sin necesidad de desuscripciones manuales en las vistas.
•	RxJS con BehaviorSubject se utiliza de forma acotada para monitorear el estado de red y disparar la resincronización, integrándose a la UI mediante toSignal().
•	Reactive Forms permite implementar validadores síncronos y cruzados deterministas para la cédula ecuatoriana y la cuadratura de votos en las actas.
•	El manejo global de errores con ToastController y AlertController centraliza las notificaciones al usuario.
•	Permite ejecutar pruebas unitarias con ng test sobre las validaciones críticas y reglas de negocio.
Desventajas:
•	Combinar dos modelos reactivos (Signals y RxJS) requiere disciplina en el equipo para respetar los límites de cada uno.
•	No incluye pruebas automatizadas de interfaz gráfica (E2E), dependiendo de pruebas unitarias y pruebas manuales.
Alternativa 2: RxJS puro (BehaviorSubject para toda la aplicación) y formularios Template-Driven (ngModel)
Ventajas:
•	Mantiene un único paradigma reactivo en todas las capas de la aplicación.
•	Sintaxis rápida para formularios simples con enlace bidireccional.
Desventajas:
•	Genera mayor código repetitivo para suscripciones y desuscripciones en componentes standalone.
•	Los formularios Template-Driven dificultan las validaciones cruzadas complejas como comparar la suma de los votos contra el total de sufragantes.
Alternativa 3: Angular Signals puro sin RxJS
Ventajas:
•	Sintaxis uniforme para todo el estado local y global de la aplicación.
Desventajas:
•	Resulta menos expresivo para escuchar flujos de eventos asíncronos continuos de conectividad de red y orquestar colas de resincronización.
Decisión
Se escoge adoptar un modelo híbrido de manejo de estado junto con Reactive Forms y manejo global de errores en Ionic.
La elección se fundamenta en que los Signals de solo lectura expuestos desde los servicios simplifican el control de estados explícitos de carga, éxito y error en las vistas standalone, mientras que BehaviorSubject convertido con toSignal() resuelve de manera natural el monitoreo de red y resincronización.
Asimismo, se utilizarán Reactive Forms con validadores personalizados para garantizar el cumplimiento de las reglas electorales, ToastController y AlertController para informar errores de forma consistente, y pruebas unitarias con ng test para verificar las validaciones críticas.
Consecuencias
Beneficios:
•	Interfaces reactivas limpias sin fugas de memoria por suscripciones abiertas.
•	Validaciones matemáticas y de cédula encapsuladas, reutilizables y verificables mediante pruebas unitarias.
•	Retroalimentación visual explícita ante estados de carga, éxito, error y validación en toda la aplicación.
Limitaciones:
•	Los integrantes deberán respetar la regla de usar Signals para estado de datos/UI y reservar RxJS exclusivamente para red y resincronización.
•	Al no contar con pruebas automatizadas de interfaz, se deberá ejecutar un protocolo estructurado de pruebas manuales en Android.
Riesgo identificado:
•	Mezclar dos modelos reactivos (Signals y RxJS) puede generar confusión durante el desarrollo si no se delimita qué capa utiliza cada herramienta, además de la ausencia de pruebas automatizadas de interfaz.
Verificación
Se comprobará la decisión mediante las siguientes pruebas:
1. Ejecutar ng test y verificar que las pruebas unitarias del validador de cédula ecuatoriana, la suma de votos en actas y las reglas de acceso pasen correctamente.
2. Ingresar una cédula inválida en el formulario de creación de usuarios y comprobar que Reactive Forms bloquee el envío y muestre el mensaje de validación.
3. Registrar un acta cuya suma de votos no coincida con el total de sufragantes y verificar la alerta de validación.
4. Provocar un fallo de red y comprobar que ToastController o AlertController notifiquen el error de forma controlada.
Comandos de referencia:
ng test
ionic serve
ionic build
Uso de IA
Herramienta: Gemini
Consulta realizada: Comparación entre Angular Signals, RxJS BehaviorSubject y Reactive Forms para gestionar estados explícitos de UI, conectividad y validaciones electorales en Ionic Angular Standalone.
Consenso del equipo
Acuerdo final: Modelo híbrido (Signals de solo lectura en servicios + RxJS BehaviorSubject con toSignal para red/resincronización + Reactive Forms + ToastController/AlertController + ng test).
Minuto del video: 05:34 – 10:11
