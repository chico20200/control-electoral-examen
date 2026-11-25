import { inject, Injectable } from '@angular/core';

import type { MesaEstado, Recinto, RecintoResumen } from '../models';
import { ErrorApp } from '../models/error-app';

import { errorDe, SUPABASE } from './supabase.client';

interface Nombre {
  nombres: string;
  apellidos: string;
}

const nombreDe = (p: Nombre | null | undefined) => (p ? `${p.nombres} ${p.apellidos}` : null);

@Injectable({ providedIn: 'root' })
export class RecintosRepo {
  private readonly supabase = inject(SUPABASE);

  async listar(): Promise<RecintoResumen[]> {
    const { data, error, status } = await this.supabase
      .from('recintos')
      .select(
        'id, provincia, canton, parroquia, nombre, numJrv:num_jrv, jrvs(count), coordinadores:perfiles!perfiles_recinto_id_fkey(nombres, apellidos)',
      )
      .eq('coordinadores.rol', 'recinto')
      .order('nombre')
      .returns<(Recinto & { jrvs: { count: number }[]; coordinadores: Nombre[] })[]>();
    if (error) throw errorDe(status, error.message);
    return data.map(({ jrvs, coordinadores, ...recinto }) => ({
      ...recinto,
      mesas: jrvs[0]?.count ?? 0,
      coordinador: nombreDe(coordinadores[0]),
    }));
  }

  async crear({ provincia, canton, parroquia, nombre, numJrv }: Omit<Recinto, 'id'>): Promise<void> {
    const { error, status } = await this.supabase
      .from('recintos')
      .insert({ provincia, canton, parroquia, nombre, num_jrv: numJrv });
    if (error?.code === '23505') throw new ErrorApp('RECINTO_DUPLICADO');
    if (error?.code === '23514') throw new ErrorApp('DATOS');
    if (error) throw errorDe(status, error.message);
  }

  /** Las mesas que la RLS permite ver: las del recinto o las del veedor. */
  async mesas(): Promise<MesaEstado[]> {
    const { data, error, status } = await this.supabase
      .from('jrvs')
      .select(
        'id, recintoId:recinto_id, numero, veedorId:veedor_id, veedor:perfiles!jrvs_veedor_id_fkey(nombres, apellidos), actas(dignidad, total:total_sufragantes)',
      )
      .order('numero')
      .returns<
        {
          id: string;
          recintoId: string;
          numero: number;
          veedorId: string | null;
          veedor: Nombre | null;
          actas: { dignidad: string; total: number }[];
        }[]
      >();
    if (error) throw errorDe(status, error.message);
    const totalDe = (actas: { dignidad: string; total: number }[], d: string) =>
      actas.find((a) => a.dignidad === d)?.total ?? null;
    return data.map(({ veedor, actas, ...mesa }) => ({
      ...mesa,
      veedor: nombreDe(veedor),
      alcalde: actas.some((a) => a.dignidad === 'alcalde'),
      prefecto: actas.some((a) => a.dignidad === 'prefecto'),
      totales: { alcalde: totalDe(actas, 'alcalde'), prefecto: totalDe(actas, 'prefecto') },
    }));
  }

  async asignarVeedor(jrvId: string, veedorId: string | null): Promise<void> {
    const { error, status } = await this.supabase.rpc('asignar_veedor', { p_jrv: jrvId, p_veedor: veedorId });
    if (error) throw errorDe(status, error.message);
  }
}
