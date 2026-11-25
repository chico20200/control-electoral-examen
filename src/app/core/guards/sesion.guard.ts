import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

import { rutaInicial } from './ruta-inicial';

export const sesionGuard: CanActivateFn = () =>
  inject(AuthService).perfil() ? true : inject(Router).parseUrl('/login');

/** Para login y recuperación: quien ya entró va a su pantalla. */
export const invitadoGuard: CanActivateFn = () => {
  const perfil = inject(AuthService).perfil();
  return perfil ? inject(Router).parseUrl(rutaInicial(perfil)) : true;
};
