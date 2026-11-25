import { Component, effect, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, NavController } from '@ionic/angular';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    const { perfil } = inject(AuthService);
    const nav = inject(NavController);
    let habiaSesion = false;
    // Al cerrarse la sesión, por el usuario o por el servidor, se vuelve al login.
    effect(() => {
      const hay = perfil() !== null;
      if (habiaSesion && !hay) void nav.navigateRoot('/login');
      habiaSesion = hay;
    });
  }
}
