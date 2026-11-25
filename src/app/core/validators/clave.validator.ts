import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Mismas reglas que `validarClaveNueva` en el servidor. */
export const claveNuevaValidator: ValidatorFn = ({ value }: AbstractControl): ValidationErrors | null =>
  typeof value === 'string' && value.length >= 8 && value !== 'Ecuador2026' ? null : { clave: true };

/** El control debe ser igual a su hermano `nombre`. */
export const igualA =
  (nombre: string): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null =>
    control.value === control.parent?.get(nombre)?.value ? null : { igual: true };
