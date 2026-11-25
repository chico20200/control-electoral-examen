import { ErrorApp } from '../models/error-app';

import { Recurso } from './recurso';

describe('Recurso (R9)', () => {
  it('pasa de cargando a éxito', async () => {
    const r = new Recurso<number[]>();
    expect(r.estado().fase).toBe('inicial');
    const espera = r.cargar(() => Promise.resolve([1]));
    expect(r.estado().fase).toBe('cargando');
    await espera;
    expect(r.estado()).toEqual({ fase: 'exito', datos: [1], error: null });
  });

  it('un fallo queda como error con mensaje y sin datos', async () => {
    const r = new Recurso<number[]>();
    await r.cargar(() => Promise.resolve([1]));
    await r.cargar(() => Promise.reject(new ErrorApp('RED')));
    expect(r.estado().fase).toBe('error');
    expect(r.estado().datos).toBeNull();
    expect(r.estado().error).toContain('conexión');
  });

  it('una respuesta vieja no reemplaza a la nueva', async () => {
    const r = new Recurso<string>();
    let responder!: (v: string) => void;
    const vieja = r.cargar(() => new Promise<string>((ok) => (responder = ok)));
    await r.cargar(() => Promise.resolve('nueva'));
    responder('vieja');
    await vieja;
    expect(r.estado().datos).toBe('nueva');
  });
});
