import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Cédula ecuatoriana: provincia 01-24 o 30, tercer dígito < 6 y módulo 10.
 * Misma regla que `supabase/functions/_shared/cedula.ts`, que la repite en el servidor.
 */
export function esCedulaValida(c: unknown): c is string {
  if (typeof c !== 'string' || !/^\d{10}$/.test(c)) return false;
  const provincia = Number(c.slice(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30) || Number(c[2]) >= 6) return false;
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    const n = Number(c[i]) * (i % 2 === 0 ? 2 : 1);
    suma += n > 9 ? n - 9 : n;
  }
  return (10 - (suma % 10)) % 10 === Number(c[9]);
}

export const cedulaValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  esCedulaValida(control.value) ? null : { cedula: true };
