import { TestBed } from '@angular/core/testing';

import { ActasRepo } from '../data/actas.repo';
import { BorradoresRepo } from '../data/borradores.repo';
import { RecintosRepo } from '../data/recintos.repo';
import type { BorradorActa } from '../models';
import { ErrorApp } from '../models/error-app';

import { ActasService } from './actas.service';

describe('ActasService (R6)', () => {
  const repo = { mesa: vi.fn(), candidaturas: vi.fn(), obtener: vi.fn(), urlFoto: vi.fn(), guardar: vi.fn() };
  const borradores = { leer: vi.fn(), guardar: vi.fn(), borrar: vi.fn() };
  const recintos = { mesas: vi.fn() };
  const borrador = { jrvId: 'm1', dignidad: 'alcalde' } as BorradorActa;
  let servicio: ActasService;

  beforeEach(() => {
    for (const f of [...Object.values(repo), ...Object.values(borradores)]) f.mockReset();
    repo.mesa.mockResolvedValue({ id: 'm1', recintoId: 'r1', numero: 1 });
    repo.candidaturas.mockResolvedValue([]);
    repo.obtener.mockResolvedValue(null);
    repo.urlFoto.mockResolvedValue('https://foto');
    borradores.leer.mockReturnValue(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: ActasRepo, useValue: repo },
        { provide: BorradoresRepo, useValue: borradores },
        { provide: RecintosRepo, useValue: recintos },
      ],
    });
    servicio = TestBed.inject(ActasService);
  });

  it('abre un acta nueva sin pedir foto', async () => {
    await servicio.abrir('m1', 'alcalde');
    expect(servicio.abierta().fase).toBe('exito');
    expect(servicio.abierta().datos).toMatchObject({ acta: null, fotoUrl: null, valores: null });
    expect(repo.urlFoto).not.toHaveBeenCalled();
  });

  it('recupera los votos escritos si son de la misma versión', async () => {
    repo.obtener.mockResolvedValue({ version: 2, fotoPath: 'f' });
    borradores.leer.mockReturnValue({ version: 2, valores: { nulos: '3' } });
    await servicio.abrir('m1', 'alcalde');
    expect(servicio.abierta().datos?.valores).toEqual({ nulos: '3' });
    borradores.leer.mockReturnValue({ version: 1, valores: { nulos: '3' } });
    await servicio.abrir('m1', 'alcalde');
    expect(servicio.abierta().datos?.valores).toBeNull();
  });

  it('que falle la vista previa no impide corregir', async () => {
    repo.obtener.mockResolvedValue({ version: 1, fotoPath: 'f' });
    repo.urlFoto.mockRejectedValue(new ErrorApp('RED'));
    await servicio.abrir('m1', 'alcalde');
    expect(servicio.abierta().datos).toMatchObject({ fotoUrl: null });
  });

  it('guardar: cargando → éxito y borra el borrador', async () => {
    repo.guardar.mockResolvedValue({ id: 'a', version: 1 });
    const espera = servicio.guardar(borrador);
    expect(servicio.estadoGuardado().fase).toBe('cargando');
    expect(await espera).toBe('enviada');
    expect(servicio.estadoGuardado().fase).toBe('exito');
    expect(borradores.borrar).toHaveBeenCalledWith('m1', 'alcalde');
  });

  it('guardar fallido conserva el borrador', async () => {
    repo.guardar.mockRejectedValue(new ErrorApp('TOTALES'));
    await expect(servicio.guardar(borrador)).rejects.toThrow('TOTALES');
    expect(servicio.estadoGuardado().fase).toBe('error');
    expect(borradores.borrar).not.toHaveBeenCalled();
  });
});
