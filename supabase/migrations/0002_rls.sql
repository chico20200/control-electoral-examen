-- Acceso por rol y pertenencia (R8). Las funciones son security definer para
-- consultar perfiles/jrvs sin recursión de políticas.
create function privado.rol() returns text
language sql stable security definer set search_path = '' as $$
  select rol from public.perfiles where id = auth.uid() and not debe_cambiar_clave
$$;

create function privado.recinto() returns uuid
language sql stable security definer set search_path = '' as $$
  select recinto_id from public.perfiles where id = auth.uid() and not debe_cambiar_clave
$$;

-- Coordinador del recinto o veedor asignado.
create function privado.gestiona_jrv(p_jrv uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.jrvs j where j.id = p_jrv and (
      (privado.rol() = 'recinto' and j.recinto_id = privado.recinto())
      or (privado.rol() = 'veedor' and j.veedor_id = auth.uid())))
$$;

create function privado.lee_jrv(p_jrv uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(privado.rol() = 'provincial', false) or privado.gestiona_jrv(p_jrv)
$$;

-- Ruta de foto: recinto/jrv/dignidad/archivo.jpg
create function privado.jrv_de_foto(p_ruta text) returns uuid
language sql stable security definer set search_path = '' as $$
  select j.id from public.jrvs j
  where p_ruta ~ '^[^/]+/[^/]+/(alcalde|prefecto)/[^/]+\.jpg$'
    and j.recinto_id::text = split_part(p_ruta, '/', 1)
    and j.id::text = split_part(p_ruta, '/', 2)
$$;

revoke all on all functions in schema privado from public;
grant usage on schema privado to authenticated;
grant execute on function privado.rol, privado.recinto, privado.gestiona_jrv,
  privado.lee_jrv, privado.jrv_de_foto to authenticated;

alter table public.recintos enable row level security;
alter table public.perfiles enable row level security;
alter table public.jrvs enable row level security;
alter table public.organizaciones enable row level security;
alter table public.candidaturas enable row level security;
alter table public.actas enable row level security;
alter table public.votos enable row level security;
alter table public.operaciones enable row level security;

-- Se parte de cero privilegios: no se depende de los permisos por defecto.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.recintos, public.perfiles, public.jrvs, public.organizaciones,
  public.candidaturas, public.actas, public.votos to authenticated;
grant insert on public.recintos to authenticated;
grant all on all tables in schema public to service_role;

create policy leer on public.recintos for select to authenticated
  using ((select privado.rol()) = 'provincial' or ((select privado.rol()) is not null and id = (select privado.recinto())));
create policy crear on public.recintos for insert to authenticated
  with check ((select privado.rol()) = 'provincial');

create policy leer on public.perfiles for select to authenticated
  using (id = (select auth.uid())
    or (select privado.rol()) = 'provincial'
    or ((select privado.rol()) = 'recinto' and rol = 'veedor' and recinto_id = (select privado.recinto())));

create policy leer on public.jrvs for select to authenticated using (privado.lee_jrv(id));
create policy leer on public.organizaciones for select to authenticated using ((select privado.rol()) is not null);
create policy leer on public.candidaturas for select to authenticated using ((select privado.rol()) is not null);
create policy leer on public.actas for select to authenticated using (privado.lee_jrv(jrv_id));
create policy leer on public.votos for select to authenticated
  using (exists (select 1 from public.actas a where a.id = acta_id));

create policy actas_leer on storage.objects for select to authenticated
  using (bucket_id = 'actas' and privado.lee_jrv(privado.jrv_de_foto(name)));
create policy actas_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'actas' and privado.gestiona_jrv(privado.jrv_de_foto(name)));
