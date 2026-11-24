const cabeceras = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Error esperado: se envía al cliente como {error: codigo}. */
export class Fallo extends Error {
  constructor(
    public estado: number,
    public codigo: string,
  ) {
    super(codigo);
  }
}

export function json(datos: unknown, estado = 200): Response {
  return Response.json(datos, { status: estado, headers: cabeceras });
}

/** Atiende POST con JSON; los errores inesperados no revelan detalles. */
export function atender(manejar: (cuerpo: Record<string, unknown>, req: Request) => Promise<Response>): void {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cabeceras });
    if (req.method !== 'POST') return json({ error: 'METODO' }, 405);
    try {
      const cuerpo = await req.json().catch(() => null);
      return await manejar(cuerpo && typeof cuerpo === 'object' ? cuerpo : {}, req);
    } catch (e) {
      if (e instanceof Fallo) return json({ error: e.codigo }, e.estado);
      console.error(e);
      return json({ error: 'INTERNO' }, 500);
    }
  });
}
