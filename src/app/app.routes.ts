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

const acta = () => import('./pages/acta/acta.page').then((m) => m.ActaPage);
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
  privada('provincial', '/recintos', () =>
    import('./pages/provincial/recintos/recintos.page').then((m) => m.RecintosPage),
  ),
  privada('provincial', '/recintos/nuevo', () =>
    import('./pages/provincial/recinto-nuevo/recinto-nuevo.page').then((m) => m.RecintoNuevoPage),
  ),
  privada('provincial', '/recintos/:id/coordinador', () =>
    import('./pages/provincial/coordinador-nuevo/coordinador-nuevo.page').then((m) => m.CoordinadorNuevoPage),
  ),
  privada('provincial', '/resultados', () =>
    import('./pages/provincial/dashboard/dashboard.page').then((m) => m.DashboardPage),
  ),
  privada('provincial', '/avance', () => import('./pages/provincial/avance/avance.page').then((m) => m.AvancePage)),
  privada('recinto', '', inicio),
  privada('recinto', '/mesas', () => import('./pages/recinto/mesas/mesas.page').then((m) => m.MesasPage)),
  privada('recinto', '/veedores', () => import('./pages/recinto/veedores/veedores.page').then((m) => m.VeedoresPage)),
  privada('recinto', '/mesas/:jrvId/:dignidad', acta),
  privada('veedor', '', inicio),
  privada('veedor', '/mesas', () => import('./pages/veedor/mis-mesas/mis-mesas.page').then((m) => m.MisMesasPage)),
  privada('veedor', '/mesas/:jrvId/:dignidad', acta),
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
