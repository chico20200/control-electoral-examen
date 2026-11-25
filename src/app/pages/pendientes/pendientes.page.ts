import { Component, computed, inject } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
  type ViewWillEnter,
} from '@ionic/angular';

import type { EstadoCola, RegistroCola } from '../../core/models';
import { ErrorApp } from '../../core/models/error-app';
import { AuthService } from '../../core/services/auth.service';
import { mensajeDe } from '../../core/services/mensajes';
import { NotificacionService } from '../../core/services/notificacion.service';
import { RedService } from '../../core/services/red.service';
import { SyncService } from '../../core/services/sync.service';

const ETIQUETAS: Record<EstadoCola, { texto: string; color: string }> = {
  pendiente: { texto: 'Pendiente', color: 'warning' },
  sincronizado: { texto: 'Sincronizada', color: 'success' },
  conflicto: { texto: 'En conflicto', color: 'danger' },
};

/** Actas guardadas en el teléfono y su estado de envío (R10). */
@Component({
  selector: 'app-pendientes',
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonTitle,
    IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"
          ><ion-back-button [defaultHref]="volverA()" text="Volver"></ion-back-button
        ></ion-buttons>
        <ion-title>Actas por enviar</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>{{ enLinea() ? 'Con conexión.' : 'Sin conexión: se enviarán solas al recuperarla.' }}</p>
      <ion-button
        expand="block"
        [disabled]="!enLinea() || sync.enviando() || !sync.pendientes().length"
        (click)="enviar()"
        >{{ sync.enviando() ? 'Enviando…' : 'Enviar ahora' }}</ion-button
      >
      <ion-list>
        @for (r of sync.registros(); track r.operacionId) {
          <ion-item>
            <ion-label class="ion-text-wrap">
              <h2>Mesa {{ r.mesa }} · {{ r.borrador.dignidad === 'alcalde' ? 'Alcalde' : 'Prefecto' }}</h2>
              <p>Total: {{ r.borrador.totalSufragantes }} · {{ fecha(r) }}</p>
              @if (r.estado === 'conflicto') {
                <p>{{ motivo(r) }} No se cambió nada en el servidor.</p>
              }
              @if (r.estado !== 'sincronizado') {
                <ion-button fill="outline" color="danger" [disabled]="sync.enviando()" (click)="descartar(r)"
                  >Descartar</ion-button
                >
              }
            </ion-label>
            <ion-note slot="end" [color]="etiquetas[r.estado].color">{{ etiquetas[r.estado].texto }}</ion-note>
          </ion-item>
        } @empty {
          <p class="ion-text-center">No hay actas guardadas en este teléfono.</p>
        }
      </ion-list>
    </ion-content>
  `,
})
export class PendientesPage implements ViewWillEnter {
  protected readonly sync = inject(SyncService);
  protected readonly enLinea = inject(RedService).enLinea;
  private readonly auth = inject(AuthService);
  private readonly notificacion = inject(NotificacionService);

  protected readonly etiquetas = ETIQUETAS;
  protected readonly volverA = computed(() => `/${this.auth.perfil()?.rol ?? 'veedor'}`);

  ionViewWillEnter(): void {
    void this.sync.refrescar().catch((e) => this.notificacion.error(e));
  }

  protected fecha(r: RegistroCola): string {
    return new Date(r.borrador.capturadaEn).toLocaleString('es-EC');
  }

  protected motivo(r: RegistroCola): string {
    return mensajeDe(new ErrorApp(r.motivo ?? ''));
  }

  async enviar(): Promise<void> {
    try {
      await this.sync.sincronizar();
    } catch (e) {
      await this.notificacion.error(e);
    }
  }

  async descartar(r: RegistroCola): Promise<void> {
    if (!(await this.notificacion.confirmar('Se borrará del teléfono con su foto. ¿Descartar el acta?'))) return;
    try {
      await this.sync.descartar(r.operacionId);
    } catch (e) {
      await this.notificacion.error(e);
    }
  }
}
