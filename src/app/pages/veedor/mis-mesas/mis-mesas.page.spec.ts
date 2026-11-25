import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ActasService } from '../../../core/services/actas.service';
import { RedService } from '../../../core/services/red.service';
import { SyncService } from '../../../core/services/sync.service';

import { MisMesasPage } from './mis-mesas.page';

describe('MisMesasPage: conflictos a la vista (R10)', () => {
  const conflictos = signal<unknown[]>([]);

  const texto = async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActasService,
          useValue: { misMesas: signal({ fase: 'exito', datos: [], error: null }), cargarMisMesas: vi.fn() },
        },
        { provide: RedService, useValue: { enLinea: signal(true) } },
        { provide: SyncService, useValue: { conflictos, enviadas: signal(0), espera: () => false } },
      ],
    });
    const f = TestBed.createComponent(MisMesasPage);
    await f.whenStable();
    return (f.nativeElement as HTMLElement).textContent;
  };

  it('avisa cuántas actas están en conflicto', async () => {
    conflictos.set([{}, {}]);
    expect(await texto()).toContain('2 acta(s) en conflicto');
  });

  it('sin conflictos no avisa', async () => {
    conflictos.set([]);
    expect(await texto()).not.toContain('en conflicto');
  });
});
