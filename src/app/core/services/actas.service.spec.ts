import { TestBed } from '@angular/core/testing';

import { ActasRepo } from '../data/actas.repo';
import { BorradoresRepo } from '../data/borradores.repo';
import { LocalRepo } from '../data/local.repo';
import { RecintosRepo } from '../data/recintos.repo';
import type { BorradorActa } from '../models';
import { ErrorApp } from '../models/error-app';

import { ActasService } from './actas.service';
import { AuthService } from './auth.service';
import { RedService } from './red.service';
import { SyncService } from './sync.service';

describe('ActasService (R6)', () => {
  const repo = { mesa: vi.fn(), candidaturas: vi.fn(), obtener: vi.fn(), urlFoto: vi.fn(), guardar: vi.fn() };
  const borradores = { leer: vi.fn(), guardar: vi.fn(), borrar: vi.fn() };
  const recintos = { mesas: vi.fn() };
  const sync = { encolar: vi.fn(), espera: vi.fn(), refrescar: vi.fn() };
  const cache = new Map<string, unknown>();
  const local = {
    guardarCache: vi.fn(async (k: string, v: unknown) => void cache.set(k, v)),
    leerCache: vi.fn(async (k: string) => cache.get(k) ?? null),
  };
  let enLinea = true;
  const mesaFila = { id: 'm1', recintoId: 'r1', numero: 1, veedorId: 'u1', veedor: null };
  const borrador = { jrvId: 'm1', dignidad: 'alcalde' } as BorradorActa;
  let servicio: ActasService;

  beforeEach(() => {
    for (const f of [
      ...Object.values(repo),
      ...Object.values(borradores),
      ...Object.values(recintos),
      ...Object.values(sync),
    ])
      f.mockReset();
    repo.mesa.mockResolvedValue({ id: 'm1', recintoId: 'r1', numero: 1 });
    repo.candidaturas.mockResolvedValue([]);
    repo.obtener.mockResolvedValue(null);
    repo.urlFoto.mockResolvedValue('https://foto');
    borradores.leer.mockReturnValue(null);
    cache.clear();
    enLinea = true;
    sync.espera.mockReturnValue(false);
    sync.refrescar.mockResolvedValue(undefined);
    recintos.mesas.mockResolvedValue([{ ...mesaFila, alcalde: false, prefecto: true }]);
    TestBed.configureTestingModule({
      providers: [
        { provide: ActasRepo, useValue: repo },
        { provide: BorradoresRepo, useValue: borradores },
        { provide: RecintosRepo, useValue: recintos },
        { provide: LocalRepo, useValue: local },
        { provide: SyncService, useValue: sync },
        { provide: RedService, useValue: { enLinea: () => enLinea } },
        { provide: AuthService, useValue: { perfil: () => ({ id: 'u1' }) } },
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

  describe('sin conexión (R10)', () => {
    const preparar = async () => {
      repo.candidaturas.mockResolvedValue([{ id: 'c1' }]);
      repo.obtener.mockResolvedValue({ version: 4, fotoPath: 'f' });
      await servicio.cargarMisMesas();
      await vi.waitFor(() => expect(cache.has('u1/acta/m1/prefecto')).toBe(true));
      await vi.waitFor(() => expect(cache.has('u1/candidaturas/alcalde')).toBe(true));
      enLinea = false;
      for (const f of [...Object.values(repo), recintos.mesas]) f.mockReset().mockRejectedValue(new ErrorApp('RED'));
    };

    it('sin red: pendiente, y no se intenta el envío', async () => {
      enLinea = false;
      expect(await servicio.guardar(borrador)).toBe('pendiente');
      expect(sync.encolar).toHaveBeenCalled();
      expect(repo.guardar).not.toHaveBeenCalled();
      expect(borradores.borrar).toHaveBeenCalled();
    });

    it('la red falla a mitad del envío: pendiente, con la misma operación', async () => {
      repo.guardar.mockRejectedValue(new ErrorApp('RED'));
      expect(await servicio.guardar(borrador)).toBe('pendiente');
      expect(sync.encolar.mock.calls[0][0]).toBe(borrador);
    });

    it('otros errores no se encolan', async () => {
      repo.guardar.mockRejectedValue(new ErrorApp('CONFLICTO'));
      await expect(servicio.guardar(borrador)).rejects.toThrow('CONFLICTO');
      expect(sync.encolar).not.toHaveBeenCalled();
    });

    it('si no se pudo guardar en el teléfono, no se borra lo escrito', async () => {
      enLinea = false;
      sync.encolar.mockRejectedValue(new Error('disco'));
      await expect(servicio.guardar(borrador)).rejects.toThrow();
      expect(borradores.borrar).not.toHaveBeenCalled();
      expect(servicio.estadoGuardado().fase).toBe('error');
    });

    it('muestra las mesas guardadas', async () => {
      await preparar();
      await servicio.cargarMisMesas();
      expect(servicio.misMesas().datos).toHaveLength(1);
    });

    it('sin copia guardada informa la falta de red', async () => {
      enLinea = false;
      await servicio.cargarMisMesas();
      expect(servicio.misMesas()).toMatchObject({ fase: 'error' });
      expect(servicio.misMesas().error).toContain('conexión');
    });

    it('abre un acta nueva y una registrada con su versión', async () => {
      await preparar();
      await servicio.abrir('m1', 'alcalde');
      expect(servicio.abierta().datos).toMatchObject({ acta: null, candidaturas: [{ id: 'c1' }] });
      await servicio.abrir('m1', 'prefecto');
      expect(servicio.abierta().datos?.acta?.version).toBe(4);
    });

    it('un acta registrada sin copia no se abre como nueva', async () => {
      await preparar();
      cache.delete('u1/acta/m1/prefecto');
      await servicio.abrir('m1', 'prefecto');
      expect(servicio.abierta().fase).toBe('error');
    });

    it('si el plugin dice que hay red pero falla, usa la copia', async () => {
      await preparar();
      enLinea = true;
      await servicio.abrir('m1', 'alcalde');
      expect(servicio.abierta().fase).toBe('exito');
    });

    it('un acta por enviar no se abre: se perdería la foto en cola', async () => {
      sync.espera.mockReturnValue(true);
      await servicio.abrir('m1', 'alcalde');
      expect(servicio.abierta().error).toContain('por enviar');
    });
  });
});
