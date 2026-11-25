import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { NotificacionService } from '../../../core/services/notificacion.service';
import { RecintosService } from '../../../core/services/recintos.service';
import { UsuariosService } from '../../../core/services/usuarios.service';

import { MesasPage } from './mesas.page';

describe('MesasPage (R5)', () => {
  it('permite corregir las actas registradas, no las pendientes', () => {
    const mesa = {
      id: 'm1',
      numero: 1,
      alcalde: true,
      prefecto: false,
      totales: { alcalde: 64, prefecto: null },
      veedorId: null,
      veedor: null,
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: RecintosService,
          useValue: { mesas: signal({ fase: 'exito', datos: [mesa], error: null }), cargarMesas: vi.fn() },
        },
        {
          provide: UsuariosService,
          useValue: { veedores: signal({ fase: 'exito', datos: [], error: null }), cargarVeedores: vi.fn() },
        },
        { provide: NotificacionService, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(MesasPage);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    const enlaces = fixture.debugElement.queryAll(By.directive(RouterLink)).map((e) => e.injector.get(RouterLink));
    expect(enlaces.map((e) => e.urlTree?.toString())).toEqual(['/recinto/mesas/m1/alcalde']);
    expect(raiz.querySelector('ion-button')?.textContent?.trim()).toBe('Corregir alcalde');
    expect(raiz.textContent).toContain('Alcalde: 64 sufragantes');
    expect(raiz.textContent?.match(/sufragantes/g)).toHaveLength(1);
    expect(raiz.querySelector('ion-badge')?.textContent?.trim()).toBe('Prefecto: pendiente');
  });
});
