import { inject, Injectable } from '@angular/core';

import type { ActaGps, AvanceRecinto, FilaResultado } from '../models';

import { errorDe, SUPABASE } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class ResultadosRepo {
  private readonly supabase = inject(SUPABASE);

  async resultados(): Promise<FilaResultado[]> {
    const { data, error, status } = await this.supabase
      .from('v_resultados')
      .select('recintoId:recinto_id, dignidad, candidaturaId:candidatura_id, candidato, organizacion, votos')
      .returns<FilaResultado[]>();
    if (error) throw errorDe(status, error.message);
    return data;
  }

  async avance(): Promise<AvanceRecinto[]> {
    const { data, error, status } = await this.supabase
      .from('v_avance')
      .select('recintoId:recinto_id, recinto, registradas:actas_registradas, esperadas:actas_esperadas')
      .order('recinto')
      .returns<AvanceRecinto[]>();
    if (error) throw errorDe(status, error.message);
    return data;
  }

  async actasGps(): Promise<ActaGps[]> {
    const { data, error, status } = await this.supabase
      .from('actas')
      .select('id, dignidad, lat, lng, precisionM:precision_m, jrvs(numero, recintos(nombre))')
      .order('actualizada_en', { ascending: false })
      .returns<(Omit<ActaGps, 'jrv' | 'recinto'> & { jrvs: { numero: number; recintos: { nombre: string } } })[]>();
    if (error) throw errorDe(status, error.message);
    return data.map(({ jrvs, ...acta }) => ({ ...acta, jrv: jrvs.numero, recinto: jrvs.recintos.nombre }));
  }
}
