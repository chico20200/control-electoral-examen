// Crea o reinicia una cuenta por rol en Supabase LOCAL, con la clave inicial.
// Uso: node scripts/cuentas-prueba-local.mjs
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const entorno = Object.fromEntries(
  execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\n')
    .map((l) => l.match(/^(\w+)="(.*)"$/)?.slice(1))
    .filter(Boolean),
);
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(entorno.API_URL ?? '')) {
  console.error('Solo para Supabase local. ¿Está activo? npx supabase start');
  process.exit(1);
}
const admin = createClient(entorno.API_URL, entorno.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ok = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const recinto = ok(await admin.from('recintos').select('id, nombre').order('nombre').limit(1).single());
const cuentas = [
  { cedula: '1710034065', nombres: 'Paula', rol: 'provincial', recinto_id: null },
  { cedula: '2410034066', nombres: 'Rosa', rol: 'recinto', recinto_id: recinto.id },
  { cedula: '3010034068', nombres: 'Víctor', rol: 'veedor', recinto_id: recinto.id },
];
for (const c of cuentas) {
  const correo = `${c.rol}@prueba.local`;
  const previa = ok(await admin.from('perfiles').select('id, correo').eq('cedula', c.cedula).maybeSingle());
  if (previa && previa.correo !== correo) throw new Error(`La cédula ${c.cedula} pertenece a otra cuenta; no se toca.`);
  if (previa) {
    ok(await admin.auth.admin.updateUserById(previa.id, { password: 'Ecuador2026' }));
    ok(await admin.from('perfiles').update({ debe_cambiar_clave: true }).eq('id', previa.id));
  } else {
    const { user } = ok(await admin.auth.admin.createUser({ email: correo, password: 'Ecuador2026', email_confirm: true }));
    const alta = await admin
      .from('perfiles')
      .insert({ ...c, id: user.id, apellidos: 'Prueba', telefono: '0991234567', correo });
    if (alta.error) {
      await admin.auth.admin.deleteUser(user.id);
      throw alta.error;
    }
  }
  console.log(c.rol.padEnd(11), c.cedula, correo);
}
console.log('Contraseña inicial: Ecuador2026. Recinto:', recinto.nombre);
