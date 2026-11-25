import { inject, Injectable } from '@angular/core';

import type { Acta, BorradorActa, Candidatura, Dignidad, Jrv } from '../models';
import { ErrorApp } from '../models/error-app';

import { errorDe, SUPABASE } from './supabase.client';

const BUCKET = 'actas';

@Injectable({ providedIn: 'root' })
export class ActasRepo {
  private readonly supabase = inject(SUPABASE);

  async mesa(jrvId: string): Promise<Jrv> {
    const { data, error, status } = await this.supabase
      .from('jrvs')
      .select('id, recintoId:recinto_id, numero, veedorId:veedor_id')
      .eq('id', jrvId)
      .maybeSingle();
    if (error) throw errorDe(status, error.message);
    // La RLS oculta las mesas ajenas: no existir y no tener permiso se ven igual.
    if (!data) throw new ErrorApp('NO_AUTORIZADO');
    return data as Jrv;
  }

  async candidaturas(dignidad: Dignidad): Promise<Candidatura[]> {
    const { data, error, status } = await this.supabase
      .from('candidaturas')
      .select('id, nombre, dignidad, organizaciones(nombre, lista)')
      .eq('dignidad', dignidad)
      .returns<(Omit<Candidatura, 'organizacion'> & { organizaciones: { nombre: string; lista: number } })[]>();
    if (error) throw errorDe(status, error.message);
    return data
      .sort((a, b) => a.organizaciones.lista - b.organizaciones.lista)
      .map(({ organizaciones: o, ...c }) => ({ ...c, organizacion: `${o.lista} · ${o.nombre}` }));
  }

  async obtener(jrvId: string, dignidad: Dignidad): Promise<Acta | null> {
    const { data, error, status } = await this.supabase
      .from('actas')
      .select(
        'id, jrvId:jrv_id, dignidad, blancos, nulos, totalSufragantes:total_sufragantes, fotoPath:foto_path, lat, lng, precisionM:precision_m, capturadaEn:capturada_en, version, votos(candidatura_id, cantidad)',
      )
      .eq('jrv_id', jrvId)
      .eq('dignidad', dignidad)
      .maybeSingle<Omit<Acta, 'votos'> & { votos: { candidatura_id: string; cantidad: number }[] }>();
    if (error) throw errorDe(status, error.message);
    if (!data) return null;
    return { ...data, votos: Object.fromEntries(data.votos.map((v) => [v.candidatura_id, v.cantidad])) };
  }

  /** Enlace temporal (5 min): el bucket es privado. */
  async urlFoto(ruta: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from(BUCKET).createSignedUrl(ruta, 300);
    if (error) throw errorDe(Number((error as { status?: number }).status ?? 0));
    return data.signedUrl;
  }

  /** Primero la foto y luego el acta: un acta nunca queda sin foto. */
  async guardar(b: BorradorActa): Promise<{ id: string; version: number }> {
    const foto = b.foto ? await this.subir(b, b.foto) : b.fotoPath;
    const { data, error, status } = await this.supabase.rpc('guardar_acta', {
      p: {
        jrv_id: b.jrvId,
        dignidad: b.dignidad,
        operacion_id: b.operacionId,
        version_base: b.versionBase,
        votos: b.votos,
        blancos: b.blancos,
        nulos: b.nulos,
        total_sufragantes: b.totalSufragantes,
        foto_path: foto,
        lat: b.lat,
        lng: b.lng,
        precision_m: b.precisionM,
        capturada_en: b.capturadaEn,
      },
    });
    if (error) throw errorDe(status, error.message);
    return data;
  }

  private async subir(b: BorradorActa, foto: Blob): Promise<string> {
    const ruta = `${b.recintoId}/${b.jrvId}/${b.dignidad}/${b.operacionId}.jpg`;
    const { error } = await this.supabase.storage.from(BUCKET).upload(ruta, foto, { contentType: 'image/jpeg' });
    if (error) {
      // Storage informa el código real en `statusCode`; sin él, no hubo respuesta.
      const { statusCode, status } = error as { statusCode?: string; status?: number };
      const estado = Number(statusCode ?? status ?? 0) || (status ?? 0);
      if (estado !== 409) throw errorDe(estado); // 409: ya se subió en un intento anterior
    }
    return ruta;
  }
}
