ADR-003: Uso de plugins oficiales de Capacitor para cámara y geolocalización
Estado: Aceptado
Fecha: 2026-11-22
Equipo:Alex Suárez, Justin Paladines, Sebastian Chico
Requisitos relacionados
•	R7 – Cámara y ubicación: capturar fotografías de las actas, comprobar su nitidez y guardar las coordenadas GPS.
•	R6 – Veedor: permitir el registro de información de las actas desde la aplicación móvil.
Contexto
La aplicación necesita acceder a la cámara y a la ubicación del dispositivo para que los veedores puedan fotografiar las actas electorales y registrar las coordenadas GPS correspondientes.
Como la aplicación se desarrollará con Ionic y Capacitor para Android, es necesario elegir una forma de acceder a las funciones nativas del dispositivo y gestionar los permisos correspondientes.
También se deben contemplar situaciones en las que el usuario no conceda permisos, la cámara no esté disponible o no se pueda obtener la ubicación.
Alternativas consideradas
Alternativa 1: Plugins oficiales de Capacitor
Utilizar los plugins oficiales @capacitor/camera y @capacitor/geolocation.
Ventajas:
•	Están diseñados para integrarse con aplicaciones desarrolladas con Capacitor.
•	Permiten acceder a las funciones nativas de cámara y geolocalización.
•	Facilitan la gestión de permisos del dispositivo.
•	Permiten mantener una integración organizada desde los servicios de la aplicación.
Desventajas:
•	Requieren instalación y configuración.
•	Es necesario configurar los permisos correspondientes para Android.
•	Se deben controlar los errores y las diferencias de comportamiento entre dispositivos.
Alternativa 2: APIs del navegador
Utilizar las APIs web disponibles en el navegador, como navigator.geolocation y la captura de imágenes mediante elementos HTML.
Ventajas:
•	No requieren instalar plugins adicionales para las funciones básicas.
•	Permiten utilizar funcionalidades disponibles en los navegadores modernos.
•	Pueden ser suficientes para aplicaciones web sencillas.
Desventajas:
•	El acceso a las funciones del dispositivo puede variar según el navegador y el entorno.
•	La integración con las funciones nativas de Android puede ser menos directa.
•	Se requiere gestionar las limitaciones y permisos propios del navegador.
Decisión
Se utilizarán los plugins oficiales de Capacitor:
•	@capacitor/camera para capturar fotografías de las actas.
•	@capacitor/geolocation para obtener las coordenadas GPS del dispositivo.
El funcionamiento contemplará lo siguiente:
1.	Solicitar los permisos necesarios cuando el usuario intente utilizar la cámara o ubicación.
2.	Permitir capturar una fotografía del acta.
3.	Comprobar que la fotografía tenga una calidad suficiente antes de aceptarla.
4.	Obtener las coordenadas de latitud y longitud.
5.	Asociar la fotografía y las coordenadas al registro del acta.
6.	Mostrar mensajes cuando los permisos sean denegados u ocurra algún error.
Consecuencias
Beneficios:
•	Se aprovechan las funcionalidades nativas de Android mediante Capacitor.
•	Se mantiene una integración organizada mediante servicios.
•	Se facilita el acceso a la cámara y a la ubicación.
•	Se pueden controlar los errores y permisos desde la aplicación.
Limitaciones y riesgos:
•	El funcionamiento depende de los permisos concedidos por el usuario.
•	La ubicación puede no estar disponible o presentar imprecisiones.
•	Las fotografías pueden tener problemas de iluminación o nitidez.
•	Es necesario probar la integración en dispositivos Android para comprobar su funcionamiento real.
Verificación
Se realizarán las siguientes pruebas:
1.	Abrir la cámara desde la aplicación y capturar una fotografía.
2.	Comprobar que la imagen capturada pueda visualizarse antes de aceptarla.
3.	Obtener la ubicación y comprobar que se registren los valores de latitud y longitud.
4.	Denegar los permisos de cámara y ubicación y comprobar que se muestren mensajes adecuados.
5.	Probar el comportamiento cuando la ubicación no esté disponible.
6.	Comprobar que la fotografía y las coordenadas queden asociadas al acta correspondiente.
Uso de IA
Se utilizó ChatGPT como apoyo para comparar las alternativas de acceso a la cámara y geolocalización, identificar los plugins de Capacitor necesarios y organizar los casos de verificación.

Consenso del equipo
Acuerdo final: plugins oficiales @capacitor/camera y @capacitor/geolocation.
Minuto del video: 00:18:22


