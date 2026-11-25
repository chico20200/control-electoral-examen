import type { Route, Routes } from '@angular/router';

import { cambioClaveGuard } from './core/guards/cambio-clave.guard';
import { rolGuard } from './core/guards/rol.guard';
import { invitadoGuard, sesionGuard } from './core/guards/sesion.guard';
import type { Rol } from './core/models';

const privada = (rol: Rol, path: string, loadComponent: Route['loadComponent']): Route => ({
  path: `${rol}${path}`,
  canActivate: [sesionGuard, cambioClaveGuard, rolGuard(rol)],
  loadComponent,
});

const inicio = () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage);

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'recuperar',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/auth/recuperar/recuperar.page').then((m) => m.RecuperarPage),
  },
  {
    path: 'cambiar-clave',
    canActivate: [sesionGuard],
    loadComponent: () => import('./pages/auth/cambiar-clave/cambiar-clave.page').then((m) => m.CambiarClavePage),
  },
  privada('provincial', '', inicio),
  privada('recinto', '', inicio),
  privada('veedor', '', inicio),
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
