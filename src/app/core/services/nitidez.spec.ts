import { UMBRAL_NITIDEZ, varianzaLaplaciano } from './nitidez';

const imagen = (ancho: number, alto: number, f: (x: number, y: number) => number) =>
  Uint8ClampedArray.from({ length: ancho * alto }, (_, i) => f(i % ancho, Math.floor(i / ancho)));

/** Promedio con los vecinos: simula una foto movida. */
const desenfocar = (g: Uint8ClampedArray, ancho: number, alto: number) =>
  imagen(ancho, alto, (x, y) => {
    let suma = 0;
    let n = 0;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const i = (y + dy) * ancho + x + dx;
        if (x + dx >= 0 && x + dx < ancho && y + dy >= 0 && y + dy < alto) {
          suma += g[i];
          n++;
        }
      }
    return suma / n;
  });

describe('varianzaLaplaciano (R7)', () => {
  it('una imagen uniforme vale 0', () => {
    expect(
      varianzaLaplaciano(
        imagen(20, 20, () => 128),
        20,
        20,
      ),
    ).toBe(0);
  });

  it('un degradado suave vale 0: no tiene bordes', () => {
    expect(
      varianzaLaplaciano(
        imagen(20, 20, (x) => x * 5),
        20,
        20,
      ),
    ).toBe(0);
  });

  it('un tablero de ajedrez supera el umbral', () => {
    const tablero = imagen(20, 20, (x, y) => ((x + y) % 2 ? 255 : 0));
    expect(varianzaLaplaciano(tablero, 20, 20)).toBeGreaterThan(UMBRAL_NITIDEZ);
  });

  it('la misma imagen desenfocada baja del umbral', () => {
    const texto = imagen(60, 60, (x, y) => ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? 200 : 60));
    expect(varianzaLaplaciano(texto, 60, 60)).toBeGreaterThan(UMBRAL_NITIDEZ);
    expect(varianzaLaplaciano(desenfocar(texto, 60, 60), 60, 60)).toBeLessThan(UMBRAL_NITIDEZ);
  });

  it('una imagen sin interior no es nítida', () => {
    expect(
      varianzaLaplaciano(
        imagen(2, 2, () => 9),
        2,
        2,
      ),
    ).toBe(0);
  });
});
