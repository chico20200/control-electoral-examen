import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { ActasRepo } from '../data/actas.repo';
import { AuthRepo } from '../data/auth.repo';
import { LocalRepo } from '../data/local.repo';
import type { BorradorActa, Perfil, RegistroCola } from '../models';
import { ErrorApp } from '../models/error-app';

import { AuthService } from './auth.service';
import { RedService } from './red.service';
import { SyncService } from './sync.service';

const registro = (operacionId: string): RegistroCola => ({
  operacionId,
  mesa: 1,
  estado: 'pendiente',
  motivo: null,
  borrador: { operacionId, jrvId: 'm1', dignidad: 'alcalde' } as BorradorActa,
});

describe('SyncService (R10, ADR-006)', () => {
  const perfil = signal<Perfil | null>(null);
  const enLinea$ = new BehaviorSubject(false);
  const actas = { guardar: vi.fn() };
  const authRepo = { perfil: vi.fn() };
  let cola: (RegistroCola & { usuario: string })[];
  const local = {
    pendientes: vi.fn(async (u: string) => cola.filter((r) => r.usuario === u).map((r) => ({ ...r }))),
    foto: vi.fn(async () => new Blob(['f'])),
    marcar: vi.fn(async (id: string, estado: RegistroCola['estado'], motivo?: string) => {
      const r = cola.find((x) => x.operacionId === id)!;
      r.estado = estado;
      r.motivo = motivo ?? null;
    }),
    descartar: vi.fn(async (id: string) => void (cola = cola.filter((r) => r.operacionId !== id))),
    encolar: vi.fn(),
  };
  let sync: SyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    actas.guardar.mockReset().mockResolvedValue({ id: 'a', version: 1 });
    authRepo.perfil.mockReset().mockResolvedValue({ id: 'u1' });
    enLinea$.next(true);
    perfil.set({ id: 'u1', debeCambiarClave: false } as Perfil);
    cola = ['op1', 'op2'].map((id) => ({ ...registro(id), usuario: 'u1' }));
    TestBed.configureTestingModule({
      providers: [
        { provide: ActasRepo, useValue: actas },
        { provide: AuthRepo, useValue: authRepo },
        { provide: LocalRepo, useValue: local },
        { provide: AuthService, useValue: { perfil } },
        { provide: RedService, useValue: { enLinea$, enLinea: () => enLinea$.value } },
      ],
    });
    sync = TestBed.inject(SyncService);
  });

  it('envía en orden, con la foto, y marca sincronizado', async () => {
    await sync.sincronizar();
    expect(actas.guardar.mock.calls.map(([b]) => b.operacionId)).toEqual(['op1', 'op2']);
    expect(actas.guardar.mock.calls[0][0].foto).toBeInstanceOf(Blob);
    expect(sync.registros().every((r) => r.estado === 'sincronizado')).toBe(true);
    expect(sync.pendientes()).toEqual([]);
  });

  it('dos avisos a la vez envían una sola vez', async () => {
    await Promise.all([sync.sincronizar(), sync.sincronizar()]);
    expect(actas.guardar).toHaveBeenCalledTimes(2);
    await sync.sincronizar();
    expect(actas.guardar).toHaveBeenCalledTimes(2);
  });

  it('se envía sola al volver la red', async () => {
    enLinea$.next(false);
    sync.iniciar();
    await new Promise((r) => setTimeout(r, 10));
    expect(actas.guardar).not.toHaveBeenCalled();
    enLinea$.next(true);
    enLinea$.next(true);
    await vi.waitFor(() => expect(sync.registros().map((r) => r.estado)).toEqual(['sincronizado', 'sincronizado']));
    expect(actas.guardar).toHaveBeenCalledTimes(2);
  });

  it.each(['RED', 'SESION'])('%s: todo sigue pendiente y no insiste con el resto', async (codigo) => {
    actas.guardar.mockRejectedValue(new ErrorApp(codigo));
    await sync.sincronizar();
    expect(actas.guardar).toHaveBeenCalledTimes(1);
    expect(sync.pendientes()).toHaveLength(2);
  });

  it('un fallo interno queda pendiente y no detiene al resto', async () => {
    actas.guardar.mockRejectedValueOnce(new ErrorApp('INTERNO'));
    await sync.sincronizar();
    expect(sync.pendientes().map((r) => r.operacionId)).toEqual(['op1']);
  });

  it.each(['CONFLICTO', 'NO_AUTORIZADO', 'TOTALES', 'FOTO'])(
    '%s: conflicto con motivo, sin reintento, y sigue con el resto',
    async (codigo) => {
      actas.guardar.mockRejectedValueOnce(new ErrorApp(codigo));
      await sync.sincronizar();
      expect(sync.registros()[0]).toMatchObject({ estado: 'conflicto', motivo: codigo });
      expect(sync.registros()[1].estado).toBe('sincronizado');
      await sync.sincronizar();
      expect(actas.guardar).toHaveBeenCalledTimes(2);
    },
  );

  it('solo envía lo del usuario que lo creó', async () => {
    cola[0].usuario = 'otro';
    await sync.sincronizar();
    expect(actas.guardar.mock.calls.map(([b]) => b.operacionId)).toEqual(['op2']);
  });

  it('sin sesión válida en el servidor no envía: evitaría un falso conflicto', async () => {
    authRepo.perfil.mockRejectedValue(new ErrorApp('SESION'));
    await sync.sincronizar();
    expect(actas.guardar).not.toHaveBeenCalled();
    authRepo.perfil.mockResolvedValue({ id: 'otro' });
    await sync.sincronizar();
    expect(actas.guardar).not.toHaveBeenCalled();
    expect(sync.pendientes()).toHaveLength(2);
  });

  it('si el usuario sale a mitad del envío, se detiene', async () => {
    actas.guardar.mockImplementationOnce(async () => perfil.set(null));
    await sync.sincronizar();
    expect(actas.guardar).toHaveBeenCalledTimes(1);
  });

  it('sin red no intenta', async () => {
    enLinea$.next(false);
    await sync.sincronizar();
    expect(actas.guardar).not.toHaveBeenCalled();
    expect(sync.pendientes()).toHaveLength(2);
  });

  it('una foto perdida pasa a conflicto en vez de enviarse sin ella', async () => {
    cola[0].borrador.fotoPath = null;
    local.foto.mockResolvedValueOnce(null as unknown as Blob);
    await sync.sincronizar();
    expect(sync.registros()[0]).toMatchObject({ estado: 'conflicto', motivo: 'FOTO' });
    expect(actas.guardar).toHaveBeenCalledTimes(1);
  });

  it('encola con el usuario actual y avisa si el acta espera envío', async () => {
    const b = cola[0].borrador;
    await sync.encolar(b, 3);
    expect(local.encolar).toHaveBeenCalledWith('u1', 3, b);
    expect(sync.espera('m1', 'alcalde')).toBe(true);
    expect(sync.espera('m1', 'prefecto')).toBe(false);
  });

  it('descartar quita el registro', async () => {
    await sync.descartar('op1');
    expect(sync.registros().map((r) => r.operacionId)).toEqual(['op2']);
  });
});
