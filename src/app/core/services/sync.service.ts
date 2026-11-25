import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, EMPTY, switchMap, timer } from 'rxjs';

import { ActasRepo } from '../data/actas.repo';
import { AuthRepo } from '../data/auth.repo';
import { LocalRepo } from '../data/local.repo';
import type { BorradorActa, Dignidad, RegistroCola } from '../models';
import { ErrorApp } from '../models/error-app';

import { AuthService } from './auth.service';
import { RedService } from './red.service';

/** Reintento mientras hay conexión: «conectado» no garantiza internet. */
const REINTENTO_MS = 30000;

/** El servidor respondió y reintentar no cambiaría nada: lo revisa una persona. */
const DEFINITIVOS = new Set(['CONFLICTO', 'NO_AUTORIZADO', 'VOTOS', 'TOTALES', 'FOTO', 'DATOS']);

const codigoDe = (e: unknown) => (e instanceof ErrorApp ? e.codigo : 'INTERNO');

/** Envía la cola al recuperar la red (R10, ADR-006). */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly actas = inject(ActasRepo);
  private readonly authRepo = inject(AuthRepo);
  private readonly local = inject(LocalRepo);
  private readonly auth = inject(AuthService);
  private readonly red = inject(RedService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _registros = signal<RegistroCola[]>([]);
  private readonly _enviando = signal(false);
  private readonly _enviadas = signal(0);
  private enCurso: Promise<void> | null = null;

  readonly registros = this._registros.asReadonly();
  readonly pendientes = computed(() => this._registros().filter((r) => r.estado === 'pendiente'));
  readonly conflictos = computed(() => this._registros().filter((r) => r.estado === 'conflicto'));
  readonly enviando = this._enviando.asReadonly();
  /** Cuántas se enviaron desde que abrió la app; cambia cuando hay datos nuevos en el servidor. */
  readonly enviadas = this._enviadas.asReadonly();

  iniciar(): void {
    this.red.enLinea$
      .pipe(
        distinctUntilChanged(),
        switchMap((si) => (si ? timer(0, REINTENTO_MS) : EMPTY)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => void this.sincronizar().catch(() => undefined));
  }

  /** Las llamadas simultáneas comparten el mismo envío. */
  sincronizar(): Promise<void> {
    this.enCurso ??= this.enviarCola().finally(() => (this.enCurso = null));
    return this.enCurso;
  }

  async refrescar(): Promise<void> {
    const id = this.auth.perfil()?.id;
    const registros = id ? await this.local.pendientes(id) : [];
    if (id === this.auth.perfil()?.id) this._registros.set(registros);
  }

  async encolar(b: BorradorActa, mesa: number): Promise<void> {
    const perfil = this.auth.perfil();
    if (!perfil) throw new ErrorApp('SESION');
    await this.local.encolar(perfil.id, mesa, b);
    await this.refrescar();
  }

  espera(jrvId: string, dignidad: Dignidad): boolean {
    return this.pendientes().some(({ borrador: b }) => b.jrvId === jrvId && b.dignidad === dignidad);
  }

  async descartar(operacionId: string): Promise<void> {
    await this.local.descartar(operacionId);
    await this.refrescar();
  }

  private async enviarCola(): Promise<void> {
    await this.refrescar();
    const perfil = this.auth.perfil();
    if (!perfil || perfil.debeCambiarClave || !this.red.enLinea() || !this.pendientes().length) return;
    this._enviando.set(true);
    try {
      // Con una sesión vencida el servidor respondería «sin permiso» y parecería un conflicto.
      if ((await this.authRepo.perfil()).id !== perfil.id) return;
      for (const registro of this.pendientes()) {
        if (this.auth.perfil()?.id !== perfil.id) return;
        if (!(await this.enviar(registro))) return;
      }
    } catch {
      // Sin red o sin sesión: todo sigue pendiente hasta el próximo intento.
    } finally {
      this._enviando.set(false);
      await this.refrescar();
    }
  }

  /** `false`: no tiene sentido seguir con el resto por ahora. */
  private async enviar({ operacionId, borrador }: RegistroCola): Promise<boolean> {
    try {
      const foto = await this.local.foto(operacionId);
      if (!foto && !borrador.fotoPath) throw new ErrorApp('FOTO');
      await this.actas.guardar({ ...borrador, foto });
    } catch (e) {
      const codigo = codigoDe(e);
      if (DEFINITIVOS.has(codigo)) await this.local.marcar(operacionId, 'conflicto', codigo);
      return codigo !== 'RED' && codigo !== 'SESION';
    }
    await this.local.marcar(operacionId, 'sincronizado');
    this._enviadas.update((n) => n + 1);
    return true;
  }
}
