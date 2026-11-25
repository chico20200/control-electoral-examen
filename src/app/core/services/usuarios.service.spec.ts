import { TestBed } from '@angular/core/testing';

import { UsuariosRepo } from '../data/usuarios.repo';
import { ErrorApp } from '../models/error-app';

import { UsuariosService } from './usuarios.service';

describe('UsuariosService (R2, R5)', () => {
  const repo = { veedores: vi.fn(), crear: vi.fn() };
  const datos = { cedula: '1710034065', nombres: 'Ana', apellidos: 'Paz', telefono: '0991234567', correo: 'a@b.ec' };
  let servicio: UsuariosService;

  beforeEach(() => {
    for (const f of Object.values(repo)) f.mockReset().mockResolvedValue([]);
    TestBed.configureTestingModule({ providers: [{ provide: UsuariosRepo, useValue: repo }] });
    servicio = TestBed.inject(UsuariosService);
  });

  it('carga veedores y refleja los fallos', async () => {
    await servicio.cargarVeedores();
    expect(servicio.veedores().fase).toBe('exito');
    repo.veedores.mockRejectedValue(new ErrorApp('RED'));
    await servicio.cargarVeedores();
    expect(servicio.veedores().fase).toBe('error');
  });

  it('crear envía los datos y el recinto', async () => {
    await servicio.crear(datos, 'r1');
    expect(repo.crear).toHaveBeenCalledWith(datos, 'r1');
  });

  it('crear fallido avisa y libera guardando', async () => {
    repo.crear.mockRejectedValue(new ErrorApp('DUPLICADO'));
    const espera = servicio.crear(datos);
    expect(servicio.guardando()).toBe(true);
    await expect(espera).rejects.toThrow('DUPLICADO');
    expect(servicio.guardando()).toBe(false);
  });
});
