import { TestBed } from '@angular/core/testing';

import { CapturaService } from './captura.service';
import { DISPOSITIVO } from './dispositivo';

describe('CapturaService (R7)', () => {
  const disp = {
    permisoCamara: vi.fn(),
    tomarFoto: vi.fn(),
    procesar: vi.fn(),
    permisoUbicacion: vi.fn(),
    posicion: vi.fn(),
  };
  let captura: CapturaService;

  beforeEach(() => {
    for (const f of Object.values(disp)) f.mockReset();
    disp.permisoCamara.mockResolvedValue(true);
    disp.permisoUbicacion.mockResolvedValue('precisa');
    disp.tomarFoto.mockResolvedValue(new Blob(['x']));
    TestBed.configureTestingModule({ providers: [{ provide: DISPOSITIVO, useValue: disp }] });
    captura = TestBed.inject(CapturaService);
  });

  const procesada = (gris: number[]) =>
    disp.procesar.mockResolvedValue({ blob: new Blob(['j']), vistaPrevia: 'data:', gris, ancho: 4, alto: 4 });

  it('marca como aceptable una foto con bordes', async () => {
    procesada(Array.from({ length: 16 }, (_, i) => ((i + Math.floor(i / 4)) % 2 ? 255 : 0)));
    expect((await captura.foto()).aceptable).toBe(true);
  });

  it('rechaza una foto plana', async () => {
    procesada(Array(16).fill(100));
    expect(await captura.foto()).toMatchObject({ aceptable: false, nitidez: 0 });
  });

  it('cámara denegada: no llega a abrirla', async () => {
    disp.permisoCamara.mockResolvedValue(false);
    await expect(captura.foto()).rejects.toThrow('CAMARA_DENEGADA');
    expect(disp.tomarFoto).not.toHaveBeenCalled();
  });

  it.each([
    ['OS-PLUG-CAMR-0003', 'CAMARA_DENEGADA'],
    ['OS-PLUG-CAMR-0006', 'CAMARA_CANCELADA'],
    ['OS-PLUG-CAMR-0010', 'CAMARA_NO_DISPONIBLE'],
  ])('traduce el error %s de la cámara', async (code, esperado) => {
    disp.tomarFoto.mockRejectedValue({ code });
    await expect(captura.foto()).rejects.toThrow(esperado);
  });

  it('una imagen que no se puede leer es un error controlado', async () => {
    disp.procesar.mockRejectedValue(new Error('decode'));
    await expect(captura.foto()).rejects.toThrow('CAMARA_NO_DISPONIBLE');
  });

  it('devuelve la ubicación con 15 s de espera', async () => {
    disp.posicion.mockResolvedValue({ lat: -0.2, lng: -78.5, precisionM: 8 });
    expect(await captura.ubicacion()).toEqual({ lat: -0.2, lng: -78.5, precisionM: 8 });
    expect(disp.posicion).toHaveBeenCalledWith(true, 15000);
  });

  it('con permiso aproximado pide ubicación aproximada', async () => {
    disp.permisoUbicacion.mockResolvedValue('aproximada');
    disp.posicion.mockResolvedValue({ lat: 0, lng: 0, precisionM: 2000 });
    await captura.ubicacion();
    expect(disp.posicion).toHaveBeenCalledWith(false, 15000);
  });

  it('GPS denegado, en el permiso o al pedir la posición', async () => {
    disp.permisoUbicacion.mockResolvedValue('denegada');
    await expect(captura.ubicacion()).rejects.toThrow('GPS_DENEGADO');
    disp.permisoUbicacion.mockResolvedValue('precisa');
    disp.posicion.mockRejectedValue({ code: 1 });
    await expect(captura.ubicacion()).rejects.toThrow('GPS_DENEGADO');
  });

  it('GPS apagado o agotado', async () => {
    disp.posicion.mockRejectedValue(new Error('timeout'));
    await expect(captura.ubicacion()).rejects.toThrow('GPS_NO_DISPONIBLE');
    disp.permisoUbicacion.mockRejectedValue(new Error('location services disabled'));
    await expect(captura.ubicacion()).rejects.toThrow('GPS_NO_DISPONIBLE');
  });
});
