import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonInput, IonSpinner } from '@ionic/angular';

import type { DatosUsuario } from '../../../core/models';
import { cedulaValidator } from '../../../core/validators/cedula.validator';

const texto = (patron: RegExp) =>
  new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(patron)] });

/** Alta de coordinador o veedor. El servidor repite las validaciones. */
@Component({
  selector: 'app-usuario-form',
  templateUrl: 'usuario-form.component.html',
  imports: [ReactiveFormsModule, IonButton, IonInput, IonSpinner],
})
export class UsuarioFormComponent {
  readonly enviando = input(false);
  readonly guardar = output<DatosUsuario>();

  readonly form = new FormGroup({
    cedula: new FormControl('', { nonNullable: true, validators: cedulaValidator }),
    nombres: texto(/\S/),
    apellidos: texto(/\S/),
    telefono: texto(/^0\d{9}$/),
    correo: texto(/^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/),
  });

  protected enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.enviando()) return;
    const d = this.form.getRawValue();
    this.guardar.emit({
      ...d,
      nombres: d.nombres.trim(),
      apellidos: d.apellidos.trim(),
      correo: d.correo.trim(),
    });
  }
}
