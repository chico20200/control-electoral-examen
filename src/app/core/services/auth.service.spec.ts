import { TestBed } from '@angular/core/testing';

import { AuthRepo } from '../data/auth.repo';
import type { Perfil } from '../models';
import { ErrorApp } from '../models/error-app';

import { AuthService } from './auth.service';

const perfil: Perfil = {
  id: 'u1',
  cedula: '1710034065',
  nombres: 'Ana',
  apellidos: 'Paz',
  telefono: '0991234567',
  correo: 'ana@prueba.local',
  rol: 'veedor',
  recintoId: 'r1',
  debeCambiarClave: false,
};

describe('AuthService (R3, R9)', () => {
  const repo = {
    login: vi.fn(),
    cambiarClave: vi.fn(),
    solicitarCodigo: vi.fn(),
    recuperar: vi.fn(),
    perfil: vi.fn(),
    salir: vi.fn(),
    perfilGuardado: vi.fn(),
    guardarPerfil: vi.fn(),
  };
  let auth: AuthService;

  beforeEach(() => {
    for (const f of Object.values(repo)) f.mockReset().mockResolvedValue(undefined);
    repo.perfilGuardado.mockReturnValue(null);
    repo.perfil.mockResolvedValue(perfil);
    TestBed.configureTestingModule({ providers: [{ provide: AuthRepo, useValue: repo }] });
    auth = TestBed.inject(AuthService);
  });

  it('login: cargando → éxito, y guarda el perfil', async () => {
    expect(auth.estado().fase).toBe('inicial');
    const espera = auth.login('1710034065', 'x');
    expect(auth.estado().fase).toBe('cargando');
    await espera;
    expect(auth.estado().fase).toBe('exito');
    expect(auth.perfil()).toEqual(perfil);
    expect(repo.guardarPerfil).toHaveBeenLastCalledWith(perfil);
  });

  it('login fallido: fase error, sin perfil', async () => {
    repo.login.mockRejectedValue(new ErrorApp('CREDENCIALES'));
    await expect(auth.login('1710034065', 'x')).rejects.toThrow('CREDENCIALES');
    expect(auth.estado().fase).toBe('error');
    expect(auth.estado().error).toContain('Cédula o contraseña');
    expect(auth.perfil()).toBeNull();
  });

  it('cambiarClave fallido conserva la sesión', async () => {
    await auth.login('1710034065', 'x');
    repo.cambiarClave.mockRejectedValue(new ErrorApp('CLAVE_DEBIL'));
    await expect(auth.cambiarClave('corta')).rejects.toThrow();
    expect(auth.estado().fase).toBe('error');
    expect(auth.perfil()).toEqual(perfil);
  });

  it('cambiarClave actualiza el perfil desde el servidor', async () => {
    repo.perfil.mockResolvedValueOnce({ ...perfil, debeCambiarClave: true });
    await auth.login('1710034065', 'x');
    expect(auth.perfil()?.debeCambiarClave).toBe(true);
    await auth.cambiarClave('Nueva-2026');
    expect(auth.perfil()?.debeCambiarClave).toBe(false);
  });

  it('recuperar inicia sesión', async () => {
    await auth.recuperar('1710034065', '123456', 'Nueva-2026');
    expect(repo.recuperar).toHaveBeenCalledWith('1710034065', '123456', 'Nueva-2026');
    expect(auth.perfil()).toEqual(perfil);
  });

  it('salir borra el perfil aunque falle la red', async () => {
    await auth.login('1710034065', 'x');
    repo.salir.mockRejectedValue(new ErrorApp('RED'));
    await auth.salir();
    expect(auth.perfil()).toBeNull();
    expect(repo.guardarPerfil).toHaveBeenLastCalledWith(null);
  });

  describe('restaurar', () => {
    it('sin perfil guardado no consulta la red', async () => {
      await auth.restaurar();
      expect(auth.perfil()).toBeNull();
      expect(repo.perfil).not.toHaveBeenCalled();
    });

    it('abre con el perfil guardado sin esperar a la red', async () => {
      repo.perfilGuardado.mockReturnValue(perfil);
      repo.perfil.mockReturnValue(new Promise(() => undefined));
      await auth.restaurar();
      expect(auth.perfil()).toEqual(perfil);
    });

    it('sin red conserva el perfil', async () => {
      repo.perfilGuardado.mockReturnValue(perfil);
      repo.perfil.mockRejectedValue(new ErrorApp('RED'));
      await auth.restaurar();
      await new Promise((r) => setTimeout(r));
      expect(auth.perfil()).toEqual(perfil);
    });

    it('si el servidor rechaza la sesión, la cierra', async () => {
      repo.perfilGuardado.mockReturnValue(perfil);
      repo.perfil.mockRejectedValue(new ErrorApp('SESION'));
      await auth.restaurar();
      await vi.waitFor(() => expect(auth.perfil()).toBeNull());
      expect(repo.guardarPerfil).toHaveBeenLastCalledWith(null);
    });

    it('una respuesta tardía no revive una sesión cerrada', async () => {
      let responder!: (p: Perfil) => void;
      repo.perfilGuardado.mockReturnValue(perfil);
      repo.perfil.mockReturnValue(new Promise((r) => (responder = r)));
      await auth.restaurar();
      await auth.salir();
      responder(perfil);
      await new Promise((r) => setTimeout(r));
      expect(auth.perfil()).toBeNull();
    });
  });
});
