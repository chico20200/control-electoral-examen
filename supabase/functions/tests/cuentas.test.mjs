// Pruebas de integración contra Supabase LOCAL (R2, R3).
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  execSync('npx supabase status -o env', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString().split('\n').filter((l) => /^[A-Z_0-9]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]),
);
assert.match(env.API_URL, /127\.0\.0\.1|localhost/, 'estas pruebas solo corren en local');

const opciones = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(env.API_URL, env.SERVICE_ROLE_KEY, opciones);
const anonimo = () => createClient(env.API_URL, env.ANON_KEY, opciones);
const conSesion = (token) =>
  createClient(env.API_URL, env.ANON_KEY, { ...opciones, global: { headers: { Authorization: `Bearer ${token}` } } });

const marca = Date.now().toString(36);
let secuencia = Math.floor(Math.random() * 900000);
function cedula() {
  const base = '171' + String(secuencia++ % 1000000).padStart(6, '0');
  const suma = [...base].reduce((s, d, i) => {
    const n = Number(d) * (i % 2 ? 1 : 2);
    return s + (n > 9 ? n - 9 : n);
  }, 0);
  return base + ((10 - (suma % 10)) % 10);
}
const persona = (alias) => ({
  cedula: cedula(), nombres: 'Ana', apellidos: 'Prueba', telefono: '0991234567', correo: `${alias}.${marca}@prueba.local`,
});

