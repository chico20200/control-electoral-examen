import { TestBed } from '@angular/core/testing';

import { EstadoVistaComponent } from './estado-vista.component';

describe('EstadoVistaComponent (R9)', () => {
  const crear = (estado: object) => {
    const fixture = TestBed.createComponent(EstadoVistaComponent);
    fixture.componentRef.setInput('estado', { datos: null, error: null, ...estado });
    fixture.detectChanges();
    return { fixture, html: fixture.nativeElement as HTMLElement };
  };

  it('cargando: muestra el indicador', () => {
    expect(crear({ fase: 'cargando' }).html.querySelector('ion-spinner')).toBeTruthy();
  });

  it('error: muestra el mensaje y permite reintentar', () => {
    const { fixture, html } = crear({ fase: 'error', error: 'Sin conexión' });
    const reintentos = vi.fn();
    fixture.componentInstance.reintentar.subscribe(reintentos);
    expect(html.textContent).toContain('Sin conexión');
    html.querySelector('ion-button')!.click();
    expect(reintentos).toHaveBeenCalledTimes(1);
  });

  it('éxito sin datos: muestra el texto de vacío', () => {
    expect(crear({ fase: 'exito', datos: [] }).html.textContent).toContain('No hay datos');
  });

  it('éxito con datos: no muestra nada', () => {
    expect(crear({ fase: 'exito', datos: [1] }).html.textContent?.trim()).toBe('');
  });
});
