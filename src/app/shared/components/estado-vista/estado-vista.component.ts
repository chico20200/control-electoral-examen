import { Component, computed, input, output } from '@angular/core';
import { IonButton, IonSpinner, IonText } from '@ionic/angular';

import type { Estado } from '../../../core/models';

/** Estados de carga, error con reintento y vacío (R9). */
@Component({
  selector: 'app-estado-vista',
  imports: [IonButton, IonSpinner, IonText],
  template: `
    @switch (estado().fase) {
      @case ('cargando') {
        <div class="ion-text-center ion-padding"><ion-spinner aria-label="Cargando"></ion-spinner></div>
      }
      @case ('error') {
        <div class="ion-text-center ion-padding" role="alert">
          <ion-text color="danger"
            ><p>{{ estado().error }}</p></ion-text
          >
          <ion-button fill="outline" (click)="reintentar.emit()">Reintentar</ion-button>
        </div>
      }
      @case ('exito') {
        @if (vacio()) {
          <p class="ion-text-center ion-padding">{{ textoVacio() }}</p>
        }
      }
    }
  `,
})
export class EstadoVistaComponent {
  readonly estado = input.required<Estado<unknown>>();
  readonly textoVacio = input('No hay datos para mostrar.');
  readonly reintentar = output();

  protected readonly vacio = computed(() => {
    const { datos } = this.estado();
    return datos === null || (Array.isArray(datos) && datos.length === 0);
  });
}
