import { correoDe, iniciar } from '../_shared/cuentas.ts';
import { atender, Fallo, json } from '../_shared/respuesta.ts';

atender(async ({ cedula, clave }) => {
  if (typeof clave !== 'string' || !clave) throw new Fallo(400, 'DATOS');
  // Con cédula inexistente se responde igual que con clave errónea.
  const correo = (await correoDe(cedula)) ?? 'inexistente@invalid.local';
  return json(await iniciar(correo, clave));
});
