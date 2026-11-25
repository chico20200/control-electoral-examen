import { Component, inject, signal } from '@angular/core';
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

import type { DatosUsuario } from '../../../core/models';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { EstadoVistaComponent } from '../../../shared/components/estado-vista/estado-vista.component';
import { UsuarioFormComponent } from '../../../shared/components/usuario-form/usuario-form.component';

@Component({
  selector: 'app-veedores',
  templateUrl: 'veedores.page.html',
  imports: [
    EstadoVistaComponent,
    UsuarioFormComponent,
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
export class VeedoresPage implements ViewWillEnter {
  private readonly servicio = inject(UsuariosService);
  private readonly notificacion = inject(NotificacionService);

  protected readonly veedores = this.servicio.veedores;
  protected readonly guardando = this.servicio.guardando;
  protected readonly creando = signal(false);

  ionViewWillEnter(): void {
    void this.servicio.cargarVeedores();
  }

  async guardar(datos: DatosUsuario): Promise<void> {
    try {
      await this.servicio.crear(datos);
      this.creando.set(false);
      await this.notificacion.exito('Cuenta creada. Debe confirmarla desde su correo.');
      await this.servicio.cargarVeedores();
    } catch (e) {
      await this.notificacion.error(e);
    }
  }
}
