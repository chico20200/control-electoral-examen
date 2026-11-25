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

/** Fotografía ya procesada, con su nitidez medida (R7). */
export interface FotoActa {
  blob: Blob;
  vistaPrevia: string;
  nitidez: number;
  aceptable: boolean;
}

export interface Ubicacion {
  lat: number;
  lng: number;
  precisionM: number;
}

/** Acta lista para enviar. `operacionId` identifica el envío y permite reintentarlo sin duplicar. */
export type BorradorActa = Omit<Acta, 'id' | 'fotoPath' | 'version'> & {
  operacionId: string;
  recintoId: string;
  versionBase: number;
  foto: Blob | null;
  fotoPath: string | null;
};

/** Lo escrito en el formulario; texto, porque puede estar incompleto. */
export interface ValoresActa {
  votos: Record<string, string>;
  blancos: string;
  nulos: string;
  totalSufragantes: string;
}

/** Todo lo necesario para registrar o corregir un acta. */
export interface ActaAbierta {
  mesa: Jrv;
  dignidad: Dignidad;
  candidaturas: Candidatura[];
  acta: Acta | null;
  fotoUrl: string | null;
  valores: ValoresActa | null;
}

/** Estado explícito de una vista (R9). */
export interface Estado<T> {
  fase: 'inicial' | 'cargando' | 'exito' | 'error';
  datos: T | null;
  error: string | null;
}