async function llamar(funcion, cuerpo, token) {
  const r = await fetch(`${env.API_URL}/functions/v1/${funcion}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: env.ANON_KEY, ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(cuerpo),
  });
  return { estado: r.status, datos: await r.json() };
}

/** Espera el último correo de un destinatario con cierto asunto. */
async function correo(destino, asunto) {
  for (let i = 0; i < 40; i++) {
    const { messages } = await (await fetch(`${env.MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${destino}`)}`)).json();
    const m = messages.find((x) => x.Subject.includes(asunto));
    if (m) return (await fetch(`${env.MAILPIT_URL}/api/v1/message/${m.ID}`)).json();
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`sin correo "${asunto}" para ${destino}`);
}
const buzonVacio = async (destino) =>
  (await (await fetch(`${env.MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${destino}`)}`)).json()).messages.length === 0;

const ids = [];
let recintoA, recintoB, provincial, coordinador, veedor, tokenProvincial, tokenCoordinador, tokenVeedor;

async function crear(datos, token) {
  const r = await llamar('crear-usuario', datos, token);
  assert.equal(r.estado, 201, JSON.stringify(r.datos));
  ids.push(r.datos.id);
  return r;
}
async function confirmar(destino) {
  const m = await correo(destino, 'Confirma');
  const enlace = m.HTML.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&');
  const r = await fetch(enlace, { redirect: 'manual' });
  assert.equal(r.status, 303);
  return r.headers.get('location');
}

before(async () => {
  const { data, error } = await admin.from('recintos').insert(
    ['A', 'B'].map((n) => ({ provincia: 'Pichincha', canton: 'Quito', parroquia: 'Prueba', nombre: `${n}-${marca}`, num_jrv: 1 })),
  ).select();
  assert.ifError(error);
  [recintoA, recintoB] = data.map((r) => r.id);
  provincial = persona('provincial');
  const u = await admin.auth.admin.createUser({ email: provincial.correo, password: 'Ecuador2026', email_confirm: true });
  assert.ifError(u.error);
  ids.push(u.data.user.id);
  const p = await admin.from('perfiles').insert({ id: u.data.user.id, ...provincial, rol: 'provincial' });
  assert.ifError(p.error);
});
after(async () => {
  for (const id of ids) await admin.auth.admin.deleteUser(id);
  await admin.from('recintos').delete().in('id', [recintoA, recintoB]);
});

test('R2: el autorregistro público está cerrado', async () => {
  const { error } = await anonimo().auth.signUp({ email: `intruso.${marca}@prueba.local`, password: 'Clave12345' });
  assert.equal(error?.code, 'signup_disabled');
});

test('R3: credenciales malas responden igual exista o no la cédula', async () => {
  const mala = await llamar('login', { cedula: provincial.cedula, clave: 'incorrecta' });
  const inexistente = await llamar('login', { cedula: cedula(), clave: 'incorrecta' });
  assert.deepEqual([mala.estado, mala.datos], [401, { error: 'CREDENCIALES' }]);
  assert.deepEqual(inexistente, mala);
});

test('R3: cuerpo mal formado da 400, no 500', async () => {
  assert.equal((await llamar('login', { cedula: 5 })).estado, 400);
  assert.equal((await llamar('crear-usuario', null)).estado, 401);
});

test('R3: primer acceso obliga a cambiar la clave', async () => {
  const s = await llamar('login', { cedula: provincial.cedula, clave: 'Ecuador2026' });
  assert.equal(s.estado, 200);
  const token = s.datos.access_token;
  assert.equal((await conSesion(token).from('recintos').select()).data.length, 0, 'bloqueado antes del cambio');
  assert.equal((await llamar('crear-usuario', { ...persona('x'), recintoId: recintoA }, token)).estado, 403);
  for (const nueva of ['Ecuador2026', 'corta12', 12345678]) {
    assert.equal((await llamar('cambiar-clave', { nueva }, token)).estado, 400);
  }
  assert.equal((await llamar('cambiar-clave', { nueva: 'NuevaClave1' })).estado, 401, 'sin sesión');
  const c = await llamar('cambiar-clave', { nueva: 'NuevaClave1' }, token);
  assert.equal(c.estado, 200);
  tokenProvincial = c.datos.access_token;
  assert.ok(c.datos.refresh_token);
  const { data } = await admin.from('perfiles').select('debe_cambiar_clave').eq('cedula', provincial.cedula).single();
  assert.equal(data.debe_cambiar_clave, false);
  assert.ok((await conSesion(tokenProvincial).from('recintos').select()).data.length > 0);
  assert.equal((await llamar('login', { cedula: provincial.cedula, clave: 'Ecuador2026' })).estado, 401, 'la inicial ya no sirve');
});

test('R2: provincial crea coordinador, con validaciones', async () => {
  coordinador = persona('coordinador');
  const invalidos = [
    { cedula: '1710034066' }, { nombres: '  ' }, { apellidos: '' }, { telefono: '12' }, { correo: 'nada' }, { recintoId: 'x' },
    { recintoId: crypto.randomUUID() },
  ];
  for (const cambio of invalidos) {
    const r = await llamar('crear-usuario', { ...coordinador, recintoId: recintoA, ...cambio }, tokenProvincial);
    assert.equal(r.estado, 400, JSON.stringify(cambio));
  }
  const r = await crear({ ...coordinador, recintoId: recintoA }, tokenProvincial);
  const { data } = await admin.from('perfiles').select().eq('id', r.datos.id).single();
  assert.deepEqual([data.rol, data.recinto_id, data.debe_cambiar_clave], ['recinto', recintoA, true]);
});

test('R2: duplicados y recinto ocupado no dejan cuentas a medias', async () => {
  const otro = persona('otro');
  const ocupado = await llamar('crear-usuario', { ...otro, recintoId: recintoA }, tokenProvincial);
  assert.deepEqual([ocupado.estado, ocupado.datos.error], [409, 'RECINTO_OCUPADO']);
  for (const cambio of [{ cedula: coordinador.cedula }, { correo: coordinador.correo.toUpperCase() }]) {
    const r = await llamar('crear-usuario', { ...otro, recintoId: recintoB, ...cambio }, tokenProvincial);
    assert.deepEqual([r.estado, r.datos.error], [409, 'DUPLICADO']);
  }
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  assert.ok(!data.users.some((u) => u.email === otro.correo), 'el usuario de Auth se borró');
  assert.ok(await buzonVacio(otro.correo), 'no se avisa de una cuenta que no existe');
});

test('R2: la cuenta se confirma por correo antes de entrar', async () => {
  const antes = await llamar('login', { cedula: coordinador.cedula, clave: 'Ecuador2026' });
  assert.deepEqual([antes.estado, antes.datos.error], [403, 'SIN_CONFIRMAR']);
  const destino = await confirmar(coordinador.correo);
  assert.match(destino, /\/functions\/v1\/confirmado/);
  const pagina = await fetch(destino);
  assert.match(await pagina.text(), /Cuenta confirmada/);
  const s = await llamar('login', { cedula: coordinador.cedula, clave: 'Ecuador2026' });
  assert.equal(s.estado, 200);
  tokenCoordinador = (await llamar('cambiar-clave', { nueva: 'ClaveCoord1' }, s.datos.access_token)).datos.access_token;
});

test('R2: coordinador crea veedores solo en su recinto; veedor no crea a nadie', async () => {
  veedor = persona('veedor');
  const r = await crear({ ...veedor, recintoId: recintoB, rol: 'provincial' }, tokenCoordinador);
  const { data } = await admin.from('perfiles').select().eq('id', r.datos.id).single();
  assert.deepEqual([data.rol, data.recinto_id], ['veedor', recintoA], 'ignora rol y recinto enviados');
  await confirmar(veedor.correo);
  const s = await llamar('login', { cedula: veedor.cedula, clave: 'Ecuador2026' });
  tokenVeedor = (await llamar('cambiar-clave', { nueva: 'ClaveVeedor1' }, s.datos.access_token)).datos.access_token;
  const negado = await llamar('crear-usuario', persona('y'), tokenVeedor);
  assert.deepEqual([negado.estado, negado.datos.error], [403, 'NO_AUTORIZADO']);
});

test('R3: recuperación por código', async () => {
  const inexistente = cedula();
  assert.equal((await llamar('recuperar-clave', { cedula: inexistente })).estado, 200);
  assert.equal((await llamar('recuperar-clave', { cedula: veedor.cedula })).estado, 200);
  const m = await correo(veedor.correo, 'Recupera');
  const codigo = m.Text.match(/\b\d{6}\b/)[0];
  const malo = await llamar('recuperar-clave', { cedula: veedor.cedula, codigo: codigo === '000000' ? '000001' : '000000', nueva: 'OtraClave99' });
  assert.deepEqual([malo.estado, malo.datos.error], [400, 'CODIGO']);
  const debil = await llamar('recuperar-clave', { cedula: veedor.cedula, codigo, nueva: 'Ecuador2026' });
  assert.deepEqual([debil.estado, debil.datos.error], [400, 'CLAVE_DEBIL']);
  const bien = await llamar('recuperar-clave', { cedula: veedor.cedula, codigo, nueva: 'OtraClave99' });
  assert.equal(bien.estado, 200, 'una clave débil no gasta el código');
  assert.ok(bien.datos.access_token);
  assert.equal((await llamar('login', { cedula: veedor.cedula, clave: 'OtraClave99' })).estado, 200);
  assert.equal((await llamar('login', { cedula: veedor.cedula, clave: 'ClaveVeedor1' })).estado, 401);
  const reuso = await llamar('recuperar-clave', { cedula: veedor.cedula, codigo, nueva: 'OtraClave100' });
  assert.equal(reuso.estado, 400, 'el código es de un solo uso');
});
