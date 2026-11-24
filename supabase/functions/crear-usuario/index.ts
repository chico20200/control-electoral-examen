import { admin, anonimo, CLAVE_INICIAL, usuarioDe } from '../_shared/cuentas.ts';
import { esCedulaValida } from '../_shared/cedula.ts';
import { atender, Fallo, json } from '../_shared/respuesta.ts';

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

atender(async (c, req) => {
  const { id: autor } = await usuarioDe(req);
  const { data: perfil, error } = await admin
    .from('perfiles')
    .select('rol, recinto_id, debe_cambiar_clave')
    .eq('id', autor)
    .maybeSingle();
  if (error) throw error;
  if (!perfil || perfil.debe_cambiar_clave || perfil.rol === 'veedor') throw new Fallo(403, 'NO_AUTORIZADO');

  // Rol y recinto salen de quien llama, nunca del cuerpo (salvo el recinto que elige el provincial).
  const rol = perfil.rol === 'provincial' ? 'recinto' : 'veedor';
  const recinto = perfil.rol === 'provincial' ? texto(c.recintoId) : perfil.recinto_id;
  const datos = {
    cedula: texto(c.cedula),
    nombres: texto(c.nombres),
    apellidos: texto(c.apellidos),
    telefono: texto(c.telefono),
    correo: texto(c.correo).toLowerCase(),
  };
  if (
    !esCedulaValida(datos.cedula) ||
    !datos.nombres ||
    !datos.apellidos ||
    !/^0\d{9}$/.test(datos.telefono) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo) ||
    !UUID.test(recinto)
  )
    throw new Fallo(400, 'DATOS');

  const alta = await admin.auth.admin.createUser({
    email: datos.correo,
    password: CLAVE_INICIAL,
    email_confirm: false,
  });
  if (alta.error) {
    if (alta.error.code === 'email_exists') throw new Fallo(409, 'DUPLICADO');
    if (alta.error.code === 'email_address_invalid' || alta.error.code === 'validation_failed')
      throw new Fallo(400, 'DATOS');
    throw alta.error;
  }
  const id = alta.data.user.id;

  try {
    const ins = await admin.from('perfiles').insert({ id, ...datos, rol, recinto_id: recinto });
    if (ins.error?.code === '23505') {
      throw new Fallo(409, ins.error.message.includes('un_coordinador_por_recinto') ? 'RECINTO_OCUPADO' : 'DUPLICADO');
    }
    if (ins.error?.code === '23503') throw new Fallo(400, 'DATOS');
    if (ins.error) throw ins.error;

    const envio = await anonimo().auth.resend({ type: 'signup', email: datos.correo });
    if (envio.error) {
      console.error('confirmación', envio.error);
      throw new Fallo(502, 'CORREO');
    }
  } catch (e) {
    await admin.auth.admin.deleteUser(id); // borra también el perfil en cascada
    throw e;
  }
  return json({ id }, 201);
});
