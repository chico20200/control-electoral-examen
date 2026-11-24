ADR-001: Selección de Ionic Angular Standalone o Ionic React como framework móvil
Estado: Aceptado
Fecha: 2026-11-22
Autor(es) y equipo: Alex Suárez, Justin Paladines, Sebastian Chico
Requisitos relacionados:
•	R1–R9: El framework debe permitir implementar las funcionalidades de gestión electoral, autenticación, registro de actas, cámara, geolocalización, navegación y presentación de resultados.
•	R7: Integración con Capacitor para acceder a la cámara y geolocalización.
•	R9: Separación de presentación, lógica de negocio y acceso a datos.
Contexto
Se requiere seleccionar un framework para desarrollar una aplicación móvil de control electoral utilizando Ionic y Capacitor. La tecnología debe permitir organizar las funcionalidades mediante páginas, componentes y servicios, gestionar formularios, realizar navegación entre las diferentes interfaces e integrar funcionalidades nativas de Android.
Alternativas consideradas
Alternativa 1: Ionic Angular Standalone
Ventajas:
•	Permite organizar el proyecto mediante componentes, páginas y servicios independientes.
•	Facilita la separación entre presentación y lógica de negocio.
•	Cuenta con Angular Router para gestionar la navegación.
•	Ofrece Reactive Forms para implementar formularios con validaciones.
•	Permite utilizar servicios para centralizar las operaciones y el acceso a Supabase.
•	Se integra con Capacitor para utilizar funcionalidades nativas de Android.
•	El equipo tiene conocimientos previos de Angular e Ionic.
Desventajas:
•	Requiere comprender la organización de componentes standalone y sus importaciones.
•	Algunas configuraciones pueden resultar complejas cuando se integran diferentes dependencias.
•	Es necesario mantener una estructura organizada para evitar concentrar demasiada lógica en los componentes.
Alternativa 2: Ionic React
Ventajas:
•	Permite desarrollar interfaces mediante componentes reutilizables.
•	Utiliza hooks para gestionar estados y comportamientos.
•	Permite utilizar React Router para la navegación.
•	Se integra con Capacitor para acceder a funcionalidades nativas.
•	El equipo tiene conocimientos previos de React.
Desventajas:
•	Requiere organizar manualmente determinados aspectos de la arquitectura mediante componentes, hooks y servicios.
•	La gestión de formularios y validaciones necesita una implementación adicional o bibliotecas complementarias.
•	Aunque el equipo conoce React, se tiene mayor experiencia previa desarrollando aplicaciones específicamente con Ionic Angular.
Decisión
Se escoge utilizar Ionic Angular Standalone como framework principal para desarrollar la aplicación móvil.
La elección se fundamenta en la experiencia previa con Angular y en la familiaridad con la estructura de proyectos Ionic Angular.
Se utilizarán componentes standalone para organizar las interfaces, servicios para centralizar la lógica de negocio y el acceso a datos, Angular Router para la navegación y Reactive Forms para gestionar los formularios y sus validaciones.
Además, se utilizará Capacitor para integrar las funcionalidades nativas necesarias para el proyecto.
Consecuencias
Beneficios:
•	Se aprovechan los conocimientos previos de los integrantes.
•	Se mantiene una estructura organizada y reutilizable.
•	Se facilita la separación de responsabilidades.
•	Se dispone de herramientas integradas para navegación y validación de formularios.
•	Se facilita la integración con Supabase y Capacitor.
Limitaciones:
•	Se debe mantener una correcta organización de componentes, servicios y modelos.
•	Los integrantes deberán respetar una misma estructura para mantener consistencia entre sus implementaciones.
Riesgo identificado:
Una configuración incorrecta de componentes standalone o de las dependencias de Ionic podría ocasionar errores de compilación o problemas de integración.
Verificación
Se comprobará la decisión mediante las siguientes pruebas:
1.	Crear el proyecto utilizando Ionic Angular Standalone.
2.	Ejecutar ionic serve y comprobar que la aplicación se inicia correctamente.
3.	Crear diferentes páginas y comprobar la navegación entre ellas.
4.	Implementar un formulario con Reactive Forms y verificar sus validaciones.
5.	Integrar Capacitor y comprobar la compilación para Android.
6.	Verificar que los tres integrantes puedan ejecutar y mantener la estructura acordada.
Comandos de referencia:
ionic serve
ionic build
npx cap add android
npx cap sync android
npx cap open android

Consenso del equipo
Acuerdo final: Ionic Angular Standalone
Minuto del video: 00:02:05

