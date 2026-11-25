import { Component, inject } from '@angular/core';
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
      <app-estado-vista [estado]="mesas()" textoVacio="No tienes mesas asignadas." (reintentar)="ionViewWillEnter()" />
      <ion-list>
        @for (m of mesas().datos; track m.id) {
          <ion-item-divider
            ><ion-label>Mesa {{ m.numero }}</ion-label></ion-item-divider
          >
          @for (d of dignidades; track d.id) {
            <ion-item [routerLink]="['/veedor/mesas', m.id, d.id]" [detail]="true">
              <ion-label>{{ d.nombre }}</ion-label>
              <ion-note slot="end" [color]="m[d.id] ? 'success' : 'medium'">{{
                m[d.id] ? 'Registrada' : 'Pendiente'
              }}</ion-note>
            </ion-item>
          }
        }
      </ion-list>
    </ion-content>
  `,
})
export class MisMesasPage implements ViewWillEnter {
  private readonly servicio = inject(ActasService);

  protected readonly mesas = this.servicio.misMesas;
  protected readonly dignidades: { id: Dignidad; nombre: string }[] = [
    { id: 'alcalde', nombre: 'Acta de alcalde' },
    { id: 'prefecto', nombre: 'Acta de prefecto' },
  ];

  ionViewWillEnter(): void {
    void this.servicio.cargarMisMesas();
  }
}
