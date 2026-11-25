import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ResultadosService } from '../../../core/services/resultados.service';

import { DashboardPage } from './dashboard.page';

describe('DashboardPage (R4)', () => {
  it('muestra votos y porcentaje, y cambia el filtro por recinto y dignidad', () => {
    const filtro = signal({ dignidad: 'alcalde', recintoId: null as string | null });
    const servicio = {
      filtro,
      totalVotos: signal(8),
      resultados: signal({
        fase: 'exito',
        datos: [{ candidaturaId: 'a', candidato: 'Ana', organizacion: 'Org', votos: 2, porcentaje: 25 }],
        error: null,
      }),
      avance: signal({ fase: 'exito', datos: [{ recintoId: 'r1', recinto: 'Uno' }], error: null }),
      cargar: vi.fn(),
    };
    TestBed.configureTestingModule({ providers: [{ provide: ResultadosService, useValue: servicio }] });
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent;
    expect(texto).toContain('Ana');
    expect(texto).toContain('25.0 %');
    fixture.componentInstance.filtrar({ recintoId: 'r1' });
    fixture.componentInstance.filtrar({ dignidad: 'prefecto' });
    expect(filtro()).toEqual({ dignidad: 'prefecto', recintoId: 'r1' });
  });
});
