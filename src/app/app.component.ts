import { Component, effect, inject, untracked } from '@angular/core';
import { IonApp, IonRouterOutlet, NavController } from '@ionic/angular';

import { AuthService } from './core/services/auth.service';
import { SyncService } from './core/services/sync.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    const { perfil } = inject(AuthService);
    const nav = inject(NavController);
    const sync = inject(SyncService);
    let habiaSesion = false;
    sync.iniciar();
    // Al cerrarse la sesión, por el usuario o por el servidor, se vuelve al login.
    effect(() => {
      const hay = perfil() !== null;
      if (habiaSesion && !hay) void nav.navigateRoot('/login');
      habiaSesion = hay;
      // Al entrar, se envía lo que este usuario dejó en el teléfono.
      void untracked(() => sync.sincronizar()).catch(() => undefined);
    });
  }
}
