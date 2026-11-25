export type Rol = 'provincial' | 'recinto' | 'veedor';
export type Dignidad = 'alcalde' | 'prefecto';

export interface Recinto {
  id: string;
  provincia: string;
  canton: string;
  parroquia: string;
  nombre: string;
  numJrv: number;
}

export interface Perfil {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rol: Rol;
  recintoId: string | null;
  debeCambiarClave: boolean;
}

/** Junta receptora del voto (mesa). */
export interface Jrv {
  id: string;
  recintoId: string;
  numero: number;
  veedorId: string | null;
}

/** Recinto con sus mesas creadas y su coordinador (R4). */
export type RecintoResumen = Recinto & { mesas: number; coordinador: string | null };

/** Mesa con su veedor y las actas ya registradas (R5). */
export type MesaEstado = Jrv & { veedor: string | null; alcalde: boolean; prefecto: boolean };

export type DatosUsuario = Pick<Perfil, 'cedula' | 'nombres' | 'apellidos' | 'telefono' | 'correo'>;

export interface Candidatura {
  id: string;
  organizacion: string;
  dignidad: Dignidad;
  nombre: string;
}

export interface Acta {
  id: string;
  jrvId: string;
  dignidad: Dignidad;
  /** Votos por id de candidatura. */
  votos: Record<string, number>;
  blancos: number;
  nulos: number;
  totalSufragantes: number;
  fotoPath: string;
  lat: number;
  lng: number;
  precisionM: number;
  capturadaEn: string;
  /** Versión del servidor; permite detectar conflictos de edición. */
  version: number;
}

/** Estado explícito de una vista (R9). */
export interface Estado<T> {
  fase: 'inicial' | 'cargando' | 'exito' | 'error';
  datos: T | null;
  error: string | null;
}
