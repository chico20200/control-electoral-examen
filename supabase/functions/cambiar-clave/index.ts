import { fijarClave, usuarioDe, validarClaveNueva } from '../_shared/cuentas.ts';
import { atender, json } from '../_shared/respuesta.ts';

atender(async ({ nueva }, req) => {
  const { id, correo, token } = await usuarioDe(req);
  return json(await fijarClave(id, correo, token, validarClaveNueva(nueva)));
});
