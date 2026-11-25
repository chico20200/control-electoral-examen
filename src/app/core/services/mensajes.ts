import { ErrorApp } from '../models/error-app';

const GENERICO = 'Ocurrió un error inesperado. Intenta de nuevo.';

const MENSAJES = new Map([
  ['CREDENCIALES', 'Cédula o contraseña incorrectas.'],
  ['SIN_CONFIRMAR', 'Confirma tu cuenta con el enlace que enviamos a tu correo.'],
  ['DATOS', 'Revisa los datos ingresados.'],
  ['CORREO', 'No se pudo enviar el correo. Revisa la dirección.'],
  ['DUPLICADO', 'Ya existe una cuenta con esa cédula o correo.'],
  ['RECINTO_OCUPADO', 'Ese recinto ya tiene coordinador.'],
  ['RECINTO_DUPLICADO', 'Ya existe un recinto con ese nombre en la parroquia.'],
  ['SESION', 'Tu sesión terminó. Vuelve a ingresar.'],
  ['CLAVE_DEBIL', 'Usa al menos 8 caracteres y no la contraseña inicial.'],
  ['CODIGO', 'El código es incorrecto o ya caducó.'],
  ['DEMASIADOS_INTENTOS', 'Demasiados intentos. Espera unos minutos.'],
  ['NO_AUTORIZADO', 'No tienes permiso para hacer esto.'],
  ['CONFLICTO', 'Otra persona cambió esta acta. Vuelve a abrirla.'],
  ['VOTOS', 'Los votos deben ser números enteros, sin campos vacíos.'],
  ['TOTALES', 'La suma de votos no coincide con el total de sufragantes.'],
  ['FOTO', 'La foto del acta falta o no corresponde a esta mesa.'],
  ['RED', 'Sin conexión. Revisa tu internet e intenta de nuevo.'],
]);

/** Texto para el usuario; los errores desconocidos no revelan detalles. */
export function mensajeDe(e: unknown): string {
  return (e instanceof ErrorApp && MENSAJES.get(e.codigo)) || GENERICO;
}
