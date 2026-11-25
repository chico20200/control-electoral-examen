import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  type ViewWillEnter,
} from '@ionic/angular';

import type { MesaEstado } from '../../../core/models';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { RecintosService } from '../../../core/services/recintos.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { EstadoVistaComponent } from '../../../shared/components/estado-vista/estado-vista.component';

@Component({
  selector: 'app-mesas',
  templateUrl: 'mesas.page.html',
  imports: [
    EstadoVistaComponent,
    RouterLink,
    IonBackButton,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
  ],
})
export class MesasPage implements ViewWillEnter {
  private readonly recintos = inject(RecintosService);
  private readonly usuarios = inject(UsuariosService);
  private readonly notificacion = inject(NotificacionService);

  protected readonly mesas = this.recintos.mesas;
  protected readonly veedores = this.usuarios.veedores;

  ionViewWillEnter(): void {
    void this.usuarios.cargarVeedores();
    void this.recintos.cargarMesas();
  }

  async asignar(mesa: MesaEstado, elegido: string): Promise<void> {
    const veedorId = elegido || null;
    if (veedorId === mesa.veedorId) return;
    if (
      mesa.veedorId &&
      !(await this.notificacion.confirmar(`${mesa.veedor} dejará de ver la mesa ${mesa.numero}. ¿Continuar?`))
    ) {
      await this.recintos.cargarMesas(); // devuelve el selector a lo guardado
      return;
    }
    try {
      await this.recintos.asignarVeedor(mesa.id, veedorId);
      await this.notificacion.exito(`Mesa ${mesa.numero} actualizada.`);
    } catch (e) {
      await this.notificacion.error(e);
    }
  }
}
