import { inject, Injectable } from '@angular/core';

import type { BorradorActa, EstadoCola, RegistroCola } from '../models';
import { ErrorApp } from '../models/error-app';

import { ABRIR_SQLITE, type BaseLocal } from './sqlite';

const ESQUEMA = `
create table if not exists cola (
  operacion_id text primary key,
  usuario_id text not null,
  mesa integer not null,
  payload text not null,
  foto_base64 text,
  estado text not null default 'pendiente',
  motivo text,
  capturada_en text not null,
  creada_en integer not null
);
create table if not exists cache (clave text primary key, valor text not null);
`;

interface Fila {
  operacion_id: string;
  mesa: number;
  payload: string;
  estado: EstadoCola;
  motivo: string | null;
}

async function aBase64(foto: Blob): Promise<string> {
  const bytes = new Uint8Array(await foto.arrayBuffer());
  let texto = '';
  for (let i = 0; i < bytes.length; i += 8192) texto += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(texto);
}

const aFoto = (base64: string): Blob =>
  new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: 'image/jpeg' });

/** Cola de actas y copia de lectura en SQLite (ADR-006). */
@Injectable({ providedIn: 'root' })
export class LocalRepo {
  private readonly abrir = inject(ABRIR_SQLITE);
  private base: Promise<BaseLocal | null> | null = null;
  private turno: Promise<unknown> = Promise.resolve();

  async encolar(usuarioId: string, mesa: number, { foto, ...payload }: BorradorActa): Promise<void> {
    const base64 = foto ? await aBase64(foto) : null;
    await this.usar(async (db) => {
      if (!db) throw new ErrorApp('RED'); // sin almacenamiento local no hay cola
      await db.run(
        `insert or ignore into cola (operacion_id, usuario_id, mesa, payload, foto_base64, capturada_en, creada_en)
         values (?, ?, ?, ?, ?, ?, ?)`,
        [payload.operacionId, usuarioId, mesa, JSON.stringify(payload), base64, payload.capturadaEn, Date.now()],
      );
    });
  }

  /** Todos los registros del usuario, sin la foto: pueden ser pesadas. */
  async pendientes(usuarioId: string): Promise<RegistroCola[]> {
    const filas = await this.leer<Fila>(
      'select operacion_id, mesa, payload, estado, motivo from cola where usuario_id = ? order by creada_en, rowid',
      [usuarioId],
    );
    return filas.map((f) => ({
      operacionId: f.operacion_id,
      mesa: f.mesa,
      estado: f.estado,
      motivo: f.motivo,
      borrador: { ...JSON.parse(f.payload), foto: null },
    }));
  }

  async foto(operacionId: string): Promise<Blob | null> {
    const [fila] = await this.leer<{ foto_base64: string | null }>(
      'select foto_base64 from cola where operacion_id = ?',
      [operacionId],
    );
    return fila?.foto_base64 ? aFoto(fila.foto_base64) : null;
  }

  /** Lo ya sincronizado libera la foto; en un conflicto se conserva. */
  async marcar(operacionId: string, estado: 'sincronizado' | 'conflicto', motivo: string | null = null): Promise<void> {
    await this.usar((db) =>
      db?.run(
        `update cola set estado = ?, motivo = ?,
           foto_base64 = case when ? = 'sincronizado' then null else foto_base64 end
         where operacion_id = ?`,
        [estado, motivo, estado, operacionId],
      ),
    );
  }

  async descartar(operacionId: string): Promise<void> {
    await this.usar((db) => db?.run('delete from cola where operacion_id = ?', [operacionId]));
  }

  async guardarCache(clave: string, valor: unknown): Promise<void> {
    await this.usar((db) =>
      db?.run('insert or replace into cache (clave, valor) values (?, ?)', [clave, JSON.stringify(valor)]),
    );
  }

  async leerCache<T>(clave: string): Promise<T | null> {
    const [fila] = await this.leer<{ valor: string }>('select valor from cache where clave = ?', [clave]);
    return fila ? JSON.parse(fila.valor) : null;
  }

  private leer<T>(sql: string, valores: unknown[]): Promise<T[]> {
    return this.usar(async (db) => ((await db?.query(sql, valores))?.values ?? []) as T[]);
  }

  /** Una operación a la vez: el plugin abre una transacción por escritura. */
  private usar<T>(accion: (db: BaseLocal | null) => Promise<T> | undefined): Promise<T> {
    const resultado = this.turno.then(async () => (await accion(await this.conectar())) as T);
    this.turno = resultado.catch(() => undefined);
    return resultado;
  }

  private conectar(): Promise<BaseLocal | null> {
    this.base ??= this.abrir()
      .then(async (db) => {
        await db?.execute(ESQUEMA);
        return db;
      })
      .catch((e: unknown) => {
        this.base = null; // permite reintentar
        throw e;
      });
    return this.base;
  }
}
