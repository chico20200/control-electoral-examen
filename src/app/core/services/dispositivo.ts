import { InjectionToken } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

import type { Ubicacion } from '../models';

import { ANCHO_MEDICION } from './nitidez';

export interface ImagenProcesada {
  blob: Blob;
  vistaPrevia: string;
  gris: ArrayLike<number>;
  ancho: number;
  alto: number;
}

/** Acceso a los plugins de Capacitor (ADR-003). Aparte, para probar el resto sin teléfono. */
export interface Dispositivo {
  permisoCamara(): Promise<boolean>;
  tomarFoto(): Promise<Blob>;
  procesar(foto: Blob): Promise<ImagenProcesada>;
  permisoUbicacion(): Promise<'precisa' | 'aproximada' | 'denegada'>;
  posicion(precisa: boolean, espera: number): Promise<Ubicacion>;
}

const LADO_MAXIMO = 1600;

function dibujar(imagen: ImageBitmap, ancho: number): HTMLCanvasElement {
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(ancho);
  lienzo.height = Math.round((imagen.height * ancho) / imagen.width);
  lienzo.getContext('2d')!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  return lienzo;
}

const dispositivo: Dispositivo = {
  async permisoCamara() {
    // En el navegador lo gestiona el propio navegador.
    if (!Capacitor.isNativePlatform()) return true;
    return (await Camera.requestPermissions({ permissions: ['camera'] })).camera === 'granted';
  },

  async tomarFoto() {
    const { webPath } = await Camera.takePhoto({
      quality: 90,
      targetWidth: LADO_MAXIMO,
      targetHeight: LADO_MAXIMO,
      correctOrientation: true,
      saveToGallery: false,
      webUseInput: true,
    });
    return (await fetch(webPath!)).blob();
  },

  async procesar(foto) {
    const imagen = await createImageBitmap(foto);
    try {
      const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
      const final = dibujar(imagen, imagen.width * escala);
      const medicion = dibujar(imagen, ANCHO_MEDICION);
      const { data, width, height } = medicion.getContext('2d')!.getImageData(0, 0, medicion.width, medicion.height);
      const gris = new Float32Array(width * height);
      for (let i = 0; i < gris.length; i++) {
        gris[i] = 0.299 * data[4 * i] + 0.587 * data[4 * i + 1] + 0.114 * data[4 * i + 2];
      }
      const blob = await new Promise<Blob | null>((listo) => final.toBlob(listo, 'image/jpeg', 0.8));
      if (!blob) throw new Error('toBlob');
      return { blob, vistaPrevia: final.toDataURL('image/jpeg', 0.6), gris, ancho: width, alto: height };
    } finally {
      imagen.close();
    }
  },

  async permisoUbicacion() {
    if (!Capacitor.isNativePlatform()) return 'precisa';
    const { location, coarseLocation } = await Geolocation.requestPermissions();
    return location === 'granted' ? 'precisa' : coarseLocation === 'granted' ? 'aproximada' : 'denegada';
  },

  async posicion(enableHighAccuracy, timeout) {
    const { coords } = await Geolocation.getCurrentPosition({ enableHighAccuracy, timeout, maximumAge: 0 });
    return { lat: coords.latitude, lng: coords.longitude, precisionM: coords.accuracy };
  },
};

export const DISPOSITIVO = new InjectionToken<Dispositivo>('DISPOSITIVO', {
  providedIn: 'root',
  factory: () => dispositivo,
});
