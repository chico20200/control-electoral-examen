import type { Perfil } from '../models';

/** Pantalla que corresponde a cada usuario. */
export const rutaInicial = (perfil: Perfil | null): string =>
  !perfil ? '/login' : perfil.debeCambiarClave ? '/cambiar-clave' : `/${perfil.rol}`;
