-- Única vía para escribir actas: autoriza, valida y detecta conflictos en una transacción.
create function public.guardar_acta(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_jrv uuid := (p->>'jrv_id')::uuid;
  v_dignidad text := p->>'dignidad';
  v_op uuid := (p->>'operacion_id')::uuid;
  v_foto text := p->>'foto_path';
  v_acta public.actas;
  v_blancos int;
  v_nulos int;
  v_total int;
  v_suma bigint;
begin
  -- El bloqueo de la mesa serializa ediciones y reasignaciones simultáneas.
  perform 1 from public.jrvs where id = v_jrv for update;
  if not privado.gestiona_jrv(v_jrv) then
    raise exception 'NO_AUTORIZADO';
  end if;

  select * into v_acta from public.actas where jrv_id = v_jrv and dignidad = v_dignidad;

  if exists (select 1 from public.operaciones
             where id = v_op and acta_id = v_acta.id and usuario_id = auth.uid()) then
    return jsonb_build_object('id', v_acta.id, 'version', v_acta.version);
  end if;

  if coalesce((p->>'version_base')::int, 0) <> coalesce(v_acta.version, 0) then
    raise exception 'CONFLICTO';
  end if;

  if v_dignidad is null or v_dignidad not in ('alcalde', 'prefecto')
    or jsonb_typeof(p->'votos') is distinct from 'object'
    or exists (
      select 1 from (
        select value from jsonb_each_text(p->'votos')
        union all values (p->>'blancos'), (p->>'nulos'), (p->>'total_sufragantes')
      ) n where value is null or value !~ '^\d{1,6}$')
    or (select array_agg(key order by key) from jsonb_object_keys(p->'votos') key)
      is distinct from
       (select array_agg(id::text order by id::text) from public.candidaturas where dignidad = v_dignidad)
  then
    raise exception 'VOTOS';
  end if;

  v_blancos := (p->>'blancos')::int;
  v_nulos := (p->>'nulos')::int;
  v_total := (p->>'total_sufragantes')::int;
  select sum(value::int) into v_suma from jsonb_each_text(p->'votos');
  if v_suma + v_blancos + v_nulos <> v_total then
    raise exception 'TOTALES';
  end if;

  if privado.jrv_de_foto(v_foto) is distinct from v_jrv
    or split_part(v_foto, '/', 3) <> v_dignidad
    or not exists (select 1 from storage.objects where bucket_id = 'actas' and name = v_foto)
  then
    raise exception 'FOTO';
  end if;

  insert into public.actas as a (jrv_id, dignidad, blancos, nulos, total_sufragantes, foto_path,
      lat, lng, precision_m, capturada_en, actualizada_por, rol_ultima_edicion)
  values (v_jrv, v_dignidad, v_blancos, v_nulos, v_total, v_foto,
      (p->>'lat')::float8, (p->>'lng')::float8, (p->>'precision_m')::float8,
      (p->>'capturada_en')::timestamptz, auth.uid(), privado.rol())
  on conflict (jrv_id, dignidad) do update set
    blancos = excluded.blancos, nulos = excluded.nulos,
    total_sufragantes = excluded.total_sufragantes, foto_path = excluded.foto_path,
    lat = excluded.lat, lng = excluded.lng, precision_m = excluded.precision_m,
    capturada_en = excluded.capturada_en, actualizada_por = excluded.actualizada_por,
    rol_ultima_edicion = excluded.rol_ultima_edicion,
    actualizada_en = now(), version = a.version + 1
  returning * into v_acta;

  insert into public.votos(acta_id, candidatura_id, cantidad)
  select v_acta.id, key::uuid, value::int from jsonb_each_text(p->'votos')
  on conflict (acta_id, candidatura_id) do update set cantidad = excluded.cantidad;

  insert into public.operaciones(id, acta_id, usuario_id) values (v_op, v_acta.id, auth.uid());

  return jsonb_build_object('id', v_acta.id, 'version', v_acta.version);
end $$;

-- Asigna o reasigna; p_veedor nulo deja la mesa sin veedor.
create function public.asignar_veedor(p_jrv uuid, p_veedor uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if privado.rol() is distinct from 'recinto'
    or not privado.gestiona_jrv(p_jrv)
    or (p_veedor is not null and not exists (
      select 1 from public.perfiles
      where id = p_veedor and rol = 'veedor' and recinto_id = privado.recinto()))
  then
    raise exception 'NO_AUTORIZADO';
  end if;
  update public.jrvs set veedor_id = p_veedor where id = p_jrv;
end $$;

revoke all on function public.guardar_acta, public.asignar_veedor from public, anon;
grant execute on function public.guardar_acta, public.asignar_veedor to authenticated;

-- security_invoker: las vistas respetan la RLS de quien consulta.
create view public.v_resultados with (security_invoker = true) as
select r.id as recinto_id, c.dignidad, c.id as candidatura_id, c.nombre as candidato,
       o.nombre as organizacion, coalesce(sum(v.cantidad), 0)::int as votos
from public.recintos r
cross join public.candidaturas c
join public.organizaciones o on o.id = c.organizacion_id
left join public.jrvs j on j.recinto_id = r.id
left join public.actas a on a.jrv_id = j.id and a.dignidad = c.dignidad
left join public.votos v on v.acta_id = a.id and v.candidatura_id = c.id
group by r.id, c.id, o.id;

create view public.v_avance with (security_invoker = true) as
select r.id as recinto_id, r.nombre as recinto,
       count(a.id)::int as actas_registradas, (r.num_jrv * 2) as actas_esperadas
from public.recintos r
left join public.jrvs j on j.recinto_id = r.id
left join public.actas a on a.jrv_id = j.id
group by r.id;

revoke all on public.v_resultados, public.v_avance from anon, authenticated;
grant select on public.v_resultados, public.v_avance to authenticated, service_role;
