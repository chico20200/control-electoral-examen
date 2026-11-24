begin;
create extension if not exists pgtap with schema extensions;
select plan(36);

-- Datos: recintos R1 y R2; mesas A (R1) y B (R2) con un veedor cada una.
create function pg_temp.como(u text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

insert into recintos(id, provincia, canton, parroquia, nombre, num_jrv) values
  ('10000000-0000-0000-0000-000000000001','Pichincha','Quito','P1','Prueba R1',2),
  ('10000000-0000-0000-0000-000000000002','Pichincha','Quito','P2','Prueba R2',2);

insert into auth.users(id, email) select ('20000000-0000-0000-0000-00000000000'||n)::uuid, 'u'||n||'@prueba.local'
from generate_series(1,7) n;

insert into perfiles(id, cedula, nombres, apellidos, telefono, correo, rol, recinto_id, debe_cambiar_clave)
select ('20000000-0000-0000-0000-00000000000'||n)::uuid, '900000000'||n, 'N', 'A', '0990000000', 'u'||n||'@prueba.local', rol,
  case when r is null then null else ('10000000-0000-0000-0000-00000000000'||r)::uuid end, n = 6
from (values (1,'provincial',null),(2,'recinto',1),(3,'recinto',2),(4,'veedor',1),(5,'veedor',2),(6,'veedor',1),(7,'veedor',1)) v(n,rol,r);

-- ids fijos para poder nombrar las mesas
update jrvs set id='30000000-0000-0000-0000-00000000000a', veedor_id='20000000-0000-0000-0000-000000000004'
 where recinto_id='10000000-0000-0000-0000-000000000001' and numero=1;
update jrvs set id='30000000-0000-0000-0000-00000000000c', veedor_id='20000000-0000-0000-0000-000000000006'
 where recinto_id='10000000-0000-0000-0000-000000000001' and numero=2;
update jrvs set id='30000000-0000-0000-0000-00000000000b', veedor_id='20000000-0000-0000-0000-000000000005'
 where recinto_id='10000000-0000-0000-0000-000000000002' and numero=1;

insert into storage.objects(bucket_id, name) values
 ('actas','10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-00000000000a/alcalde/f.jpg'),
 ('actas','10000000-0000-0000-0000-000000000002/30000000-0000-0000-0000-00000000000b/alcalde/f.jpg');

-- Acta de ejemplo: votos 10,20,30,40,50 + blancos 5 + nulos 5
create function pg_temp.acta(mesa text, op int, base int, total int default 160, primero int default 10) returns jsonb
language sql as $$
  select jsonb_build_object(
    'jrv_id', '30000000-0000-0000-0000-00000000000'||mesa, 'dignidad','alcalde',
    'blancos',5,'nulos',5,'total_sufragantes',total,
    'foto_path', '10000000-0000-0000-0000-00000000000'||case mesa when 'b' then '2' else '1' end
      ||'/30000000-0000-0000-0000-00000000000'||mesa||'/alcalde/f.jpg',
    'lat',-0.18,'lng',-78.47,'precision_m',8,'capturada_en','2026-11-23T10:00:00Z',
    'version_base',base,'operacion_id','40000000-0000-0000-0000-'||lpad(op::text,12,'0'),
    'votos',(select jsonb_object_agg(id, case when n=1 then primero else n*10 end)
             from (select id, row_number() over (order by id) n from public.candidaturas where dignidad='alcalde') c))
$$;

reset role;
select is((select count(*)::int from recintos where nombre not like 'Prueba%'), 6, 'R1: seis recintos precargados');
select is((select count(*)::int from organizaciones), 5, 'R1: cinco organizaciones');
select is((select array_agg(c order by c) from (select count(*)::int c from candidaturas group by dignidad) x), array[5,5], 'R1: cinco candidaturas por dignidad');
select is((select count(*)::int from jrvs where recinto_id='10000000-0000-0000-0000-000000000001'), 2, 'crear recinto genera sus JRV');
select throws_ok($$insert into perfiles select gen_random_uuid(), '9999999999','a','b','0','x@x','recinto','10000000-0000-0000-0000-000000000001',true$$, '23505', null, 'un solo coordinador por recinto');
select pg_temp.como('20000000-0000-0000-0000-000000000005');
select guardar_acta(pg_temp.acta('b',1,0));

select pg_temp.como('20000000-0000-0000-0000-000000000004');

select is((select array_agg(id::text) from jrvs), array['30000000-0000-0000-0000-00000000000a'], 'R8: veedor A solo ve su mesa');
select is((select count(*)::int from jrvs where id='30000000-0000-0000-0000-00000000000b'), 0, 'R8: veedor A no ve la mesa de B');
select is((select count(*)::int from actas), 0, 'R8: veedor A no ve actas de B');
select is((select count(*)::int from votos), 0, 'R8: veedor A no ve votos de B');
select is((select count(*)::int from storage.objects where name like '%00000b/%'), 0, 'R8: veedor A no ve la foto de B');
select is((select count(*)::int from storage.objects where bucket_id='actas'), 1, 'veedor A ve la foto de su mesa');
select throws_ok($$select guardar_acta(pg_temp.acta('b',2,1))$$, 'NO_AUTORIZADO', 'R8: veedor A no escribe la mesa de B');
select throws_ok($$insert into storage.objects(bucket_id,name) values('actas','10000000-0000-0000-0000-000000000002/30000000-0000-0000-0000-00000000000b/alcalde/x.jpg')$$, '42501', null, 'R8: veedor A no sube fotos a la mesa de B');
select lives_ok($$insert into storage.objects(bucket_id,name) values('actas','10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-00000000000a/alcalde/x.jpg')$$, 'veedor A sube fotos a su mesa');
select throws_ok($$insert into storage.objects(bucket_id,name) values('actas','10000000-0000-0000-0000-000000000002/30000000-0000-0000-0000-00000000000a/alcalde/x.jpg')$$, '42501', null, 'la carpeta de recinto debe ser la de la mesa');
select throws_ok($$insert into actas(jrv_id) values('30000000-0000-0000-0000-00000000000a')$$, '42501', null, 'sin escritura directa en actas');
select throws_ok($$update perfiles set rol='provincial', debe_cambiar_clave=false$$, '42501', null, 'nadie cambia su propio rol');
select throws_ok($$update jrvs set veedor_id='20000000-0000-0000-0000-000000000004'$$, '42501', null, 'el veedor no se asigna mesas');
select throws_ok($$select asignar_veedor('30000000-0000-0000-0000-00000000000b','20000000-0000-0000-0000-000000000004')$$, 'NO_AUTORIZADO', 'el veedor no usa asignar_veedor');
select throws_ok($$insert into recintos(provincia,canton,parroquia,nombre,num_jrv) values('a','b','c','d',1)$$, '42501', null, 'el veedor no crea recintos');
select is((select count(*)::int from perfiles), 1, 'el veedor solo ve su perfil');

select pg_temp.como('20000000-0000-0000-0000-000000000002');

select is((select count(*)::int from jrvs), 2, 'coordinador ve las mesas de su recinto');
select is((select count(*)::int from actas), 0, 'coordinador no ve actas de otro recinto');
select is((select count(*)::int from recintos), 1, 'coordinador ve solo su recinto');
select throws_ok($$select guardar_acta(pg_temp.acta('b',3,1))$$, 'NO_AUTORIZADO', 'coordinador no corrige otro recinto');
select throws_ok($$select asignar_veedor('30000000-0000-0000-0000-00000000000a','20000000-0000-0000-0000-000000000005')$$, 'NO_AUTORIZADO', 'no asigna veedores de otro recinto');
select lives_ok($$select asignar_veedor('30000000-0000-0000-0000-00000000000a','20000000-0000-0000-0000-000000000007')$$, 'reasigna un veedor propio');

select pg_temp.como('20000000-0000-0000-0000-000000000004');

select is((select count(*)::int from jrvs), 0, 'el veedor reasignado pierde la mesa');
select throws_ok($$select guardar_acta(pg_temp.acta('a',4,0))$$, 'NO_AUTORIZADO', 'el veedor reasignado ya no escribe');

select pg_temp.como('20000000-0000-0000-0000-000000000006');

select is((select count(*)::int from jrvs)+(select count(*)::int from candidaturas), 0, 'R3: sin cambiar la clave no ve datos');
select is((select count(*)::int from perfiles), 1, 'R3: pero sí su propio perfil');
select throws_ok($$select guardar_acta(pg_temp.acta('c',5,0))$$, 'NO_AUTORIZADO', 'R3: sin cambiar la clave no escribe');

select pg_temp.como('20000000-0000-0000-0000-000000000001');

select is((select count(*)::int from actas), 1, 'provincial ve todas las actas');
select throws_ok($$select guardar_acta(pg_temp.acta('b',6,1))$$, 'NO_AUTORIZADO', 'provincial no edita actas');
select lives_ok($$insert into recintos(provincia,canton,parroquia,nombre,num_jrv) values('Pichincha','Quito','P','Prueba R3',3)$$, 'provincial crea recintos');
reset role; set local role anon;
select throws_ok($$select * from recintos$$, '42501', null, 'anónimo no lee nada');

select * from finish();
rollback;
