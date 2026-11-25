import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

import type { Rol } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

const TITULOS: Record<Rol, string> = {
  provincial: 'Coordinador provincial',
  recinto: 'Coordinador de recinto',
  veedor: 'Veedor',
};

/** Pantalla inicial por rol; las tareas 6 a 8 agregan sus opciones. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, IonButton, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar color="primary"
        ><ion-title>{{ titulo() }}</ion-title></ion-toolbar
      >
    </ion-header>
    <ion-content class="ion-padding">
      <h1>{{ perfil()?.nombres }} {{ perfil()?.apellidos }}</h1>
      <ion-button expand="block" fill="outline" routerLink="/cambiar-clave">Cambiar contraseña</ion-button>
      <ion-button expand="block" fill="clear" (click)="salir()">Cerrar sesión</ion-button>
    </ion-content>
  `,
})
export class InicioPage {
  private readonly auth = inject(AuthService);

  protected readonly perfil = this.auth.perfil;
  protected readonly titulo = computed(() => TITULOS[this.perfil()?.rol ?? 'veedor']);

  salir(): Promise<void> {
    return this.auth.salir();
  }
}
