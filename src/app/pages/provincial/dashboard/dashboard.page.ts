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
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  type ViewWillEnter,
} from '@ionic/angular';

import type { FiltroResultados } from '../../../core/models';
import { ResultadosService } from '../../../core/services/resultados.service';
import { EstadoVistaComponent } from '../../../shared/components/estado-vista/estado-vista.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
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
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
  ],
})
export class DashboardPage implements ViewWillEnter {
  private readonly servicio = inject(ResultadosService);

  protected readonly filtro = this.servicio.filtro;
  protected readonly resultados = this.servicio.resultados;
  protected readonly avance = this.servicio.avance;
  protected readonly total = this.servicio.totalVotos;

  ionViewWillEnter(): void {
    void this.servicio.cargar();
  }

  filtrar(cambio: Partial<FiltroResultados>): void {
    this.servicio.filtro.update((f) => ({ ...f, ...cambio }));
  }
}
