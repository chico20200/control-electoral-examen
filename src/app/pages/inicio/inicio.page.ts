import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  businessOutline,
  cloudUploadOutline,
  gridOutline,
  mapOutline,
  peopleOutline,
  warningOutline,
} from 'ionicons/icons';

import type { Rol } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SyncService } from '../../core/services/sync.service';

const TITULOS: Record<Rol, string> = {
  provincial: 'Coordinador provincial',
  recinto: 'Coordinador de recinto',
  veedor: 'Veedor',
};

const OPCIONES: Record<Rol, { texto: string; icono: string; ruta: string }[]> = {
  provincial: [
    { texto: 'Resultados', icono: 'bar-chart-outline', ruta: '/provincial/resultados' },
    { texto: 'Avance y ubicaciones', icono: 'map-outline', ruta: '/provincial/avance' },
    { texto: 'Recintos', icono: 'business-outline', ruta: '/provincial/recintos' },
  ],
  recinto: [
    { texto: 'Mesas', icono: 'grid-outline', ruta: '/recinto/mesas' },
    { texto: 'Veedores', icono: 'people-outline', ruta: '/recinto/veedores' },
    { texto: 'Actas por enviar', icono: 'cloud-upload-outline', ruta: '/recinto/pendientes' },
  ],
  veedor: [
    { texto: 'Mis mesas', icono: 'grid-outline', ruta: '/veedor/mesas' },
    { texto: 'Actas por enviar', icono: 'cloud-upload-outline', ruta: '/veedor/pendientes' },
  ],
};

/** Pantalla inicial por rol. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, IonButton, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar color="primary"
        ><ion-title>{{ titulo() }}</ion-title></ion-toolbar
      >
    </ion-header>
    <ion-content class="ion-padding">
      <div class="saludo">
        <p>Hola,</p>
        <h1>{{ perfil()?.nombres }} {{ perfil()?.apellidos }}</h1>
      </div>
      <ion-list class="menu" lines="none">
        @if (sync.conflictos().length; as n) {
          <ion-item color="danger" [detail]="true" [routerLink]="'/' + perfil()?.rol + '/pendientes'">
            <ion-icon slot="start" name="warning-outline" aria-hidden="true"></ion-icon>
            <ion-label>{{ n }} acta(s) en conflicto</ion-label>
          </ion-item>
        }
        @for (o of opciones(); track o.ruta) {
          <ion-item [detail]="true" [routerLink]="o.ruta">
            <ion-icon slot="start" color="primary" [name]="o.icono" aria-hidden="true"></ion-icon>
            <ion-label>{{ o.texto }}</ion-label>
          </ion-item>
        }
      </ion-list>
      <ion-button expand="block" fill="outline" routerLink="/cambiar-clave">Cambiar contraseña</ion-button>
      <ion-button expand="block" fill="clear" (click)="salir()">Cerrar sesión</ion-button>
    </ion-content>
  `,
})
export class InicioPage {
  constructor() {
    addIcons({
      barChartOutline,
      businessOutline,
      cloudUploadOutline,
      gridOutline,
      mapOutline,
      peopleOutline,
      warningOutline,
    });
  }

  private readonly auth = inject(AuthService);

  protected readonly sync = inject(SyncService);
  private readonly notificacion = inject(NotificacionService);

  protected readonly perfil = this.auth.perfil;
  private readonly rol = computed(() => this.perfil()?.rol ?? 'veedor');
  protected readonly titulo = computed(() => TITULOS[this.rol()]);
  protected readonly opciones = computed(() => OPCIONES[this.rol()]);

  async salir(): Promise<void> {
    const n = this.sync.pendientes().length;
    const aviso = `Tienes ${n} acta(s) por enviar. Se enviarán cuando vuelvas a entrar con este usuario, y para entrar necesitas conexión. ¿Cerrar sesión?`;
    if (n && !(await this.notificacion.confirmar(aviso))) return;
    await this.auth.salir();
  }
}
