import { TestBed } from '@angular/core/testing';

import { UsuarioFormComponent } from './usuario-form.component';

describe('UsuarioFormComponent (R2)', () => {
  const valido = {
    cedula: '1710034065',
    nombres: 'Ana',
    apellidos: 'Paz',
    telefono: '0991234567',
    correo: 'ana@prueba.local',
  };
  const enviar = (cambios: Partial<typeof valido> = {}, enviando = false) => {
    const fixture = TestBed.createComponent(UsuarioFormComponent);
    fixture.componentRef.setInput('enviando', enviando);
    const emitidos: unknown[] = [];
    fixture.componentInstance.guardar.subscribe((d) => emitidos.push(d));
    fixture.componentInstance.form.setValue({ ...valido, ...cambios });
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    return emitidos;
  };

  it('emite los datos válidos', () => {
    expect(enviar()).toEqual([valido]);
  });

  it('quita espacios sobrantes', () => {
    expect(enviar({ nombres: '  Ana ' })).toEqual([valido]);
  });

  it.each([
    ['cédula inválida', { cedula: '1710034066' }],
    ['nombres en blanco', { nombres: '   ' }],
    ['apellidos vacíos', { apellidos: '' }],
    ['teléfono sin 0 inicial', { telefono: '9912345678' }],
    ['teléfono corto', { telefono: '099123456' }],
    ['correo sin dominio', { correo: 'ana@' }],
    ['correo vacío', { correo: '' }],
  ])('no emite con %s', (_caso, cambios) => {
    expect(enviar(cambios)).toEqual([]);
  });

  it('no emite dos veces mientras se envía', () => {
    expect(enviar({}, true)).toEqual([]);
  });
});
