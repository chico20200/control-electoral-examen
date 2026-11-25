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

const OPCIONES: Record<Rol, { texto: string; ruta: string }[]> = {
  provincial: [{ texto: 'Recintos', ruta: '/provincial/recintos' }],
  recinto: [
    { texto: 'Mesas', ruta: '/recinto/mesas' },
    { texto: 'Veedores', ruta: '/recinto/veedores' },
  ],
  veedor: [{ texto: 'Mis mesas', ruta: '/veedor/mesas' }],
};

/** Pantalla inicial por rol; la tarea 8 agrega el dashboard. */
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
      @for (o of opciones(); track o.ruta) {
        <ion-button expand="block" [routerLink]="o.ruta">{{ o.texto }}</ion-button>
      }
      <ion-button expand="block" fill="outline" routerLink="/cambiar-clave">Cambiar contraseña</ion-button>
      <ion-button expand="block" fill="clear" (click)="salir()">Cerrar sesión</ion-button>
    </ion-content>
  `,
})
export class InicioPage {
  private readonly auth = inject(AuthService);

  protected readonly perfil = this.auth.perfil;
  private readonly rol = computed(() => this.perfil()?.rol ?? 'veedor');
  protected readonly titulo = computed(() => TITULOS[this.rol()]);
  protected readonly opciones = computed(() => OPCIONES[this.rol()]);

  salir(): Promise<void> {
    return this.auth.salir();
  }
}
