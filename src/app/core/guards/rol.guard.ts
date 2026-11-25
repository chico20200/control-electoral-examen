import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import type { Rol } from '../models';
import { AuthService } from '../services/auth.service';

import { rutaInicial } from './ruta-inicial';

/** Solo orienta la navegación: los datos los protege la RLS. */
export const rolGuard =
  (rol: Rol): CanActivateFn =>
  () => {
    const perfil = inject(AuthService).perfil();
    return perfil?.rol === rol ? true : inject(Router).parseUrl(rutaInicial(perfil));
  };
