import { InjectionToken } from '@angular/core';
import { createClient, FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';
import { ErrorApp } from '../models/error-app';

/** Único cliente de Supabase. Solo lo usan los repositorios (ADR-002). */
export const SUPABASE = new InjectionToken<SupabaseClient>('SUPABASE', {
  providedIn: 'root',
  factory: () =>
    createClient(environment.supabaseUrl, environment.supabaseClave, { auth: { detectSessionInUrl: false } }),
});

/** Llama a una Edge Function y convierte sus fallos en `ErrorApp`. */
export async function invocar<T>(supabase: SupabaseClient, nombre: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(nombre, { body });
  if (!error) return data as T;
  if (!(error instanceof FunctionsHttpError)) throw new ErrorApp('RED');
  const respuesta = await error.context.json().catch(() => null);
  throw new ErrorApp(respuesta?.error ?? 'INTERNO');
}

/** Error de PostgREST o Storage: sin estado HTTP significa que no hubo respuesta. */
export function errorDe(estado: number, mensaje = ''): ErrorApp {
  if (!estado) return new ErrorApp('RED');
  if (estado === 401) return new ErrorApp('SESION');
  if (estado === 403) return new ErrorApp('NO_AUTORIZADO');
  return new ErrorApp(/^[A-Z_]+$/.test(mensaje) ? mensaje : 'INTERNO');
}
