-- Datos de demostración (R1). Organizaciones y candidaturas ficticias.
insert into public.recintos(provincia, canton, parroquia, nombre, num_jrv) values
  ('Pichincha', 'Quito', 'Iñaquito', 'Unidad Educativa Demo Norte', 4),
  ('Pichincha', 'Quito', 'La Magdalena', 'Unidad Educativa Demo Sur', 5),
  ('Pichincha', 'Quito', 'Centro Histórico', 'Colegio Demo Centro', 3),
  ('Pichincha', 'Quito', 'Cumbayá', 'Escuela Demo Valle', 3),
  ('Pichincha', 'Quito', 'Calderón', 'Colegio Demo Calderón', 5),
  ('Pichincha', 'Quito', 'Conocoto', 'Escuela Demo Conocoto', 4);

insert into public.organizaciones(nombre, lista) values
  ('Alianza Andina', 101), ('Movimiento Horizonte', 102), ('Frente Ciudadano Demo', 103),
  ('Unión Territorial', 104), ('Renovación Local', 105);

insert into public.candidaturas(organizacion_id, dignidad, nombre)
select o.id, d.dignidad, 'Candidatura ' || initcap(d.dignidad) || ' ' || o.lista
from public.organizaciones o cross join (values ('alcalde'), ('prefecto')) d(dignidad);
