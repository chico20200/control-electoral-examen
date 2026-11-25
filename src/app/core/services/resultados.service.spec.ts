import { TestBed } from '@angular/core/testing';

import { ResultadosRepo } from '../data/resultados.repo';
import type { FilaResultado } from '../models';
import { ErrorApp } from '../models/error-app';

import { ResultadosService } from './resultados.service';

const fila = (
  recintoId: string,
  candidaturaId: string,
  votos: number,
  dignidad: 'alcalde' | 'prefecto' = 'alcalde',
): FilaResultado => ({
  recintoId,
  candidaturaId,
  votos,
  dignidad,
  candidato: `Cand ${candidaturaId}`,
  organizacion: `Org ${candidaturaId}`,
});

describe('ResultadosService (R4)', () => {
  const repo = { resultados: vi.fn(), avance: vi.fn(), actasGps: vi.fn() };
  let s: ResultadosService;
  const votos = () => s.resultados().datos?.map((r) => [r.candidato, r.votos, r.porcentaje]);

  beforeEach(() => {
    repo.resultados
      .mockReset()
      .mockResolvedValue([
        fila('r1', 'a', 10),
        fila('r1', 'b', 30),
        fila('r2', 'a', 50),
        fila('r2', 'b', 10),
        fila('r1', 'p', 7, 'prefecto'),
      ]);
    repo.avance.mockReset().mockResolvedValue([{ recintoId: 'r1', recinto: 'Uno', registradas: 1, esperadas: 8 }]);
    repo.actasGps.mockReset().mockResolvedValue([]);
    TestBed.configureTestingModule({ providers: [{ provide: ResultadosRepo, useValue: repo }] });
    s = TestBed.inject(ResultadosService);
  });

  it('consolidado: suma los recintos y ordena de mayor a menor', async () => {
    await s.cargar();
    expect(votos()).toEqual([
      ['Cand a', 60, 60],
      ['Cand b', 40, 40],
    ]);
    expect(s.totalVotos()).toBe(100);
  });

  it('filtra por recinto sin volver a consultar', async () => {
    await s.cargar();
    s.filtro.set({ dignidad: 'alcalde', recintoId: 'r1' });
    expect(votos()).toEqual([
      ['Cand b', 30, 75],
      ['Cand a', 10, 25],
    ]);
    expect(repo.resultados).toHaveBeenCalledTimes(1);
  });

  it('no mezcla dignidades', async () => {
    await s.cargar();
    s.filtro.set({ dignidad: 'prefecto', recintoId: null });
    expect(votos()).toEqual([['Cand p', 7, 100]]);
  });

  it('cero votos: porcentaje 0, no NaN', async () => {
    repo.resultados.mockResolvedValue([fila('r1', 'a', 0)]);
    await s.cargar();
    expect(votos()).toEqual([['Cand a', 0, 0]]);
  });

  it('un error se muestra sin resultados y no impide ver el avance', async () => {
    repo.resultados.mockRejectedValue(new ErrorApp('RED'));
    await s.cargar();
    expect(s.resultados()).toMatchObject({ fase: 'error', datos: null });
    expect(s.avance().datos).toHaveLength(1);
  });
});
