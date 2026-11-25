import { FormControl, FormGroup } from '@angular/forms';

import { claveNuevaValidator, igualA } from './clave.validator';

describe('claveNuevaValidator (R3)', () => {
  it.each([null, '', '1234567', 'Ecuador2026'])('rechaza %j', (v) => {
    expect(claveNuevaValidator(new FormControl(v))).toEqual({ clave: true });
  });
  it('acepta 8 caracteres distintos de la inicial', () => {
    expect(claveNuevaValidator(new FormControl('Nueva-26'))).toBeNull();
  });
});

describe('igualA', () => {
  it('compara con el otro campo', () => {
    const repetir = new FormControl('x', igualA('nueva'));
    const grupo = new FormGroup({ nueva: new FormControl('y'), repetir });
    repetir.updateValueAndValidity();
    expect(repetir.errors).toEqual({ igual: true });
    grupo.controls.nueva.setValue('x');
    repetir.updateValueAndValidity();
    expect(repetir.errors).toBeNull();
  });
});
