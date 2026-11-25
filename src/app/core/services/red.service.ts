import { inject, Injectable, InjectionToken } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { type ConnectionStatusChangeListener, Network, type NetworkPlugin } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';

export const NETWORK = new InjectionToken<Pick<NetworkPlugin, 'getStatus' | 'addListener'>>('NETWORK', {
  providedIn: 'root',
  // Objeto propio: Angular llamaría a `ngOnDestroy` en el proxy de Capacitor.
  factory: () => ({
    getStatus: () => Network.getStatus(),
    addListener: (evento: 'networkStatusChange', f: ConnectionStatusChangeListener) => Network.addListener(evento, f),
  }),
});

/** Estado de la conexión (ADR-001 y ADR-006). */
@Injectable({ providedIn: 'root' })
export class RedService {
  private readonly plugin = inject(NETWORK);

  readonly enLinea$ = new BehaviorSubject(true);
  readonly enLinea = toSignal(this.enLinea$, { requireSync: true });

  async iniciar(): Promise<void> {
    try {
      await this.plugin.addListener('networkStatusChange', (e) => this.enLinea$.next(e.connected));
      this.enLinea$.next((await this.plugin.getStatus()).connected);
    } catch {
      // Sin el plugin se supone que hay red: si no la hay, la petición fallará con `RED`.
    }
  }
}
