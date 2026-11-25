import { Component, inject } from '@angular/core';
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
  IonProgressBar,
  IonTitle,
  IonToolbar,
  type ViewWillEnter,
} from '@ionic/angular';

import type { ActaGps } from '../../../core/models';
import { ResultadosService } from '../../../core/services/resultados.service';
import { EstadoVistaComponent } from '../../../shared/components/estado-vista/estado-vista.component';

@Component({
  selector: 'app-avance',
  templateUrl: 'avance.page.html',
  imports: [
    EstadoVistaComponent,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonProgressBar,
    IonTitle,
    IonToolbar,
  ],
})
export class AvancePage implements ViewWillEnter {
  private readonly servicio = inject(ResultadosService);

  protected readonly avance = this.servicio.avance;
  protected readonly actasGps = this.servicio.actasGps;

  ionViewWillEnter(): void {
    void this.servicio.cargar();
  }

  protected mapa({ lat, lng }: ActaGps): string {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
}
