/** Valor inicial; se calibra con fotos reales en el teléfono (D8). */
export const UMBRAL_NITIDEZ = 100;
/** La medida depende del tamaño: todas las fotos se miden a este ancho. */
export const ANCHO_MEDICION = 640;

/**
 * Varianza del Laplaciano. El Laplaciano responde a los bordes; una foto borrosa
 * los tiene suaves, así que sus valores apenas varían.
 */
export function varianzaLaplaciano(gris: ArrayLike<number>, ancho: number, alto: number): number {
  let n = 0;
  let suma = 0;
  let cuadrados = 0;
  for (let y = 1; y < alto - 1; y++) {
    for (let x = 1; x < ancho - 1; x++) {
      const i = y * ancho + x;
      const l = gris[i - ancho] + gris[i + ancho] + gris[i - 1] + gris[i + 1] - 4 * gris[i];
      suma += l;
      cuadrados += l * l;
      n++;
    }
  }
  return n ? cuadrados / n - (suma / n) ** 2 : 0;
}
