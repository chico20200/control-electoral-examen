import { Component, inject, input } from '@angular/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, NavController } from '@ionic/angular';

import type { DatosUsuario } from '../../../core/models';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { UsuarioFormComponent } from '../../../shared/components/usuario-form/usuario-form.component';

@Component({
  selector: 'app-coordinador-nuevo',
  imports: [UsuarioFormComponent, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/provincial/recintos" text="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title>Nuevo coordinador</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <app-usuario-form [enviando]="guardando()" (guardar)="guardar($event)" />
    </ion-content>
  `,
})
export class CoordinadorNuevoPage {
  private readonly servicio = inject(UsuariosService);
  private readonly notificacion = inject(NotificacionService);
  private readonly nav = inject(NavController);

  /** Id del recinto, tomado de la ruta. */
  readonly id = input.required<string>();
  protected readonly guardando = this.servicio.guardando;

  async guardar(datos: DatosUsuario): Promise<void> {
    try {
      await this.servicio.crear(datos, this.id());
      await this.nav.navigateBack('/provincial/recintos');
      await this.notificacion.exito('Cuenta creada. Debe confirmarla desde su correo.');
    } catch (e) {
      await this.notificacion.error(e);
    }
  }
}
