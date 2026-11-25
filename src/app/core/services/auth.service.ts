import { computed, inject, Injectable, signal } from '@angular/core';

import { AuthRepo } from '../data/auth.repo';
import type { Estado, Perfil } from '../models';
import { ErrorApp } from '../models/error-app';

import { mensajeDe } from './mensajes';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly repo = inject(AuthRepo);
  private readonly _estado = signal<Estado<Perfil>>({ fase: 'inicial', datos: null, error: null });

  readonly estado = this._estado.asReadonly();
  readonly perfil = computed(() => this._estado().datos);

  /** Abre con el perfil guardado, sin esperar a la red, y lo comprueba en segundo plano. */
  async restaurar(): Promise<void> {
    const guardado = this.repo.perfilGuardado();
    if (!guardado) return;
    this.fijar(guardado);
    void this.comprobar(guardado);
  }

  login(cedula: string, clave: string): Promise<void> {
    return this.ejecutar(async () => {
      await this.repo.login(cedula, clave);
      return this.repo.perfil();
    });
  }

  cambiarClave(nueva: string): Promise<void> {
    return this.ejecutar(async () => {
      await this.repo.cambiarClave(nueva);
      return this.repo.perfil();
    });
  }

  solicitarCodigo(cedula: string): Promise<void> {
    return this.ejecutar(async () => {
      await this.repo.solicitarCodigo(cedula);
      return this.perfil();
    });
  }

  recuperar(cedula: string, codigo: string, nueva: string): Promise<void> {
    return this.ejecutar(async () => {
      await this.repo.recuperar(cedula, codigo, nueva);
      return this.repo.perfil();
    });
  }

  async salir(): Promise<void> {
    // En el teléfono la sesión se cierra siempre, haya red o no.
    await this.repo.salir().catch(() => undefined);
    this.repo.guardarPerfil(null);
    this._estado.set({ fase: 'inicial', datos: null, error: null });
  }

  private async comprobar(guardado: Perfil): Promise<void> {
    try {
      const actual = await this.repo.perfil();
      // Si mientras tanto salió o entró otro usuario, la respuesta ya no aplica.
      if (this.perfil() === guardado) this.fijar(actual);
    } catch (e) {
      const invalida = e instanceof ErrorApp && e.codigo === 'SESION';
      if (invalida && this.perfil() === guardado) await this.salir();
    }
  }

  private async ejecutar(accion: () => Promise<Perfil | null>): Promise<void> {
    this._estado.update((e) => ({ ...e, fase: 'cargando', error: null }));
    try {
      this.fijar(await accion());
    } catch (e) {
      this._estado.update((s) => ({ ...s, fase: 'error', error: mensajeDe(e) }));
      throw e;
    }
  }

  private fijar(perfil: Perfil | null): void {
    this.repo.guardarPerfil(perfil);
    this._estado.set({ fase: 'exito', datos: perfil, error: null });
  }
}
