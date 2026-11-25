import { signal } from '@angular/core';

import type { Estado } from '../models';

import { mensajeDe } from './mensajes';

/**
 * Datos remotos con estado explícito (R9). Cada carga descarta los datos anteriores,
 * para no mostrar los de otro usuario, y solo cuenta la respuesta de la última.
 */
export class Recurso<T> {
  private readonly _estado = signal<Estado<T>>({ fase: 'inicial', datos: null, error: null });
  private turno = 0;

  readonly estado = this._estado.asReadonly();

  async cargar(leer: () => Promise<T>): Promise<void> {
    const turno = ++this.turno;
    this._estado.set({ fase: 'cargando', datos: null, error: null });
    let resultado: Estado<T>;
    try {
      resultado = { fase: 'exito', datos: await leer(), error: null };
    } catch (e) {
      resultado = { fase: 'error', datos: null, error: mensajeDe(e) };
    }
    if (turno === this.turno) this._estado.set(resultado);
  }
}
