import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { enteroNoNegativo, totalesValidator } from './acta.validator';

describe('enteroNoNegativo (R6)', () => {
  it.each([[null], [''], [-1], [1.5], ['abc'], ['1e3'], [' ']])('rechaza %j', (valor) => {
    expect(enteroNoNegativo(new FormControl(valor))).toEqual({ entero: true });
  });

  it.each([[0], [250], ['12'], [999999]])('acepta %j', (valor) => {
    expect(enteroNoNegativo(new FormControl(valor))).toBeNull();
  });

  it('rechaza más de 6 cifras, igual que guardar_acta', () => {
    expect(enteroNoNegativo(new FormControl(1000000))).toEqual({ entero: true });
  });
});

describe('totalesValidator (R6)', () => {
  const acta = (totalSufragantes: unknown, votos: unknown[] = [10, 20, 30, 40, 50]) =>
    new FormGroup({
      votos: new FormArray(votos.map((v) => new FormControl(v))),
      blancos: new FormControl<unknown>(5),
      nulos: new FormControl<unknown>(5),
      totalSufragantes: new FormControl(totalSufragantes),
    });

  it('acepta si votos + blancos + nulos = sufragantes', () => {
    expect(totalesValidator(acta(160))).toBeNull();
  });

  it('informa la suma y el total si no cuadran', () => {
    expect(totalesValidator(acta(159))).toEqual({ totales: { suma: 160, total: 159 } });
  });

  it('suma los textos como números, sin concatenar', () => {
    expect(totalesValidator(acta('160', ['10', '20', '30', '40', '50']))).toBeNull();
  });

  it('admite votos como grupo por id de candidatura', () => {
    const grupo = new FormGroup({
      votos: new FormGroup({ a: new FormControl(1), b: new FormControl(2) }),
      blancos: new FormControl(0),
      nulos: new FormControl(0),
      totalSufragantes: new FormControl(3),
    });
    expect(totalesValidator(grupo)).toBeNull();
  });

  it('no opina mientras falte o sea inválido algún campo', () => {
    expect(totalesValidator(acta(null))).toBeNull();
    expect(totalesValidator(acta(160, [10, null]))).toBeNull();
  });
});
