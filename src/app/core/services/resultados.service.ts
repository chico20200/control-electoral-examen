import { computed, inject, Injectable, signal } from '@angular/core';

import { ResultadosRepo } from '../data/resultados.repo';
import type { ActaGps, AvanceRecinto, Estado, FilaResultado, FiltroResultados, Resultado } from '../models';

import { Recurso } from './recurso';

/** Resultados y avance para el coordinador provincial (R4). */
@Injectable({ providedIn: 'root' })
export class ResultadosService {
  private readonly repo = inject(ResultadosRepo);
  private readonly _filas = new Recurso<FilaResultado[]>();
  private readonly _avance = new Recurso<AvanceRecinto[]>();
  private readonly _actasGps = new Recurso<ActaGps[]>();

  readonly filtro = signal<FiltroResultados>({ dignidad: 'alcalde', recintoId: null });
  readonly avance = this._avance.estado;
  readonly actasGps = this._actasGps.estado;

  readonly resultados = computed<Estado<Resultado[]>>(() => {
    const { fase, datos, error } = this._filas.estado();
    return { fase, error, datos: datos && sumar(datos, this.filtro()) };
  });

  readonly totalVotos = computed(() => this.resultados().datos?.reduce((suma, r) => suma + r.votos, 0) ?? 0);

  async cargar(): Promise<void> {
    await Promise.all([
      this._filas.cargar(() => this.repo.resultados()),
      this._avance.cargar(() => this.repo.avance()),
      this._actasGps.cargar(() => this.repo.actasGps()),
    ]);
  }
}

function sumar(filas: FilaResultado[], { dignidad, recintoId }: FiltroResultados): Resultado[] {
  const porCandidatura = new Map<string, Resultado>();
  let total = 0;
  for (const f of filas) {
    if (f.dignidad !== dignidad || (recintoId && f.recintoId !== recintoId)) continue;
    const { candidaturaId, candidato, organizacion } = f;
    const votos = (porCandidatura.get(candidaturaId)?.votos ?? 0) + f.votos;
    porCandidatura.set(candidaturaId, { candidaturaId, candidato, organizacion, votos, porcentaje: 0 });
    total += f.votos;
  }
  return [...porCandidatura.values()]
    .map((r) => ({ ...r, porcentaje: total ? (r.votos * 100) / total : 0 }))
    .sort((a, b) => b.votos - a.votos || a.candidato.localeCompare(b.candidato));
}
