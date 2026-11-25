import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular';

import { NotificacionService } from '../../../core/services/notificacion.service';
import { RecintosService } from '../../../core/services/recintos.service';
import { enteroNoNegativo } from '../../../core/validators/acta.validator';

const texto = (inicial = '') =>
  new FormControl(inicial, { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] });

@Component({
  selector: 'app-recinto-nuevo',
  templateUrl: 'recinto-nuevo.page.html',
  imports: [
    ReactiveFormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class RecintoNuevoPage {
  private readonly servicio = inject(RecintosService);
  private readonly notificacion = inject(NotificacionService);
  private readonly nav = inject(NavController);

  protected readonly guardando = this.servicio.guardando;
  protected readonly form = new FormGroup({
    provincia: texto('Pichincha'),
    canton: texto('Quito'),
    parroquia: texto(),
    nombre: texto(),
    numJrv: new FormControl<number | string>('', {
      nonNullable: true,
      validators: [enteroNoNegativo, Validators.min(1), Validators.max(100)],
    }),
  });

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.guardando()) return;
    const d = this.form.getRawValue();
    try {
      await this.servicio.crear({
        provincia: d.provincia.trim(),
        canton: d.canton.trim(),
        parroquia: d.parroquia.trim(),
        nombre: d.nombre.trim(),
        numJrv: Number(d.numJrv),
      });
      await this.nav.navigateBack('/provincial/recintos');
      await this.notificacion.exito('Recinto creado.');
    } catch (e) {
      await this.notificacion.error(e);
    }
  }
}
