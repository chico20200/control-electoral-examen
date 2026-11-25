import { InjectionToken } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

/** Lo mínimo de SQLite que usa la app. */
export interface BaseLocal {
  execute(sql: string): Promise<unknown>;
  run(sql: string, valores: unknown[]): Promise<unknown>;
  query(sql: string, valores: unknown[]): Promise<{ values?: unknown[] }>;
}

const NOMBRE = 'control';

async function abrir(): Promise<BaseLocal | null> {
  // En el navegador no hay SQLite: la app funciona, pero sin cola offline.
  if (!Capacitor.isNativePlatform()) return null;
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const coherente = (await sqlite.checkConnectionsConsistency()).result;
  const existe = (await sqlite.isConnection(NOMBRE, false)).result;
  const db =
    coherente && existe
      ? await sqlite.retrieveConnection(NOMBRE, false)
      : await sqlite.createConnection(NOMBRE, false, 'no-encryption', 1, false);
  await db.open();
  return {
    execute: (sql) => db.execute(sql),
    run: (sql, valores) => db.run(sql, valores),
    query: (sql, valores) => db.query(sql, valores),
  };
}

export const ABRIR_SQLITE = new InjectionToken<() => Promise<BaseLocal | null>>('ABRIR_SQLITE', {
  providedIn: 'root',
  factory: () => abrir,
});
