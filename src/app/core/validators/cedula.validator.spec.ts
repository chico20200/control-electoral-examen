import { FormControl } from '@angular/forms';

import { cedulaValidator, esCedulaValida } from './cedula.validator';

describe('esCedulaValida (R2)', () => {
  it.each([
    ['Pichincha', '1710034065'],
    ['última provincia (24)', '2410034066'],
    ['registrada en el exterior (30)', '3010034068'],
  ])('acepta: %s', (_caso, cedula) => {
    expect(esCedulaValida(cedula)).toBe(true);
  });

  it.each([
    ['dígito verificador incorrecto', '1710034066'],
    ['tercer dígito no permitido', '1770034065'],
    ['9 dígitos', '171003406'],
    ['11 dígitos', '17100340650'],
    ['letras', 'abcdefghij'],
    ['vacía', ''],
    // Con verificador correcto: solo las detiene la regla que nombran.
    ['provincia 25', '2510034065'],
    ['provincia 00', '0010034064'],
    ['tercer dígito 6', '1760034064'],
  ])('rechaza: %s', (_caso, cedula) => {
    expect(esCedulaValida(cedula)).toBe(false);
  });
});

describe('cedulaValidator', () => {
  it('devuelve null si es válida y {cedula:true} si no', () => {
    expect(cedulaValidator(new FormControl('1710034065'))).toBeNull();
    expect(cedulaValidator(new FormControl('1710034066'))).toEqual({ cedula: true });
    expect(cedulaValidator(new FormControl(null))).toEqual({ cedula: true });
  });
});
