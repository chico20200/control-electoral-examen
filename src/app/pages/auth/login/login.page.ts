import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
import { cedulaValidator } from '../../../core/validators/cedula.validator';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  imports: [
    ReactiveFormsModule,
    RouterLink,
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
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly nav = inject(NavController);
  private readonly notificacion = inject(NotificacionService);

  protected readonly estado = this.auth.estado;
  protected readonly form = new FormGroup({
    cedula: new FormControl('', { nonNullable: true, validators: cedulaValidator }),
    clave: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });

  async entrar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.estado().fase === 'cargando') return;
    const { cedula, clave } = this.form.getRawValue();
    try {
      await this.auth.login(cedula, clave);
      this.form.reset();
      await this.nav.navigateRoot(rutaInicial(this.auth.perfil()));
    } catch (e) {
      await this.notificacion.error(e);
    }
  }
}
