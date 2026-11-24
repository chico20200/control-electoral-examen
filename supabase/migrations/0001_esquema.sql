-- Esquema base del control electoral (R1, R2, R6, R7).
create table public.recintos (
  id uuid primary key default gen_random_uuid(),
  provincia text not null check (trim(provincia) <> ''),
  canton text not null check (trim(canton) <> ''),
  parroquia text not null check (trim(parroquia) <> ''),
  nombre text not null check (trim(nombre) <> ''),
  num_jrv int not null check (num_jrv between 1 and 100),
  unique (canton, parroquia, nombre)
);

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  cedula text not null unique check (cedula ~ '^\d{10}$'),
  nombres text not null,
  apellidos text not null,
  telefono text not null,
  correo text not null unique,
  rol text not null check (rol in ('provincial', 'recinto', 'veedor')),
  recinto_id uuid references public.recintos(id),
  debe_cambiar_clave boolean not null default true,
  check ((rol = 'provincial') = (recinto_id is null))
);
-- Un solo coordinador por recinto (R4).
create unique index un_coordinador_por_recinto on public.perfiles(recinto_id) where rol = 'recinto';

create table public.jrvs (
  id uuid primary key default gen_random_uuid(),
  recinto_id uuid not null references public.recintos(id) on delete cascade,
  numero int not null,
  veedor_id uuid references public.perfiles(id) on delete set null,
  unique (recinto_id, numero)
);
create index on public.jrvs(veedor_id);

create table public.organizaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  lista int not null unique
);

create table public.candidaturas (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id),
  dignidad text not null check (dignidad in ('alcalde', 'prefecto')),
  nombre text not null,
  unique (organizacion_id, dignidad)
);

create table public.actas (
  id uuid primary key default gen_random_uuid(),
  jrv_id uuid not null references public.jrvs(id),
  dignidad text not null check (dignidad in ('alcalde', 'prefecto')),
  blancos int not null check (blancos >= 0),
  nulos int not null check (nulos >= 0),
  total_sufragantes int not null check (total_sufragantes >= 0),
  foto_path text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  precision_m double precision not null check (precision_m >= 0),
  capturada_en timestamptz not null,
  version int not null default 1,
  actualizada_en timestamptz not null default now(),
  actualizada_por uuid references public.perfiles(id) on delete set null,
  rol_ultima_edicion text not null,
  unique (jrv_id, dignidad)
);

create table public.votos (
  acta_id uuid not null references public.actas(id) on delete cascade,
  candidatura_id uuid not null references public.candidaturas(id),
  cantidad int not null check (cantidad >= 0),
  primary key (acta_id, candidatura_id)
);

-- Envíos ya aplicados: permite reintentar sin duplicar ni provocar falsos conflictos (R10).
create table public.operaciones (
  id uuid primary key,
  acta_id uuid not null references public.actas(id) on delete cascade,
  usuario_id uuid not null,
  aplicada_en timestamptz not null default now()
);

create schema privado;

create function privado.generar_jrvs() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.jrvs(recinto_id, numero)
  select new.id, n from generate_series(1, new.num_jrv) n;
  return new;
end $$;

create trigger generar_jrvs after insert on public.recintos
for each row execute function privado.generar_jrvs();

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('actas', 'actas', false, 5242880, array['image/jpeg']);
