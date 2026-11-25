import { inject, Injectable, signal } from '@angular/core';

import { UsuariosRepo } from '../data/usuarios.repo';
import type { DatosUsuario, Perfil } from '../models';

import { Recurso } from './recurso';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly repo = inject(UsuariosRepo);
  private readonly _veedores = new Recurso<Perfil[]>();
  private readonly _guardando = signal(false);

  readonly veedores = this._veedores.estado;
  readonly guardando = this._guardando.asReadonly();

  cargarVeedores(): Promise<void> {
    return this._veedores.cargar(() => this.repo.veedores());
  }

  /** El rol lo decide el servidor según quién llama. */
  async crear(datos: DatosUsuario, recintoId?: string): Promise<void> {
    this._guardando.set(true);
    try {
      await this.repo.crear(datos, recintoId);
    } finally {
      this._guardando.set(false);
    }
  }
}
