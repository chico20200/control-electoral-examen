import { signal, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import type { Perfil, Rol } from '../models';
import { AuthService } from '../services/auth.service';

import { cambioClaveGuard } from './cambio-clave.guard';
import { rolGuard } from './rol.guard';
import { invitadoGuard, sesionGuard } from './sesion.guard';

@Component({ template: '' })
class VaciaComponent {}

describe('guards (R3, R8)', () => {
  const perfil = signal<Perfil | null>(null);
  const como = (rol: Rol, debeCambiarClave = false) => perfil.set({ rol, debeCambiarClave } as Perfil);
  const privada = (rol: Rol) => ({
    path: rol,
    component: VaciaComponent,
    canActivate: [sesionGuard, cambioClaveGuard, rolGuard(rol)],
  });

  let navegador: RouterTestingHarness | undefined;
  const ir = async (url: string) => {
    navegador ??= await RouterTestingHarness.create();
    await navegador.navigateByUrl(url);
    return TestBed.inject(Router).url;
  };

  beforeEach(() => {
    perfil.set(null);
    navegador = undefined;
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { perfil } },
        provideRouter([
          { path: 'login', component: VaciaComponent, canActivate: [invitadoGuard] },
          { path: 'cambiar-clave', component: VaciaComponent, canActivate: [sesionGuard] },
          privada('provincial'),
          privada('recinto'),
          privada('veedor'),
        ]),
      ],
    });
  });

  it.each(['/provincial', '/recinto', '/veedor', '/cambiar-clave'])('sin sesión, %s → /login', async (url) => {
    expect(await ir(url)).toBe('/login');
  });

  it('con clave inicial → /cambiar-clave, incluso desde /login', async () => {
    como('veedor', true);
    expect(await ir('/veedor')).toBe('/cambiar-clave');
    expect(await ir('/login')).toBe('/cambiar-clave');
  });

  it.each([
    ['veedor', '/provincial'],
    ['veedor', '/recinto'],
    ['recinto', '/provincial'],
    ['provincial', '/veedor'],
  ] as [Rol, string][])('%s en %s vuelve a su inicio', async (rol, url) => {
    como(rol);
    expect(await ir(url)).toBe(`/${rol}`);
  });

  it.each(['provincial', 'recinto', 'veedor'] as Rol[])('%s entra en su pantalla', async (rol) => {
    como(rol);
    expect(await ir(`/${rol}`)).toBe(`/${rol}`);
  });

  it('con sesión, /login lleva al inicio', async () => {
    como('recinto');
    expect(await ir('/login')).toBe('/recinto');
  });
});
