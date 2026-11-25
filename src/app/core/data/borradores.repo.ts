import { inject, Injectable } from '@angular/core';

import type { Dignidad, ValoresActa } from '../models';

import { AuthRepo } from './auth.repo';

interface Guardado {
  version: number;
  valores: ValoresActa;
}

/**
 * Votos a medio escribir. Android puede cerrar la app mientras la cámara está abierta;
 * así no se pierde lo digitado. Cada usuario tiene los suyos.
 */
@Injectable({ providedIn: 'root' })
export class BorradoresRepo {
  private readonly auth = inject(AuthRepo);

  leer(jrvId: string, dignidad: Dignidad): Guardado | null {
    try {
      return JSON.parse(localStorage.getItem(this.clave(jrvId, dignidad)) ?? 'null');
    } catch {
      return null;
    }
  }

  guardar(jrvId: string, dignidad: Dignidad, borrador: Guardado): void {
    localStorage.setItem(this.clave(jrvId, dignidad), JSON.stringify(borrador));
  }

  borrar(jrvId: string, dignidad: Dignidad): void {
    localStorage.removeItem(this.clave(jrvId, dignidad));
  }

  private clave(jrvId: string, dignidad: Dignidad): string {
    return `borrador/${this.auth.perfilGuardado()?.id}/${jrvId}/${dignidad}`;
  }
}
