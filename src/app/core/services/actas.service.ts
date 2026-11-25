import { inject, Injectable, signal } from '@angular/core';

import { ActasRepo } from '../data/actas.repo';
import { BorradoresRepo } from '../data/borradores.repo';
import { RecintosRepo } from '../data/recintos.repo';
import type { ActaAbierta, BorradorActa, Dignidad, Estado, MesaEstado, ValoresActa } from '../models';

import { mensajeDe } from './mensajes';
import { Recurso } from './recurso';

export type ResultadoGuardado = 'enviada' | 'pendiente';

@Injectable({ providedIn: 'root' })
export class ActasService {
  private readonly repo = inject(ActasRepo);
  private readonly borradores = inject(BorradoresRepo);
  private readonly recintos = inject(RecintosRepo);
  private readonly _mesas = new Recurso<MesaEstado[]>();
  private readonly _abierta = new Recurso<ActaAbierta>();
  private readonly _guardado = signal<Estado<ResultadoGuardado>>({ fase: 'inicial', datos: null, error: null });

  readonly misMesas = this._mesas.estado;
  readonly abierta = this._abierta.estado;
  readonly estadoGuardado = this._guardado.asReadonly();

  /** La RLS entrega al veedor solo sus mesas. */
  cargarMisMesas(): Promise<void> {
    return this._mesas.cargar(() => this.recintos.mesas());
  }

  abrir(jrvId: string, dignidad: Dignidad): Promise<void> {
    this._guardado.set({ fase: 'inicial', datos: null, error: null });
    return this._abierta.cargar(async () => {
      const [mesa, candidaturas, acta] = await Promise.all([
        this.repo.mesa(jrvId),
        this.repo.candidaturas(dignidad),
        this.repo.obtener(jrvId, dignidad),
      ]);
      // Sin vista previa de la foto igual se puede corregir.
      const fotoUrl = acta ? await this.repo.urlFoto(acta.fotoPath).catch(() => null) : null;
      const borrador = this.borradores.leer(jrvId, dignidad);
      const vigente = borrador?.version === (acta?.version ?? 0);
      return { mesa, dignidad, candidaturas, acta, fotoUrl, valores: vigente ? borrador.valores : null };
    });
  }

  recordar({ mesa, dignidad, acta }: ActaAbierta, valores: ValoresActa): void {
    this.borradores.guardar(mesa.id, dignidad, { version: acta?.version ?? 0, valores });
  }

  async guardar(b: BorradorActa): Promise<ResultadoGuardado> {
    this._guardado.set({ fase: 'cargando', datos: null, error: null });
    try {
      await this.repo.guardar(b);
      this.borradores.borrar(b.jrvId, b.dignidad);
      this._guardado.set({ fase: 'exito', datos: 'enviada', error: null });
      return 'enviada';
    } catch (e) {
      this._guardado.set({ fase: 'error', datos: null, error: mensajeDe(e) });
      throw e;
    }
  }
}
