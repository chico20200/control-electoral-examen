import { TestBed } from '@angular/core/testing';

import { RecintosRepo } from '../data/recintos.repo';
import { ErrorApp } from '../models/error-app';

import { RecintosService } from './recintos.service';

describe('RecintosService (R4, R5)', () => {
  const repo = { listar: vi.fn(), crear: vi.fn(), mesas: vi.fn(), asignarVeedor: vi.fn() };
  const recinto = { provincia: 'Pichincha', canton: 'Quito', parroquia: 'Centro', nombre: 'Demo', numJrv: 3 };
  let servicio: RecintosService;

  beforeEach(() => {
    for (const f of Object.values(repo)) f.mockReset().mockResolvedValue([]);
    TestBed.configureTestingModule({ providers: [{ provide: RecintosRepo, useValue: repo }] });
    servicio = TestBed.inject(RecintosService);
  });

  it('carga recintos', async () => {
    repo.listar.mockResolvedValue([{ id: 'r1', ...recinto }]);
    await servicio.cargar();
    expect(servicio.recintos().fase).toBe('exito');
    expect(servicio.recintos().datos).toHaveLength(1);
  });

  it('un fallo al cargar mesas queda como error', async () => {
    repo.mesas.mockRejectedValue(new ErrorApp('RED'));
    await servicio.cargarMesas();
    expect(servicio.mesas().fase).toBe('error');
  });

  it('crear recarga la lista y marca guardando', async () => {
    const espera = servicio.crear(recinto);
    expect(servicio.guardando()).toBe(true);
    await espera;
    expect(servicio.guardando()).toBe(false);
    expect(repo.crear).toHaveBeenCalledWith(recinto);
    expect(repo.listar).toHaveBeenCalledTimes(1);
  });

  it('crear fallido avisa y libera guardando', async () => {
    repo.crear.mockRejectedValue(new ErrorApp('RECINTO_DUPLICADO'));
    await expect(servicio.crear(recinto)).rejects.toThrow('RECINTO_DUPLICADO');
    expect(servicio.guardando()).toBe(false);
    expect(repo.listar).not.toHaveBeenCalled();
  });

  it('asignar recarga las mesas', async () => {
    await servicio.asignarVeedor('m1', 'v1');
    expect(repo.asignarVeedor).toHaveBeenCalledWith('m1', 'v1');
    expect(repo.mesas).toHaveBeenCalledTimes(1);
  });

  it('asignar fallido también recarga, para mostrar lo que hay en el servidor', async () => {
    repo.asignarVeedor.mockRejectedValue(new ErrorApp('NO_AUTORIZADO'));
    await expect(servicio.asignarVeedor('m1', 'v1')).rejects.toThrow('NO_AUTORIZADO');
    expect(repo.mesas).toHaveBeenCalledTimes(1);
  });
});
