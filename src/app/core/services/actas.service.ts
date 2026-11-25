import { inject, Injectable, signal } from '@angular/core';

import { ActasRepo } from '../data/actas.repo';
import { BorradoresRepo } from '../data/borradores.repo';
import { LocalRepo } from '../data/local.repo';
import { RecintosRepo } from '../data/recintos.repo';
import type {
  Acta,
  ActaAbierta,
  BorradorActa,
  Candidatura,
  Dignidad,
  Estado,
  Jrv,
  MesaEstado,
  ValoresActa,
} from '../models';
import { ErrorApp } from '../models/error-app';

import { AuthService } from './auth.service';
import { mensajeDe } from './mensajes';
import { Recurso } from './recurso';
import { RedService } from './red.service';
import { SyncService } from './sync.service';

const DIGNIDADES: Dignidad[] = ['alcalde', 'prefecto'];

const sinRed = (e: unknown) => e instanceof ErrorApp && e.codigo === 'RED';

export type ResultadoGuardado = 'enviada' | 'pendiente';

@Injectable({ providedIn: 'root' })
export class ActasService {
  private readonly repo = inject(ActasRepo);
  private readonly borradores = inject(BorradoresRepo);
  private readonly recintos = inject(RecintosRepo);
  private readonly local = inject(LocalRepo);
  private readonly sync = inject(SyncService);
  private readonly red = inject(RedService);
  private readonly auth = inject(AuthService);
  private readonly _mesas = new Recurso<MesaEstado[]>();
  private readonly _abierta = new Recurso<ActaAbierta>();
  private readonly _guardado = signal<Estado<ResultadoGuardado>>({ fase: 'inicial', datos: null, error: null });

  readonly misMesas = this._mesas.estado;
  readonly abierta = this._abierta.estado;
  readonly estadoGuardado = this._guardado.asReadonly();

  /** La RLS entrega al veedor solo sus mesas. */
  cargarMisMesas(): Promise<void> {
    return this._mesas.cargar(async () => {
      await this.sync.refrescar().catch(() => undefined);
      let deLaRed = false;
      const mesas = await this.conCopia('mesas', async () => {
        const leidas = await this.recintos.mesas();
        deLaRed = true;
        return leidas;
      });
      if (deLaRed) void this.precargar(mesas);
      return mesas;
    });
  }

  abrir(jrvId: string, dignidad: Dignidad): Promise<void> {
    this._guardado.set({ fase: 'inicial', datos: null, error: null });
    return this._abierta.cargar(async () => {
      await this.sync.refrescar().catch(() => undefined);
      if (this.sync.espera(jrvId, dignidad)) throw new ErrorApp('PENDIENTE_ENVIO');
      const { mesa, candidaturas, acta } = await this.leerActa(jrvId, dignidad);
      // Sin vista previa de la foto igual se puede corregir.
      const conFoto = acta && this.red.enLinea();
      const fotoUrl = conFoto ? await this.repo.urlFoto(acta.fotoPath).catch(() => null) : null;
      const borrador = this.borradores.leer(jrvId, dignidad);
      const vigente = borrador?.version === (acta?.version ?? 0);
      return { mesa, dignidad, candidaturas, acta, fotoUrl, valores: vigente ? borrador.valores : null };
    });
  }

  recordar({ mesa, dignidad, acta }: ActaAbierta, valores: ValoresActa): void {
    this.borradores.guardar(mesa.id, dignidad, { version: acta?.version ?? 0, valores });
  }

  async guardar(b: BorradorActa): Promise<ResultadoGuardado> {
    this._guardado.set({ fase: 'cargando', datos: null, error: null });
    try {
      const resultado = await this.enviarOEncolar(b);
      this.borradores.borrar(b.jrvId, b.dignidad);
      this._guardado.set({ fase: 'exito', datos: resultado, error: null });
      return resultado;
    } catch (e) {
      this._guardado.set({ fase: 'error', datos: null, error: mensajeDe(e) });
      throw e;
    }
  }

  /** Sin red el acta queda en el teléfono; conserva su `operacionId`, así que reintentarla no duplica. */
  private async enviarOEncolar(b: BorradorActa): Promise<ResultadoGuardado> {
    if (this.red.enLinea()) {
      try {
        await this.repo.guardar(b);
        return 'enviada';
      } catch (e) {
        if (!sinRed(e)) throw e;
      }
    }
    await this.sync.encolar(b, this.abierta().datos?.mesa.numero ?? 0);
    return 'pendiente';
  }

  private async leerActa(
    jrvId: string,
    dignidad: Dignidad,
  ): Promise<{ mesa: Jrv; candidaturas: Candidatura[]; acta: Acta | null }> {
    if (this.red.enLinea()) {
      try {
        const [mesa, candidaturas, acta] = await Promise.all([
          this.repo.mesa(jrvId),
          this.repo.candidaturas(dignidad),
          this.repo.obtener(jrvId, dignidad),
        ]);
        return { mesa, candidaturas, acta };
      } catch (e) {
        if (!sinRed(e)) throw e;
      }
    }
    const [mesas, candidaturas, acta] = await Promise.all([
      this.leerCopia<MesaEstado[]>('mesas'),
      this.leerCopia<Candidatura[]>(`candidaturas/${dignidad}`),
      this.leerCopia<Acta>(`acta/${jrvId}/${dignidad}`),
    ]);
    const mesa = mesas?.find((m) => m.id === jrvId);
    // Un acta registrada sin copia no se puede corregir: no se conoce su versión.
    if (!mesa || !candidaturas || (mesa[dignidad] && !acta)) throw new ErrorApp('RED');
    return { mesa, candidaturas, acta: mesa[dignidad] ? acta : null };
  }

  /** Lee del servidor y guarda una copia; sin red usa la última copia. */
  private async conCopia<T>(clave: string, leer: () => Promise<T>): Promise<T> {
    if (this.red.enLinea()) {
      try {
        const datos = await leer();
        await this.guardarCopia(clave, datos);
        return datos;
      } catch (e) {
        if (!sinRed(e)) throw e;
      }
    }
    const copia = await this.leerCopia<T>(clave);
    if (copia === null) throw new ErrorApp('RED');
    return copia;
  }

  /** Deja listo lo necesario para registrar o corregir sin conexión. */
  private async precargar(mesas: MesaEstado[]): Promise<void> {
    const tareas = DIGNIDADES.flatMap((d) => [
      this.copiar(`candidaturas/${d}`, () => this.repo.candidaturas(d)),
      ...mesas.filter((m) => m[d]).map((m) => this.copiar(`acta/${m.id}/${d}`, () => this.repo.obtener(m.id, d))),
    ]);
    await Promise.allSettled(tareas);
  }

  private async copiar(clave: string, leer: () => Promise<unknown>): Promise<void> {
    const usuario = this.auth.perfil()?.id;
    const datos = await leer();
    if (usuario === this.auth.perfil()?.id) await this.guardarCopia(clave, datos);
  }

  // Cada usuario tiene su copia. Que falle no impide trabajar con red.
  private async guardarCopia(clave: string, datos: unknown): Promise<void> {
    await this.local.guardarCache(`${this.auth.perfil()?.id}/${clave}`, datos).catch(() => undefined);
  }

  private async leerCopia<T>(clave: string): Promise<T | null> {
    return this.local.leerCache<T>(`${this.auth.perfil()?.id}/${clave}`);
  }
}
