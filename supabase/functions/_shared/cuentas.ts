import { createClient } from 'npm:@supabase/supabase-js@2';
import { Fallo } from './respuesta.ts';

export const CLAVE_INICIAL = 'Ecuador2026';

const url = Deno.env.get('SUPABASE_URL')!;
const opciones = { auth: { persistSession: false, autoRefreshToken: false } };

/** Clave de servicio: existe solo en el servidor (R3). */
export const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, opciones);

/** Cliente nuevo por petición: nunca se comparte una sesión entre usuarios. */
export const anonimo = () => createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, opciones);

export async function correoDe(cedula: unknown): Promise<string | null> {
  if (typeof cedula !== 'string' || !/^\d{10}$/.test(cedula)) throw new Fallo(400, 'DATOS');
  const { data, error } = await admin.from('perfiles').select('correo').eq('cedula', cedula).maybeSingle();
  if (error) throw error;
  return data?.correo ?? null;
}

export async function iniciar(correo: string, clave: string) {
  const { data, error } = await anonimo().auth.signInWithPassword({ email: correo, password: clave });
  if (error?.code === 'email_not_confirmed') throw new Fallo(403, 'SIN_CONFIRMAR');
  if (error?.code === 'invalid_credentials') throw new Fallo(401, 'CREDENCIALES');
  if (error?.status === 429) throw new Fallo(429, 'DEMASIADOS_INTENTOS');
  if (error) throw error;
  return { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
}

export async function usuarioDe(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Fallo(401, 'SESION');
  return { id: data.user.id, correo: data.user.email!, token };
}

export function validarClaveNueva(nueva: unknown): string {
  if (typeof nueva !== 'string' || nueva.length < 8 || nueva === CLAVE_INICIAL) throw new Fallo(400, 'CLAVE_DEBIL');
  return nueva;
}

/** Cambia la clave, levanta el bloqueo, cierra las demás sesiones y abre una nueva. */
export async function fijarClave(id: string, correo: string, token: string, nueva: string) {
  const cambio = await admin.auth.admin.updateUserById(id, { password: nueva });
  if (cambio.error) {
    if (cambio.error.code === 'weak_password') throw new Fallo(400, 'CLAVE_DEBIL');
    throw cambio.error;
  }
  const perfil = await admin.from('perfiles').update({ debe_cambiar_clave: false }).eq('id', id);
  if (perfil.error) throw perfil.error;
  const cierre = await admin.auth.admin.signOut(token, 'global');
  if (cierre.error) console.error('cierre de sesiones', cierre.error);
  return iniciar(correo, nueva);
}
