import { inject, Injectable } from '@angular/core';

import type { FotoActa, Ubicacion } from '../models';
import { ErrorApp } from '../models/error-app';

import { DISPOSITIVO } from './dispositivo';
import { UMBRAL_NITIDEZ, varianzaLaplaciano } from './nitidez';

// Sin red el GPS no recibe ayuda y tarda más.
const ESPERA_GPS_MS = 30000;

const codigoDe = (e: unknown) => (e as { code?: unknown } | null)?.code;

/** Cámara y GPS con errores que el usuario puede entender (R7). */
@Injectable({ providedIn: 'root' })
export class CapturaService {
  private readonly dispositivo = inject(DISPOSITIVO);

  async foto(): Promise<FotoActa> {
    try {
      if (!(await this.dispositivo.permisoCamara())) throw new ErrorApp('CAMARA_DENEGADA');
      const imagen = await this.dispositivo.procesar(await this.dispositivo.tomarFoto());
      const nitidez = Math.round(varianzaLaplaciano(imagen.gris, imagen.ancho, imagen.alto));
      return { blob: imagen.blob, vistaPrevia: imagen.vistaPrevia, nitidez, aceptable: nitidez >= UMBRAL_NITIDEZ };
    } catch (e) {
      if (e instanceof ErrorApp) throw e;
      if (codigoDe(e) === 'OS-PLUG-CAMR-0003') throw new ErrorApp('CAMARA_DENEGADA');
      if (codigoDe(e) === 'OS-PLUG-CAMR-0006') throw new ErrorApp('CAMARA_CANCELADA');
      throw new ErrorApp('CAMARA_NO_DISPONIBLE');
    }
  }

  async ubicacion(): Promise<Ubicacion> {
    try {
      const permiso = await this.dispositivo.permisoUbicacion();
      if (permiso === 'denegada') throw new ErrorApp('GPS_DENEGADO');
      return await this.dispositivo.posicion(permiso === 'precisa', ESPERA_GPS_MS);
    } catch (e) {
      if (e instanceof ErrorApp) throw e;
      // 1 es «denegado» en el navegador; el otro, en el plugin de Android.
      const denegado = codigoDe(e) === 1 || codigoDe(e) === 'OS-PLUG-GLOC-0003';
      throw new ErrorApp(denegado ? 'GPS_DENEGADO' : 'GPS_NO_DISPONIBLE');
    }
  }
}
