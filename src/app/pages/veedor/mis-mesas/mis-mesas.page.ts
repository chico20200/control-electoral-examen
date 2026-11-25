import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
  type ViewWillEnter,
} from '@ionic/angular';

import type { Dignidad } from '../../../core/models';
import { ActasService } from '../../../core/services/actas.service';
import { RedService } from '../../../core/services/red.service';
import { SyncService } from '../../../core/services/sync.service';
import { EstadoVistaComponent } from '../../../shared/components/estado-vista/estado-vista.component';

@Component({
  selector: 'app-mis-mesas',
  imports: [
    RouterLink,
    EstadoVistaComponent,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList,
    IonNote,
    IonTitle,
    IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/veedor" text="Volver"></ion-back-button></ion-buttons>
        <ion-title>Mis mesas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (sync.conflictos().length; as n) {
        <ion-item routerLink="/veedor/pendientes" [detail]="true" color="danger">
          <ion-label class="ion-text-wrap">{{ n }} acta(s) en conflicto: no se enviaron. Toca para revisar.</ion-label>
        </ion-item>
      }
      @if (!enLinea()) {
        <ion-note class="ion-padding" style="display: block"
          >Sin conexión: se muestran los últimos datos guardados.</ion-note
        >
      }
      <app-estado-vista [estado]="mesas()" textoVacio="No tienes mesas asignadas." (reintentar)="ionViewWillEnter()" />
      <ion-list>
        @for (m of mesas().datos; track m.id) {
          <ion-item-divider
            ><ion-label>Mesa {{ m.numero }}</ion-label></ion-item-divider
          >
          @for (d of dignidades; track d.id) {
            <ion-item
              [routerLink]="sync.espera(m.id, d.id) ? '/veedor/pendientes' : ['/veedor/mesas', m.id, d.id]"
              [detail]="true"
            >
              <ion-label>{{ d.nombre }}</ion-label>
              @if (sync.espera(m.id, d.id)) {
                <ion-note slot="end" color="warning">Por enviar</ion-note>
              } @else {
                <ion-note slot="end" [color]="m[d.id] ? 'success' : 'medium'">{{
                  m[d.id] ? 'Registrada' : 'Pendiente'
                }}</ion-note>
              }
            </ion-item>
          }
        }
      </ion-list>
    </ion-content>
  `,
})
export class MisMesasPage implements ViewWillEnter {
  private readonly servicio = inject(ActasService);

  protected readonly sync = inject(SyncService);
  protected readonly enLinea = inject(RedService).enLinea;
  protected readonly mesas = this.servicio.misMesas;
  protected readonly dignidades: { id: Dignidad; nombre: string }[] = [
    { id: 'alcalde', nombre: 'Acta de alcalde' },
    { id: 'prefecto', nombre: 'Acta de prefecto' },
  ];

  constructor() {
    // Tras un envío automático, el estado en el servidor cambió.
    let vistas = this.sync.enviadas();
    effect(() => {
      const ahora = this.sync.enviadas();
      if (ahora !== vistas) untracked(() => this.ionViewWillEnter());
      vistas = ahora;
    });
  }

  ionViewWillEnter(): void {
    void this.servicio.cargarMisMesas();
  }
}
