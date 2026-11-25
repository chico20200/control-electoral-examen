/** Error con un código que la interfaz sabe traducir. */
export class ErrorApp extends Error {
  constructor(public readonly codigo: string) {
    super(codigo);
  }
}
