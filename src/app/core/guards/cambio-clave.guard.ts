import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const cambioClaveGuard: CanActivateFn = () =>
  inject(AuthService).perfil()?.debeCambiarClave ? inject(Router).parseUrl('/cambiar-clave') : true;
