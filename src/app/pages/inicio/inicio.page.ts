import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

import type { Rol } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SyncService } from '../../core/services/sync.service';

const TITULOS: Record<Rol, string> = {
  provincial: 'Coordinador provincial',
  recinto: 'Coordinador de recinto',
  veedor: 'Veedor',
};

const OPCIONES: Record<Rol, { texto: string; ruta: string }[]> = {
  provincial: [
    { texto: 'Resultados', ruta: '/provincial/resultados' },
    { texto: 'Avance y ubicaciones', ruta: '/provincial/avance' },
    { texto: 'Recintos', ruta: '/provincial/recintos' },
  ],
  recinto: [
    { texto: 'Mesas', ruta: '/recinto/mesas' },
    { texto: 'Veedores', ruta: '/recinto/veedores' },
    { texto: 'Actas por enviar', ruta: '/recinto/pendientes' },
  ],
  veedor: [
    { texto: 'Mis mesas', ruta: '/veedor/mesas' },
    { texto: 'Actas por enviar', ruta: '/veedor/pendientes' },
  ],
};

/** Pantalla inicial por rol. */
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
      @if (sync.conflictos().length; as n) {
        <ion-button expand="block" color="danger" [routerLink]="'/' + perfil()?.rol + '/pendientes'"
          >{{ n }} acta(s) en conflicto</ion-button
        >
      }
      <ion-button expand="block" fill="outline" routerLink="/cambiar-clave">Cambiar contraseña</ion-button>
      <ion-button expand="block" fill="clear" (click)="salir()">Cerrar sesión</ion-button>
    </ion-content>
  `,
})
export class InicioPage {
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
