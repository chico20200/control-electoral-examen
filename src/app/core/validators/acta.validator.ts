import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Entero de 0 a 999999, el mismo rango que acepta `guardar_acta`. Vacío no equivale a 0. */
const esConteo = (valor: unknown): boolean => /^\d{1,6}$/.test(String(valor ?? ''));

export const enteroNoNegativo: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  esConteo(control.value) ? null : { entero: true };

/**
 * Votos + blancos + nulos = total de sufragantes. `votos` puede ser FormArray o FormGroup.
 * Con campos incompletos o inválidos no opina: de eso se encarga `enteroNoNegativo`.
 */
export const totalesValidator: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const { votos, blancos, nulos, totalSufragantes } = grupo.getRawValue();
  const sumandos: unknown[] = [...Object.values(votos ?? {}), blancos, nulos];
  if (![...sumandos, totalSufragantes].every(esConteo)) return null;
  const suma = sumandos.reduce<number>((acumulado, n) => acumulado + Number(n), 0);
  const total = Number(totalSufragantes);
  return suma === total ? null : { totales: { suma, total } };
};
