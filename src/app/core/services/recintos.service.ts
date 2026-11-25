import { inject, Injectable, signal } from '@angular/core';

import { RecintosRepo } from '../data/recintos.repo';
import type { MesaEstado, Recinto, RecintoResumen } from '../models';

import { Recurso } from './recurso';

@Injectable({ providedIn: 'root' })
export class RecintosService {
  private readonly repo = inject(RecintosRepo);
  private readonly _recintos = new Recurso<RecintoResumen[]>();
  private readonly _mesas = new Recurso<MesaEstado[]>();
  private readonly _guardando = signal(false);

  readonly recintos = this._recintos.estado;
  readonly mesas = this._mesas.estado;
  readonly guardando = this._guardando.asReadonly();

  cargar(): Promise<void> {
    return this._recintos.cargar(() => this.repo.listar());
  }

  cargarMesas(): Promise<void> {
    return this._mesas.cargar(() => this.repo.mesas());
  }

  async crear(recinto: Omit<Recinto, 'id'>): Promise<void> {
    this._guardando.set(true);
    try {
      await this.repo.crear(recinto);
    } finally {
      this._guardando.set(false);
    }
    await this.cargar();
  }

  /** Recarga también si falla, para mostrar lo que hay en el servidor. */
  async asignarVeedor(jrvId: string, veedorId: string | null): Promise<void> {
    try {
      await this.repo.asignarVeedor(jrvId, veedorId);
    } finally {
      await this.cargarMesas();
    }
  }
}
