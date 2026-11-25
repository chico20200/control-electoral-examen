import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  type ViewWillEnter,
} from '@ionic/angular';

import { RecintosService } from '../../../core/services/recintos.service';
import { EstadoVistaComponent } from '../../../shared/components/estado-vista/estado-vista.component';

@Component({
  selector: 'app-recintos',
  templateUrl: 'recintos.page.html',
  imports: [
    RouterLink,
    EstadoVistaComponent,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
  ],
})
export class RecintosPage implements ViewWillEnter {
  private readonly servicio = inject(RecintosService);
  protected readonly recintos = this.servicio.recintos;

  ionViewWillEnter(): void {
    void this.servicio.cargar();
  }
}
