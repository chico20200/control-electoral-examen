import { TestBed } from '@angular/core/testing';

import type { BorradorActa } from '../models';

import { ActasRepo } from './actas.repo';
import { SUPABASE } from './supabase.client';

describe('ActasRepo.guardar (R6, R7)', () => {
  const upload = vi.fn();
  const rpc = vi.fn();
  const foto = new Blob(['x']);
  const base: BorradorActa = {
    operacionId: 'op1',
    recintoId: 'r1',
    jrvId: 'm1',
    dignidad: 'alcalde',
    votos: { c1: 3 },
    blancos: 1,
    nulos: 0,
    totalSufragantes: 4,
    lat: -0.2,
    lng: -78.5,
    precisionM: 8,
    capturadaEn: '2026-11-25T00:00:00Z',
    versionBase: 0,
    foto,
    fotoPath: null,
  };
  let repo: ActasRepo;

  beforeEach(() => {
    upload.mockReset().mockResolvedValue({ error: null });
    rpc.mockReset().mockResolvedValue({ data: { id: 'a1', version: 1 }, error: null, status: 200 });
    TestBed.configureTestingModule({
      providers: [{ provide: SUPABASE, useValue: { storage: { from: () => ({ upload }) }, rpc } }],
    });
    repo = TestBed.inject(ActasRepo);
  });

  it('sube la foto y luego envía el acta con su ruta y GPS', async () => {
    expect(await repo.guardar(base)).toEqual({ id: 'a1', version: 1 });
    const ruta = 'r1/m1/alcalde/op1.jpg';
    expect(upload.mock.calls[0].slice(0, 2)).toEqual([ruta, foto]);
    expect(rpc).toHaveBeenCalledWith('guardar_acta', {
      p: {
        jrv_id: 'm1',
        dignidad: 'alcalde',
        operacion_id: 'op1',
        version_base: 0,
        votos: { c1: 3 },
        blancos: 1,
        nulos: 0,
        total_sufragantes: 4,
        foto_path: ruta,
        lat: -0.2,
        lng: -78.5,
        precision_m: 8,
        capturada_en: '2026-11-25T00:00:00Z',
      },
    });
  });

  it('sin foto nueva conserva la ruta anterior y no sube nada', async () => {
    await repo.guardar({ ...base, foto: null, fotoPath: 'r1/m1/alcalde/vieja.jpg', versionBase: 1 });
    expect(upload).not.toHaveBeenCalled();
    expect(rpc.mock.calls[0][1].p.foto_path).toBe('r1/m1/alcalde/vieja.jpg');
  });

  it('en un reintento la foto ya subida cuenta como éxito', async () => {
    upload.mockResolvedValue({ error: { statusCode: '409', status: 400 } });
    expect((await repo.guardar(base)).version).toBe(1);
  });

  it.each([
    [{ statusCode: '403', status: 400 }, 'NO_AUTORIZADO'],
    [{ message: 'Failed to fetch' }, 'RED'],
    [{ statusCode: '500', status: 500 }, 'INTERNO'],
  ])('si la foto falla no envía el acta: %j', async (error, codigo) => {
    upload.mockResolvedValue({ error });
    await expect(repo.guardar(base)).rejects.toThrow(codigo);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('traduce el conflicto de la base', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'CONFLICTO' }, status: 400 });
    await expect(repo.guardar(base)).rejects.toThrow('CONFLICTO');
  });
});
