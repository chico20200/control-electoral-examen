import { ErrorApp } from '../models/error-app';

import { mensajeDe } from './mensajes';

describe('mensajeDe', () => {
  it('traduce los códigos del servidor', () => {
    expect(mensajeDe(new ErrorApp('CREDENCIALES'))).toContain('Cédula o contraseña');
    expect(mensajeDe(new ErrorApp('RED'))).toContain('conexión');
  });

  it('no muestra detalles técnicos de errores desconocidos', () => {
    const generico = mensajeDe(new ErrorApp('INTERNO'));
    expect(mensajeDe(new Error('relation "perfiles" does not exist'))).toBe(generico);
    expect(mensajeDe(new ErrorApp('CODIGO_NUEVO'))).toBe(generico);
    expect(mensajeDe(new ErrorApp('toString'))).toBe(generico);
  });
});
