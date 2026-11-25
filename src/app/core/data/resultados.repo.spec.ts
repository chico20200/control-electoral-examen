import { TestBed } from '@angular/core/testing';

import { ResultadosRepo } from './resultados.repo';
import { SUPABASE } from './supabase.client';

describe('ResultadosRepo (R4)', () => {
  const responder = (datos: unknown[], error: unknown = null) => {
    const consulta = Promise.resolve({ data: error ? null : datos, error, status: error ? 403 : 200 });
    const cadena: Record<string, unknown> = { then: consulta.then.bind(consulta) };
    for (const m of ['select', 'order', 'returns']) cadena[m] = () => cadena;
    TestBed.configureTestingModule({ providers: [{ provide: SUPABASE, useValue: { from: () => cadena } }] });
    return TestBed.inject(ResultadosRepo);
  };

  it('aplana la mesa y el recinto de cada acta', async () => {
    const acta = { id: 'x', dignidad: 'alcalde', lat: -0.2, lng: -78.5, precisionM: 8 };
    const repo = responder([{ ...acta, jrvs: { numero: 3, recintos: { nombre: 'Uno' } } }]);
    expect(await repo.actasGps()).toEqual([{ ...acta, jrv: 3, recinto: 'Uno' }]);
  });

  it('un rechazo del servidor llega como ErrorApp', async () => {
    await expect(responder([], { message: 'x' }).avance()).rejects.toThrow('NO_AUTORIZADO');
  });
});
