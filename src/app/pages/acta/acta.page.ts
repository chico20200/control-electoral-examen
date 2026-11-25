import { Component, computed, inject, input } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  NavController,
  type ViewWillEnter,
} from '@ionic/angular';

import type { BorradorActa, Dignidad, ValoresActa } from '../../core/models';
import { ActasService } from '../../core/services/actas.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { ActaFormComponent } from '../../shared/components/acta-form/acta-form.component';
import { EstadoVistaComponent } from '../../shared/components/estado-vista/estado-vista.component';

/** La usan el veedor (registrar y corregir) y el coordinador de recinto (corregir). */
@Component({
  selector: 'app-acta',
  imports: [
    ActaFormComponent,
    EstadoVistaComponent,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"
          ><ion-back-button [defaultHref]="volverA()" text="Volver"></ion-back-button
        ></ion-buttons>
        <ion-title>{{ titulo() }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <app-estado-vista [estado]="abierta()" (reintentar)="ionViewWillEnter()" />
      @if (abierta().datos; as datos) {
        <app-acta-form
          [datos]="datos"
          [enviando]="guardado().fase === 'cargando'"
          (cambio)="recordar($event)"
          (guardar)="guardar($event)"
        />
      }
    </ion-content>
  `,
})
export class ActaPage implements ViewWillEnter {
  private readonly servicio = inject(ActasService);
  private readonly auth = inject(AuthService);
  private readonly notificacion = inject(NotificacionService);
  private readonly nav = inject(NavController);

  readonly jrvId = input.required<string>();
  readonly dignidad = input.required<Dignidad>();

  protected readonly abierta = this.servicio.abierta;
  protected readonly guardado = this.servicio.estadoGuardado;
  protected readonly volverA = computed(() => `/${this.auth.perfil()?.rol ?? 'veedor'}/mesas`);
  protected readonly titulo = computed(() => {
    const mesa = this.abierta().datos?.mesa.numero;
    return `${this.dignidad() === 'alcalde' ? 'Alcalde' : 'Prefecto'}${mesa ? ` · Mesa ${mesa}` : ''}`;
  });

  ionViewWillEnter(): void {
    void this.servicio.abrir(this.jrvId(), this.dignidad());
  }

  recordar(valores: ValoresActa): void {
    const { datos } = this.abierta();
    if (datos) this.servicio.recordar(datos, valores);
  }

  async guardar(borrador: BorradorActa): Promise<void> {
    try {
      await this.servicio.guardar(borrador);
      await this.nav.navigateBack(this.volverA());
      await this.notificacion.exito('Acta guardada.');
    } catch (e) {
      await this.notificacion.error(e);
    }
  }
}
