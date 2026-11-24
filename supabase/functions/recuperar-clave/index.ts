import { anonimo, correoDe, fijarClave, validarClaveNueva } from '../_shared/cuentas.ts';
import { atender, Fallo, json } from '../_shared/respuesta.ts';

atender(async ({ cedula, codigo, nueva }) => {
  const correo = await correoDe(cedula);

  if (codigo === undefined) {
    // En segundo plano: ni la respuesta ni su tiempo revelan si la cédula existe.
    if (correo) {
      // @ts-ignore EdgeRuntime lo aporta Supabase
      EdgeRuntime.waitUntil(
        anonimo()
          .auth.resetPasswordForEmail(correo)
          .then(({ error }) => {
            if (error) console.error('recuperar-clave', error);
          }),
      );
    }
    return json({ ok: true });
  }

  const clave = validarClaveNueva(nueva); // antes de gastar el código
  if (!correo || typeof codigo !== 'string') throw new Fallo(400, 'CODIGO');
  const { data, error } = await anonimo().auth.verifyOtp({ email: correo, token: codigo, type: 'recovery' });
  if (error?.status === 429) throw new Fallo(429, 'DEMASIADOS_INTENTOS');
  if (error || !data.session || !data.user) throw new Fallo(400, 'CODIGO');
  return json(await fijarClave(data.user.id, correo, data.session.access_token, clave));
});
