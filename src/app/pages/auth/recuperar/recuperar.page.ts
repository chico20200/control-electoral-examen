import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
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
import { claveNuevaValidator } from '../../../core/validators/clave.validator';

@Component({
  selector: 'app-recuperar',
  templateUrl: 'recuperar.page.html',
  imports: [
    ReactiveFormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonInputPasswordToggle,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class RecuperarPage {
  private readonly auth = inject(AuthService);
  private readonly nav = inject(NavController);
  private readonly notificacion = inject(NotificacionService);

  protected readonly estado = this.auth.estado;
  protected readonly codigoPedido = signal(false);
  protected readonly cedula = new FormControl('', { nonNullable: true, validators: cedulaValidator });
  protected readonly form = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
    nueva: new FormControl('', { nonNullable: true, validators: claveNuevaValidator }),
  });

  async pedir(): Promise<void> {
    this.cedula.markAsTouched();
    if (this.cedula.invalid || this.estado().fase === 'cargando') return;
    try {
      await this.auth.solicitarCodigo(this.cedula.value);
      this.codigoPedido.set(true);
    } catch (e) {
      await this.notificacion.error(e);
    }
  }

  async cambiar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.estado().fase === 'cargando') return;
    const { codigo, nueva } = this.form.getRawValue();
    try {
      await this.auth.recuperar(this.cedula.value, codigo, nueva);
      this.form.reset();
      await this.nav.navigateRoot(rutaInicial(this.auth.perfil()));
      await this.notificacion.exito('Contraseña actualizada.');
    } catch (e) {
      await this.notificacion.error(e);
    }
  }
}
