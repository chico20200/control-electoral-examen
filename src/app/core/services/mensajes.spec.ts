import { ErrorApp } from '../models/error-app';

import { mensajeDe } from './mensajes';

describe('mensajeDe', () => {
  it('traduce los códigos del servidor', () => {
    expect(mensajeDe(new ErrorApp('CREDENCIALES'))).toContain('Cédula o contraseña');
    expect(mensajeDe(new ErrorApp('RED'))).toContain('conexión');
    // Puede fallar el servidor de correo aunque la dirección sea correcta.
    expect(mensajeDe(new ErrorApp('CORREO'))).toContain('Intenta más tarde');
  });

  it('no muestra detalles técnicos de errores desconocidos', () => {
    const generico = mensajeDe(new ErrorApp('INTERNO'));
    expect(mensajeDe(new Error('relation "perfiles" does not exist'))).toBe(generico);
    expect(mensajeDe(new ErrorApp('CODIGO_NUEVO'))).toBe(generico);
    expect(mensajeDe(new ErrorApp('toString'))).toBe(generico);
  });
});
