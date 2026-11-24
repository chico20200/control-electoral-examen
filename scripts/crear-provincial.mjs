// Alta del primer coordinador provincial. Uso local del administrador:
// SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... CEDULA=... NOMBRES=... APELLIDOS=... TELEFONO=... CORREO=... node scripts/crear-provincial.mjs
import { createClient } from '@supabase/supabase-js';

const nombres = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CEDULA', 'NOMBRES', 'APELLIDOS', 'TELEFONO', 'CORREO'];
const faltan = nombres.filter((n) => !process.env[n]);
if (faltan.length) {
  console.error('Faltan variables:', faltan.join(', '));
  process.exit(1);
}
const e = process.env;
const admin = createClient(e.SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const correo = e.CORREO.toLowerCase();

const alta = await admin.auth.admin.createUser({ email: correo, password: 'Ecuador2026', email_confirm: true });
if (alta.error) throw alta.error;
const { error } = await admin.from('perfiles').insert({
  id: alta.data.user.id, cedula: e.CEDULA, nombres: e.NOMBRES, apellidos: e.APELLIDOS,
  telefono: e.TELEFONO, correo, rol: 'provincial',
});
if (error) {
  await admin.auth.admin.deleteUser(alta.data.user.id);
  throw error;
}
console.log('Coordinador provincial creado. Contraseña inicial: Ecuador2026 (cambio obligatorio).');
