import { errorDe } from './supabase.client';

describe('errorDe', () => {
  it.each([0, 502, 503, 504])('%s: sin servicio, se trata como falta de red', (estado) => {
    expect(errorDe(estado).codigo).toBe('RED');
  });

  it('un 500 no se confunde con la red: una sola acta detendría la cola', () => {
    expect(errorDe(500).codigo).toBe('INTERNO');
  });

  it('conserva los códigos del servidor', () => {
    expect(errorDe(400, 'CONFLICTO').codigo).toBe('CONFLICTO');
    expect(errorDe(401).codigo).toBe('SESION');
    expect(errorDe(403).codigo).toBe('NO_AUTORIZADO');
  });
});
