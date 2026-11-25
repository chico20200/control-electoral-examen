import { TestBed } from '@angular/core/testing';

import { NETWORK, RedService } from './red.service';

describe('RedService (R10)', () => {
  const plugin = { getStatus: vi.fn(), addListener: vi.fn() };
  let avisar: (e: { connected: boolean }) => void;
  let red: RedService;

  beforeEach(() => {
    plugin.getStatus.mockReset().mockResolvedValue({ connected: false });
    plugin.addListener.mockReset().mockImplementation(async (_, f) => (avisar = f));
    TestBed.configureTestingModule({ providers: [{ provide: NETWORK, useValue: plugin }] });
    red = TestBed.inject(RedService);
  });

  it('parte del estado real y sigue los cambios', async () => {
    await red.iniciar();
    expect(red.enLinea()).toBe(false);
    avisar({ connected: true });
    expect(red.enLinea()).toBe(true);
    expect(red.enLinea$.value).toBe(true);
  });

  it('si el plugin falla, supone que hay red y no impide abrir la app', async () => {
    plugin.getStatus.mockRejectedValue(new Error('x'));
    await red.iniciar();
    expect(red.enLinea()).toBe(true);
  });
});
