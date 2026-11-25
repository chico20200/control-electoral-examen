import { TestBed } from '@angular/core/testing';

import type { Acta, ActaAbierta, BorradorActa } from '../../../core/models';
import { ErrorApp } from '../../../core/models/error-app';
import { CapturaService } from '../../../core/services/captura.service';
import { NotificacionService } from '../../../core/services/notificacion.service';

import { ActaFormComponent } from './acta-form.component';

const candidaturas = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
  id,
  organizacion: `Org ${id}`,
  dignidad: 'alcalde' as const,
  nombre: id,
}));
const votos = { a: '10', b: '20', c: '30', d: '40', e: '50' };
const lleno = { votos, blancos: '5', nulos: '5', totalSufragantes: '160' };
const gps = { lat: -0.2, lng: -78.5, precisionM: 8 };
const nitida = { blob: new Blob(['n']), vistaPrevia: 'data:n', nitidez: 500, aceptable: true };
const borrosa = { blob: new Blob(['b']), vistaPrevia: 'data:b', nitidez: 20, aceptable: false };
const acta: Acta = {
  id: 'x',
  jrvId: 'm1',
  dignidad: 'alcalde',
  votos: { a: 10, b: 20, c: 30, d: 40, e: 50 },
  blancos: 5,
  nulos: 5,
  totalSufragantes: 160,
  fotoPath: 'vieja.jpg',
  lat: 1,
  lng: 2,
  precisionM: 3,
  capturadaEn: 't0',
  version: 4,
};

describe('ActaFormComponent (R6, R7)', () => {
  const captura = { foto: vi.fn(), ubicacion: vi.fn() };
  const notificacion = { error: vi.fn() };

  const crear = (datos: Partial<ActaAbierta> = {}) => {
    const fixture = TestBed.createComponent(ActaFormComponent);
    fixture.componentRef.setInput('datos', {
      mesa: { id: 'm1', recintoId: 'r1', numero: 1, veedorId: null },
      dignidad: 'alcalde',
      candidaturas,
      acta: null,
      fotoUrl: null,
      valores: null,
      ...datos,
    });
    const emitidos: BorradorActa[] = [];
    fixture.componentInstance.guardar.subscribe((b) => emitidos.push(b));
    fixture.detectChanges();
    const c = fixture.componentInstance;
    return { c, emitidos, fixture, guardar: () => c.enviar() };
  };

  beforeEach(() => {
    captura.foto.mockReset().mockResolvedValue(nitida);
    captura.ubicacion.mockReset().mockResolvedValue(gps);
    notificacion.error.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: CapturaService, useValue: captura },
        { provide: NotificacionService, useValue: notificacion },
      ],
    });
  });

  it('emite el acta completa con foto, GPS y números', async () => {
    const { c, emitidos, guardar } = crear();
    c.form.setValue(lleno);
    await c.tomarFoto();
    guardar();
    expect(emitidos).toHaveLength(1);
    expect(emitidos[0]).toMatchObject({
      jrvId: 'm1',
      recintoId: 'r1',
      dignidad: 'alcalde',
      blancos: 5,
      nulos: 5,
      totalSufragantes: 160,
      votos: { a: 10, b: 20, c: 30, d: 40, e: 50 },
      ...gps,
      versionBase: 0,
      foto: nitida.blob,
      fotoPath: null,
    });
  });

  it('sin foto no se puede guardar', () => {
    const { c, emitidos, guardar } = crear();
    c.form.setValue(lleno);
    guardar();
    expect(c.puedeGuardar()).toBe(false);
    expect(emitidos).toEqual([]);
  });

  it('una foto borrosa bloquea el guardado y no pide GPS', async () => {
    captura.foto.mockResolvedValue(borrosa);
    const { c, emitidos, guardar, fixture } = crear();
    c.form.setValue(lleno);
    await c.tomarFoto();
    fixture.detectChanges();
    guardar();
    expect(emitidos).toEqual([]);
    expect(captura.ubicacion).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('borrosa');
    expect(fixture.nativeElement.textContent).toContain('20');
  });

  it('totales que no cuadran: bloquea y muestra ambos números', async () => {
    const { c, emitidos, guardar, fixture } = crear();
    c.form.setValue({ ...lleno, totalSufragantes: '159' });
    await c.tomarFoto();
    fixture.detectChanges();
    guardar();
    expect(c.puedeGuardar()).toBe(false);
    expect(emitidos).toEqual([]);
    expect(fixture.nativeElement.textContent).toMatch(/160.*159/s);
  });

  it('un voto vacío bloquea', async () => {
    const { c } = crear();
    c.form.setValue({ ...lleno, votos: { ...votos, a: '' } });
    await c.tomarFoto();
    expect(c.puedeGuardar()).toBe(false);
  });

  it('GPS denegado: conserva votos y foto, y se puede reintentar', async () => {
    captura.ubicacion.mockRejectedValueOnce(new ErrorApp('GPS_DENEGADO'));
    const { c, emitidos, guardar } = crear();
    c.form.setValue(lleno);
    await c.tomarFoto();
    expect(notificacion.error).toHaveBeenCalled();
    expect(c.form.getRawValue()).toEqual(lleno);
    expect(c.puedeGuardar()).toBe(false);
    await c.ubicar();
    guardar();
    expect(emitidos[0]).toMatchObject({ ...gps, foto: nitida.blob });
  });

  it('cancelar la cámara no pierde la foto anterior ni muestra error', async () => {
    const { c } = crear();
    c.form.setValue(lleno);
    await c.tomarFoto();
    captura.foto.mockRejectedValueOnce(new ErrorApp('CAMARA_CANCELADA'));
    await c.tomarFoto();
    expect(notificacion.error).not.toHaveBeenCalled();
    expect(c.puedeGuardar()).toBe(true);
  });

  it('corregir sin foto nueva conserva foto, GPS y fecha', () => {
    const { c, emitidos, guardar } = crear({ acta });
    c.form.controls.blancos.setValue('6');
    c.form.controls.nulos.setValue('4');
    guardar();
    expect(emitidos[0]).toMatchObject({
      foto: null,
      fotoPath: 'vieja.jpg',
      lat: 1,
      lng: 2,
      precisionM: 3,
      capturadaEn: 't0',
      versionBase: 4,
      blancos: 6,
    });
  });

  it('corregir con foto nueva no reutiliza el GPS viejo si falla', async () => {
    captura.ubicacion.mockRejectedValue(new ErrorApp('GPS_NO_DISPONIBLE'));
    const { c } = crear({ acta });
    await c.tomarFoto();
    expect(c.puedeGuardar()).toBe(false);
    c.descartarFoto();
    expect(c.puedeGuardar()).toBe(true);
  });

  it('reintentar sin cambios repite la operación; con cambios usa otra', async () => {
    const { c, emitidos, guardar } = crear();
    c.form.setValue(lleno);
    await c.tomarFoto();
    guardar();
    guardar();
    c.form.controls.blancos.setValue('4');
    c.form.controls.nulos.setValue('6');
    guardar();
    const [x, y, z] = emitidos.map((e) => e.operacionId);
    expect(x).toBe(y);
    expect(z).not.toBe(x);
  });

  it('recupera los valores escritos antes', () => {
    expect(crear({ valores: lleno }).c.form.getRawValue()).toEqual(lleno);
  });
});
