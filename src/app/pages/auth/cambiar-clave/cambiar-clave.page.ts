import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular';

import { rutaInicial } from '../../../core/guards/ruta-inicial';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { claveNuevaValidator, igualA } from '../../../core/validators/clave.validator';

@Component({
  selector: 'app-cambiar-clave',
  templateUrl: 'cambiar-clave.page.html',
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonInputPasswordToggle,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class CambiarClavePage {
  private readonly auth = inject(AuthService);
  private readonly nav = inject(NavController);
  private readonly notificacion = inject(NotificacionService);

  protected readonly estado = this.auth.estado;
  protected readonly perfil = this.auth.perfil;
  protected readonly form = new FormGroup({
    nueva: new FormControl('', { nonNullable: true, validators: claveNuevaValidator }),
    repetir: new FormControl('', { nonNullable: true, validators: igualA('nueva') }),
  });

  async guardar(): Promise<void> {
    this.form.controls.repetir.updateValueAndValidity();
    this.form.markAllAsTouched();
    if (this.form.invalid || this.estado().fase === 'cargando') return;
    try {
      await this.auth.cambiarClave(this.form.getRawValue().nueva);
      this.form.reset();
      await this.nav.navigateRoot(rutaInicial(this.auth.perfil()));
      await this.notificacion.exito('Contraseña actualizada.');
    } catch (e) {
      await this.notificacion.error(e);
    }
  }

  async cancelar(): Promise<void> {
    if (this.perfil()?.debeCambiarClave) await this.auth.salir();
    else await this.nav.navigateRoot(rutaInicial(this.perfil()));
  }
}
