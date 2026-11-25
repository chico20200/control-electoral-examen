import { inject, Injectable } from '@angular/core';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import type { Perfil } from '../models';
import { ErrorApp } from '../models/error-app';

import { COLUMNAS_PERFIL, errorDe, invocar, SUPABASE } from './supabase.client';

interface Tokens {
  access_token: string;
  refresh_token: string;
}

const CLAVE_PERFIL = 'perfil';

@Injectable({ providedIn: 'root' })
export class AuthRepo {
  private readonly supabase = inject(SUPABASE);

  async login(cedula: string, clave: string): Promise<void> {
    await this.abrir(await invocar<Tokens>(this.supabase, 'login', { cedula, clave }));
  }

  async cambiarClave(nueva: string): Promise<void> {
    await this.abrir(await invocar<Tokens>(this.supabase, 'cambiar-clave', { nueva }));
  }

  async solicitarCodigo(cedula: string): Promise<void> {
    await invocar(this.supabase, 'recuperar-clave', { cedula });
  }

  async recuperar(cedula: string, codigo: string, nueva: string): Promise<void> {
    await this.abrir(await invocar<Tokens>(this.supabase, 'recuperar-clave', { cedula, codigo, nueva }));
  }

  /** Perfil del servidor. `SESION`: ya no es válida; `RED`: no se pudo comprobar. */
  async perfil(): Promise<Perfil> {
    const { data: sesion, error: fallo } = await this.supabase.auth.getSession();
    if (!sesion.session) throw new ErrorApp(fallo && isAuthRetryableFetchError(fallo) ? 'RED' : 'SESION');

    const { data, error, status } = await this.supabase
      .from('perfiles')
      .select(COLUMNAS_PERFIL)
      .eq('id', sesion.session.user.id)
      .maybeSingle();
    if (error) throw errorDe(status, error.message);
    if (!data) throw new ErrorApp('SESION');
    return data as Perfil;
  }

  async salir(): Promise<void> {
    await this.supabase.auth.signOut({ scope: 'local' });
  }

  /** Copia local: permite abrir la app sin red. No autoriza nada; eso lo hace el servidor. */
  perfilGuardado(): Perfil | null {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_PERFIL) ?? 'null');
    } catch {
      return null;
    }
  }

  guardarPerfil(perfil: Perfil | null): void {
    if (perfil) localStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil));
    else localStorage.removeItem(CLAVE_PERFIL);
  }

  private async abrir({ access_token, refresh_token }: Tokens): Promise<void> {
    const { error } = await this.supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw new ErrorApp(isAuthRetryableFetchError(error) ? 'RED' : 'SESION');
  }
}
