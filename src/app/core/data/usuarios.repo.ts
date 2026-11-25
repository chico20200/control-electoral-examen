import { inject, Injectable } from '@angular/core';

import type { DatosUsuario, Perfil } from '../models';

import { COLUMNAS_PERFIL, errorDe, invocar, SUPABASE } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class UsuariosRepo {
  private readonly supabase = inject(SUPABASE);

  async veedores(): Promise<Perfil[]> {
    const { data, error, status } = await this.supabase
      .from('perfiles')
      .select(COLUMNAS_PERFIL)
      .eq('rol', 'veedor')
      .order('apellidos')
      .returns<Perfil[]>();
    if (error) throw errorDe(status, error.message);
    return data;
  }

  async crear(datos: DatosUsuario, recintoId?: string): Promise<void> {
    await invocar(this.supabase, 'crear-usuario', { ...datos, recintoId });
  }
}
