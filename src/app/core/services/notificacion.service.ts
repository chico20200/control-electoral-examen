import { inject, Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

import { mensajeDe } from './mensajes';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly toasts = inject(ToastController);
  private readonly alertas = inject(AlertController);

  exito(mensaje: string): Promise<void> {
    return this.mostrar(mensaje, 'success');
  }

  error(e: unknown): Promise<void> {
    return this.mostrar(mensajeDe(e), 'danger');
  }

  async confirmar(mensaje: string): Promise<boolean> {
    const alerta = await this.alertas.create({
      header: 'Confirmar',
      message: mensaje,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Aceptar', role: 'confirm' },
      ],
    });
    await alerta.present();
    return (await alerta.onDidDismiss()).role === 'confirm';
  }

  private async mostrar(message: string, color: string): Promise<void> {
    const toast = await this.toasts.create({ message, color, duration: 4000, position: 'top' });
    await toast.present();
  }
}
