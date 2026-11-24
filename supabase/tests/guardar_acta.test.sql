begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

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

select pg_temp.como('20000000-0000-0000-0000-000000000004');

select is((guardar_acta(pg_temp.acta('a',1,0))->>'version')::int, 1, 'acta válida queda en versión 1');
select throws_ok($$select guardar_acta(pg_temp.acta('a',2,1,159))$$, 'TOTALES', 'total 159 no cuadra');
select throws_ok($$select guardar_acta(pg_temp.acta('a',3,1,149,-1))$$, 'P0001', 'VOTOS', 'cantidad negativa');
select throws_ok($$select guardar_acta(jsonb_set(pg_temp.acta('a',4,1),'{votos}',(select jsonb_object_agg(k,v) from (select k,v from jsonb_each(pg_temp.acta('a',4,1)->'votos') e(k,v) limit 4) x)))$$, 'P0001', 'VOTOS', 'faltan candidaturas');
select throws_ok($$select guardar_acta(pg_temp.acta('a',5,1) || '{"blancos":5.5}')$$, 'P0001', 'VOTOS', 'decimales');
select throws_ok($$select guardar_acta(pg_temp.acta('a',5,1) - 'nulos')$$, 'P0001', 'VOTOS', 'campo vacío');
select throws_ok($$select guardar_acta(pg_temp.acta('a',6,1) || '{"foto_path":"otra/foto.jpg"}')$$, 'FOTO', 'la foto debe ser de esta mesa y existir');
select is((guardar_acta(pg_temp.acta('a',1,0))->>'version')::int, 1, 'reintento con la misma operación devuelve la misma versión');
select is((select count(*)::int from actas), 1, 'el reintento no duplica');

select pg_temp.como('20000000-0000-0000-0000-000000000002');

select is((guardar_acta(pg_temp.acta('a',7,1,170,20))->>'version')::int, 2, 'coordinador corrige: versión 2');

select pg_temp.como('20000000-0000-0000-0000-000000000004');

select throws_ok($$select guardar_acta(pg_temp.acta('a',8,1))$$, 'CONFLICTO', 'envío tardío del veedor');
select is((select total_sufragantes from actas), 170, 'la corrección queda intacta');
select is((select rol_ultima_edicion from actas), 'recinto', 'consta quién editó');
select lives_ok($$select guardar_acta(pg_temp.acta('a',1,0))$$, 'reintento ya aplicado no da conflicto tras la corrección');
select is((select total_sufragantes from actas), 170, 'y no pisa la corrección');

select pg_temp.como('20000000-0000-0000-0000-000000000002');

select throws_ok($$select guardar_acta(pg_temp.acta('a',9,0))$$, 'CONFLICTO', 'crear sobre un acta existente');

select pg_temp.como('20000000-0000-0000-0000-000000000005');

select guardar_acta(pg_temp.acta('b',10,0));

select pg_temp.como('20000000-0000-0000-0000-000000000001');

-- R1: 20+20+30+40+50 = 160; R2: 10+20+30+40+50 = 150
select is((select sum(votos)::int from v_resultados where dignidad='alcalde'), 310, 'consolidado coincide con la suma manual');
select is((select sum(votos)::int from v_resultados where dignidad='alcalde' and recinto_id='10000000-0000-0000-0000-000000000001'), 160, 'por recinto coincide');
select is((select array[actas_registradas,actas_esperadas]::int[] from v_avance where recinto_id='10000000-0000-0000-0000-000000000001'), array[1,4], 'avance: 1 de 4 actas');

select * from finish();
rollback;
